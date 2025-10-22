/**
 * Virtual scrolling manager for large grids
 * Only renders items visible in the viewport
 */

import type { IGridInstance, GridItem, Rect } from '../types'
import { isElementVisible, getScrollPosition } from '../utils/grid-utils'
import { throttle } from '../utils/grid-utils'
import { logger } from '../utils/logger'

export interface VirtualScrollOptions {
  enabled?: boolean
  overscan?: number // Number of items to render outside viewport
  itemThreshold?: number // Minimum items before enabling virtual scroll
  updateDelay?: number // Throttle delay for scroll updates
}

export class VirtualScrollManager {
  private grid: IGridInstance
  private options: Required<VirtualScrollOptions>
  private visibleItems = new Set<string>()
  private scrollContainer: HTMLElement
  private rafId: number | null = null
  private scrollListener: (() => void) | null = null

  constructor(grid: IGridInstance, options: VirtualScrollOptions = {}) {
    this.grid = grid
    this.options = {
      enabled: options.enabled ?? true,
      overscan: options.overscan ?? 2,
      itemThreshold: options.itemThreshold ?? 50,
      updateDelay: options.updateDelay ?? 100
    }
    this.scrollContainer = grid.container

    this.init()
  }

  /**
   * Initialize virtual scrolling
   */
  private init(): void {
    if (!this.options.enabled) return

    // Create throttled scroll handler
    this.scrollListener = throttle(() => {
      this.updateVisibleItems()
    }, this.options.updateDelay)

    // Listen to scroll events
    this.scrollContainer.addEventListener('scroll', this.scrollListener, { passive: true })

    // Listen to window resize
    window.addEventListener('resize', this.scrollListener, { passive: true })

    // Initial update
    this.updateVisibleItems()
  }

  /**
   * Check if virtual scroll should be enabled
   */
  shouldEnable(): boolean {
    return this.options.enabled && this.grid.items.size >= this.options.itemThreshold
  }

  /**
   * Update visible items
   */
  private updateVisibleItems(): void {
    if (!this.shouldEnable()) {
      this.showAllItems()
      return
    }

    // Cancel previous RAF
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
    }

    // Schedule update
    this.rafId = requestAnimationFrame(() => {
      this.performUpdate()
      this.rafId = null
    })
  }

  /**
   * Perform the actual visibility update
   */
  private performUpdate(): void {
    const viewport = this.getViewport()
    const newVisibleItems = new Set<string>()

    // Find visible items
    this.grid.getAllItems().forEach(item => {
      const isVisible = this.isItemVisible(item, viewport)

      if (isVisible) {
        newVisibleItems.add(item.id!)

        // Show item if it was hidden
        if (!this.visibleItems.has(item.id!)) {
          this.showItem(item)
        }
      } else {
        // Hide item if it was visible
        if (this.visibleItems.has(item.id!)) {
          this.hideItem(item)
        }
      }
    })

    // Update visible items set
    this.visibleItems = newVisibleItems

    // Update performance monitor
    const monitor = (this.grid as any).performanceMonitor
    if (monitor) {
      monitor.updateItemCount(this.grid.items.size, this.visibleItems.size)
    }

    logger.debug('Virtual scroll update', {
      total: this.grid.items.size,
      visible: this.visibleItems.size
    })
  }

  /**
   * Get viewport rectangle with overscan
   */
  private getViewport(): Rect {
    const rect = this.scrollContainer.getBoundingClientRect()
    const scroll = getScrollPosition(this.scrollContainer)

    // Calculate overscan in pixels
    const cellHeight = this.grid.options.cellHeight || 70
    const overscanPixels = cellHeight * this.options.overscan

    return {
      x: scroll.x - overscanPixels,
      y: scroll.y - overscanPixels,
      width: rect.width + overscanPixels * 2,
      height: rect.height + overscanPixels * 2
    }
  }

  /**
   * Check if item is visible in viewport
   */
  private isItemVisible(item: GridItem, viewport: Rect): boolean {
    if (!item.element) return false

    const itemRect = item.element.getBoundingClientRect()
    const containerRect = this.scrollContainer.getBoundingClientRect()

    // Convert to container-relative coordinates
    const relativeRect: Rect = {
      x: itemRect.left - containerRect.left,
      y: itemRect.top - containerRect.top,
      width: itemRect.width,
      height: itemRect.height
    }

    // Check intersection
    return !(
      relativeRect.x + relativeRect.width < viewport.x ||
      relativeRect.x > viewport.x + viewport.width ||
      relativeRect.y + relativeRect.height < viewport.y ||
      relativeRect.y > viewport.y + viewport.height
    )
  }

  /**
   * Show item (make it visible)
   */
  private showItem(item: GridItem): void {
    if (!item.element) return

    item.element.style.display = ''
    item.element.classList.remove('grid-item-hidden')
    item.element.classList.add('grid-item-visible')
  }

  /**
   * Hide item (remove from DOM or hide)
   */
  private hideItem(item: GridItem): void {
    if (!item.element) return

    // Use visibility instead of display to preserve layout
    item.element.style.display = 'none'
    item.element.classList.remove('grid-item-visible')
    item.element.classList.add('grid-item-hidden')
  }

  /**
   * Show all items
   */
  private showAllItems(): void {
    this.grid.getAllItems().forEach(item => {
      this.showItem(item)
    })
    this.visibleItems = new Set(this.grid.items.keys())
  }

  /**
   * Get visible item count
   */
  getVisibleCount(): number {
    return this.visibleItems.size
  }

  /**
   * Get visible items
   */
  getVisibleItems(): GridItem[] {
    return this.grid.getAllItems().filter(item => this.visibleItems.has(item.id!))
  }

  /**
   * Force update
   */
  update(): void {
    this.updateVisibleItems()
  }

  /**
   * Enable virtual scrolling
   */
  enable(): void {
    this.options.enabled = true
    this.updateVisibleItems()
  }

  /**
   * Disable virtual scrolling
   */
  disable(): void {
    this.options.enabled = false
    this.showAllItems()
  }

  /**
   * Check if enabled
   */
  isEnabled(): boolean {
    return this.shouldEnable()
  }

  /**
   * Destroy virtual scroll manager
   */
  destroy(): void {
    // Cancel RAF
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }

    // Remove listeners
    if (this.scrollListener) {
      this.scrollContainer.removeEventListener('scroll', this.scrollListener)
      window.removeEventListener('resize', this.scrollListener)
      this.scrollListener = null
    }

    // Show all items
    this.showAllItems()
    this.visibleItems.clear()
  }
}

