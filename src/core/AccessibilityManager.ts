/**
 * Accessibility manager for ARIA support and screen readers
 */

import type { IGridInstance, GridItem } from '../types'
import { logger } from '../utils/logger'

export interface AccessibilityOptions {
  enabled?: boolean
  announcements?: boolean
  labels?: boolean
  descriptions?: boolean
  liveRegion?: boolean
}

export class AccessibilityManager {
  private grid: IGridInstance
  private options: Required<AccessibilityOptions>
  private liveRegion: HTMLElement | null = null
  private announcementQueue: string[] = []
  private announcementTimer: number | null = null

  constructor(grid: IGridInstance, options: AccessibilityOptions = {}) {
    this.grid = grid
    this.options = {
      enabled: options.enabled ?? true,
      announcements: options.announcements ?? true,
      labels: options.labels ?? true,
      descriptions: options.descriptions ?? true,
      liveRegion: options.liveRegion ?? true
    }

    this.init()
  }

  /**
   * Initialize accessibility features
   */
  private init(): void {
    if (!this.options.enabled) return

    // Setup container ARIA attributes
    this.setupContainerAria()

    // Setup live region for announcements
    if (this.options.liveRegion) {
      this.setupLiveRegion()
    }

    // Setup event listeners
    this.setupEventListeners()
  }

  /**
   * Setup container ARIA attributes
   */
  private setupContainerAria(): void {
    const container = this.grid.container

    // Set role
    container.setAttribute('role', 'grid')

    // Set aria-label
    if (!container.hasAttribute('aria-label') && !container.hasAttribute('aria-labelledby')) {
      container.setAttribute('aria-label', 'Draggable grid layout')
    }

    // Make focusable
    if (!container.hasAttribute('tabindex')) {
      container.setAttribute('tabindex', '0')
    }

    // Set aria-multiselectable
    container.setAttribute('aria-multiselectable', 'true')

    // Set aria-readonly
    const isReadOnly = this.grid.options.staticGrid || false
    container.setAttribute('aria-readonly', String(isReadOnly))
  }

  /**
   * Setup live region for screen reader announcements
   */
  private setupLiveRegion(): void {
    this.liveRegion = document.createElement('div')
    this.liveRegion.className = 'grid-sr-only'
    this.liveRegion.setAttribute('role', 'status')
    this.liveRegion.setAttribute('aria-live', 'polite')
    this.liveRegion.setAttribute('aria-atomic', 'true')

    // Visually hidden but accessible to screen readers
    Object.assign(this.liveRegion.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      margin: '-1px',
      padding: '0',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: '0'
    })

    this.grid.container.appendChild(this.liveRegion)
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Announce when items are added
    this.grid.on('added', (item: GridItem) => {
      if (this.options.announcements) {
        this.announce(`Item added at position ${item.x}, ${item.y}`)
      }
      this.setupItemAria(item)
    })

    // Announce when items are removed
    this.grid.on('removed', (item: GridItem) => {
      if (this.options.announcements) {
        this.announce(`Item removed from position ${item.x}, ${item.y}`)
      }
    })

    // Announce when items are moved/resized
    this.grid.on('change', (items: GridItem[]) => {
      if (this.options.announcements && items.length > 0) {
        const item = items[0]
        this.announce(`Item moved to position ${item.x}, ${item.y}, size ${item.w} by ${item.h}`)
      }
    })

    // Announce drag operations
    this.grid.on('dragstart', (item: GridItem) => {
      if (this.options.announcements) {
        this.announce(`Started dragging item`)
      }
    })

    this.grid.on('dragstop', (item: GridItem) => {
      if (this.options.announcements) {
        this.announce(`Stopped dragging. Item is now at position ${item.x}, ${item.y}`)
      }
    })

    // Announce resize operations
    this.grid.on('resizestart', (item: GridItem) => {
      if (this.options.announcements) {
        this.announce(`Started resizing item`)
      }
    })

    this.grid.on('resizestop', (item: GridItem) => {
      if (this.options.announcements) {
        this.announce(`Stopped resizing. Item size is now ${item.w} by ${item.h}`)
      }
    })

    // Announce focus changes
    this.grid.on('item:focus', (item: GridItem) => {
      if (this.options.announcements) {
        this.announce(`Focused item at position ${item.x}, ${item.y}`)
      }
    })
  }

  /**
   * Setup ARIA attributes for grid item
   */
  private setupItemAria(item: GridItem): void {
    if (!item.element || !this.options.enabled) return

    const element = item.element

    // Set role
    element.setAttribute('role', 'gridcell')

    // Set tabindex
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '-1')
    }

    // Set aria-label if labels are enabled
    if (this.options.labels) {
      if (!element.hasAttribute('aria-label') && !element.hasAttribute('aria-labelledby')) {
        const label = this.generateItemLabel(item)
        element.setAttribute('aria-label', label)
      }
    }

    // Set aria-description if descriptions are enabled
    if (this.options.descriptions) {
      const description = this.generateItemDescription(item)
      if (description) {
        element.setAttribute('aria-description', description)
      }
    }

    // Set aria-grabbed for draggable items
    if (!item.locked && !item.noMove) {
      element.setAttribute('aria-grabbed', 'false')
    }

    // Set aria-disabled for locked items
    if (item.locked) {
      element.setAttribute('aria-disabled', 'true')
    }

    // Set aria-readonly if resize is disabled
    if (item.noResize) {
      element.setAttribute('aria-readonly', 'true')
    }

    // Add position information
    element.setAttribute('aria-rowindex', String((item.y || 0) + 1))
    element.setAttribute('aria-colindex', String((item.x || 0) + 1))
  }

  /**
   * Generate accessible label for item
   */
  private generateItemLabel(item: GridItem): string {
    const content = item.element?.textContent?.trim()
    if (content && content.length > 0 && content.length < 50) {
      return content
    }

    return `Grid item at row ${(item.y || 0) + 1}, column ${(item.x || 0) + 1}`
  }

  /**
   * Generate accessible description for item
   */
  private generateItemDescription(item: GridItem): string {
    const parts: string[] = []

    parts.push(`Position: row ${(item.y || 0) + 1}, column ${(item.x || 0) + 1}`)
    parts.push(`Size: ${item.w} columns wide, ${item.h} rows tall`)

    if (item.locked) {
      parts.push('Locked')
    } else {
      if (!item.noMove) {
        parts.push('Draggable')
      }
      if (!item.noResize) {
        parts.push('Resizable')
      }
    }

    return parts.join('. ')
  }

  /**
   * Announce message to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.options.announcements || !this.liveRegion) return

    this.announcementQueue.push(message)

    // Update live region priority if needed
    if (priority === 'assertive') {
      this.liveRegion.setAttribute('aria-live', 'assertive')
    }

    // Debounce announcements
    if (this.announcementTimer) {
      clearTimeout(this.announcementTimer)
    }

    this.announcementTimer = window.setTimeout(() => {
      this.flushAnnouncements()
    }, 100)

    logger.debug('Accessibility announcement', { message, priority })
  }

  /**
   * Flush announcement queue
   */
  private flushAnnouncements(): void {
    if (!this.liveRegion || this.announcementQueue.length === 0) return

    // Take the last announcement if multiple are queued
    const message = this.announcementQueue[this.announcementQueue.length - 1]
    this.announcementQueue = []

    // Clear and set new message
    this.liveRegion.textContent = ''

    // Force reflow
    void this.liveRegion.offsetHeight

    this.liveRegion.textContent = message

    // Reset to polite after announcement
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.setAttribute('aria-live', 'polite')
      }
    }, 1000)

    this.announcementTimer = null
  }

  /**
   * Update item ARIA attributes
   */
  updateItemAria(item: GridItem): void {
    this.setupItemAria(item)
  }

  /**
   * Set item as dragging
   */
  setItemDragging(item: GridItem, isDragging: boolean): void {
    if (!item.element) return

    if (!item.locked && !item.noMove) {
      item.element.setAttribute('aria-grabbed', String(isDragging))
    }
  }

  /**
   * Set item as selected
   */
  setItemSelected(item: GridItem, isSelected: boolean): void {
    if (!item.element) return

    item.element.setAttribute('aria-selected', String(isSelected))
  }

  /**
   * Set item as current
   */
  setItemCurrent(item: GridItem, isCurrent: boolean): void {
    if (!item.element) return

    if (isCurrent) {
      item.element.setAttribute('aria-current', 'true')
    } else {
      item.element.removeAttribute('aria-current')
    }
  }

  /**
   * Enable high contrast mode
   */
  enableHighContrast(): void {
    this.grid.container.classList.add('grid-high-contrast')
    this.announce('High contrast mode enabled')
  }

  /**
   * Disable high contrast mode
   */
  disableHighContrast(): void {
    this.grid.container.classList.remove('grid-high-contrast')
    this.announce('High contrast mode disabled')
  }

  /**
   * Check if high contrast mode is enabled
   */
  isHighContrastEnabled(): boolean {
    return this.grid.container.classList.contains('grid-high-contrast')
  }

  /**
   * Toggle high contrast mode
   */
  toggleHighContrast(): void {
    if (this.isHighContrastEnabled()) {
      this.disableHighContrast()
    } else {
      this.enableHighContrast()
    }
  }

  /**
   * Get ARIA attributes for item
   */
  getItemAriaAttributes(item: GridItem): Record<string, string> {
    if (!item.element) return {}

    const attributes: Record<string, string> = {}
    const element = item.element

    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith('aria-')) {
        attributes[attr.name] = attr.value
      }
    })

    return attributes
  }

  /**
   * Validate accessibility
   */
  validate(): string[] {
    const issues: string[] = []

    // Check container
    if (!this.grid.container.hasAttribute('role')) {
      issues.push('Container missing role attribute')
    }

    if (!this.grid.container.hasAttribute('aria-label') && !this.grid.container.hasAttribute('aria-labelledby')) {
      issues.push('Container missing aria-label or aria-labelledby')
    }

    // Check items
    this.grid.getAllItems().forEach((item, index) => {
      if (!item.element) return

      if (!item.element.hasAttribute('role')) {
        issues.push(`Item ${index} missing role attribute`)
      }

      if (!item.element.hasAttribute('aria-label') && !item.element.hasAttribute('aria-labelledby')) {
        issues.push(`Item ${index} missing aria-label or aria-labelledby`)
      }
    })

    return issues
  }

  /**
   * Enable accessibility
   */
  enable(): void {
    this.options.enabled = true
    this.setupContainerAria()

    this.grid.getAllItems().forEach(item => {
      this.setupItemAria(item)
    })
  }

  /**
   * Disable accessibility
   */
  disable(): void {
    this.options.enabled = false
  }

  /**
   * Check if enabled
   */
  isEnabled(): boolean {
    return this.options.enabled
  }

  /**
   * Destroy accessibility manager
   */
  destroy(): void {
    // Clear announcement timer
    if (this.announcementTimer) {
      clearTimeout(this.announcementTimer)
      this.announcementTimer = null
    }

    // Remove live region
    if (this.liveRegion && this.liveRegion.parentNode) {
      this.liveRegion.parentNode.removeChild(this.liveRegion)
      this.liveRegion = null
    }

    // Clear queue
    this.announcementQueue = []
  }
}

