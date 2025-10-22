/**
 * Keyboard navigation and shortcuts manager
 */

import type { IGridInstance, GridItem } from '../types'
import { logger } from '../utils/logger'

export interface KeyBinding {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  handler: (grid: IGridInstance, focusedItem?: GridItem) => void
  description?: string
}

export interface KeyboardOptions {
  enabled?: boolean
  enableNavigation?: boolean
  enableShortcuts?: boolean
  customBindings?: KeyBinding[]
}

export class KeyboardManager {
  private grid: IGridInstance
  private options: Required<Omit<KeyboardOptions, 'customBindings'>> & { customBindings: KeyBinding[] }
  private focusedItem: GridItem | null = null
  private keyBindings: Map<string, KeyBinding> = new Map()
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null

  constructor(grid: IGridInstance, options: KeyboardOptions = {}) {
    this.grid = grid
    this.options = {
      enabled: options.enabled ?? true,
      enableNavigation: options.enableNavigation ?? true,
      enableShortcuts: options.enableShortcuts ?? true,
      customBindings: options.customBindings || []
    }

    this.init()
  }

  /**
   * Initialize keyboard manager
   */
  private init(): void {
    if (!this.options.enabled) return

    // Setup default key bindings
    this.setupDefaultBindings()

    // Setup custom bindings
    this.options.customBindings.forEach(binding => {
      this.addBinding(binding)
    })

    // Setup event listeners
    this.setupEventListeners()
  }

  /**
   * Setup default key bindings
   */
  private setupDefaultBindings(): void {
    // Navigation keys
    if (this.options.enableNavigation) {
      this.addBinding({
        key: 'ArrowUp',
        handler: (grid, item) => this.moveFocus('up'),
        description: 'Move focus up'
      })

      this.addBinding({
        key: 'ArrowDown',
        handler: (grid, item) => this.moveFocus('down'),
        description: 'Move focus down'
      })

      this.addBinding({
        key: 'ArrowLeft',
        handler: (grid, item) => this.moveFocus('left'),
        description: 'Move focus left'
      })

      this.addBinding({
        key: 'ArrowRight',
        handler: (grid, item) => this.moveFocus('right'),
        description: 'Move focus right'
      })

      this.addBinding({
        key: 'Tab',
        handler: (grid, item) => this.moveFocusNext(),
        description: 'Move to next item'
      })

      this.addBinding({
        key: 'Tab',
        shift: true,
        handler: (grid, item) => this.moveFocusPrevious(),
        description: 'Move to previous item'
      })

      this.addBinding({
        key: 'Home',
        handler: (grid, item) => this.moveFocusFirst(),
        description: 'Move to first item'
      })

      this.addBinding({
        key: 'End',
        handler: (grid, item) => this.moveFocusLast(),
        description: 'Move to last item'
      })
    }

    // Shortcut keys
    if (this.options.enableShortcuts) {
      this.addBinding({
        key: 'Delete',
        handler: (grid, item) => {
          if (item) {
            grid.removeItem(item.id!)
            logger.info('Item deleted via keyboard', { id: item.id })
          }
        },
        description: 'Delete focused item'
      })

      this.addBinding({
        key: 'Escape',
        handler: (grid, item) => {
          this.clearFocus()
        },
        description: 'Clear focus'
      })

      this.addBinding({
        key: 'Enter',
        handler: (grid, item) => {
          if (item) {
            grid.emit('item:activate', item)
          }
        },
        description: 'Activate item'
      })

      this.addBinding({
        key: ' ', // Space
        handler: (grid, item) => {
          if (item) {
            grid.emit('item:select', item)
          }
        },
        description: 'Select/deselect item'
      })

      // Ctrl+A: Select all
      this.addBinding({
        key: 'a',
        ctrl: true,
        handler: (grid) => {
          grid.emit('items:selectAll')
        },
        description: 'Select all items'
      })

      // Ctrl+C: Copy
      this.addBinding({
        key: 'c',
        ctrl: true,
        handler: (grid, item) => {
          if (item) {
            this.copyItem(item)
          }
        },
        description: 'Copy item'
      })

      // Ctrl+X: Cut
      this.addBinding({
        key: 'x',
        ctrl: true,
        handler: (grid, item) => {
          if (item) {
            this.cutItem(item)
          }
        },
        description: 'Cut item'
      })

      // Ctrl+V: Paste
      this.addBinding({
        key: 'v',
        ctrl: true,
        handler: (grid) => {
          this.pasteItem()
        },
        description: 'Paste item'
      })
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.keydownHandler = (e: KeyboardEvent) => {
      // Only handle if grid or child is focused
      if (!this.isGridFocused()) {
        return
      }

      this.handleKeyDown(e)
    }

    window.addEventListener('keydown', this.keydownHandler)

    // Focus management
    this.grid.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      const itemElement = target.closest('.grid-stack-item') as HTMLElement

      if (itemElement) {
        const item = this.grid.getAllItems().find(i => i.element === itemElement)
        if (item) {
          this.setFocus(item)
        }
      }
    })

    // Make container focusable
    if (!this.grid.container.hasAttribute('tabindex')) {
      this.grid.container.setAttribute('tabindex', '0')
    }
  }

  /**
   * Handle keydown event
   */
  private handleKeyDown(e: KeyboardEvent): void {
    const bindingKey = this.createBindingKey(e)
    const binding = this.keyBindings.get(bindingKey)

    if (binding) {
      e.preventDefault()
      e.stopPropagation()

      try {
        binding.handler(this.grid, this.focusedItem || undefined)
      } catch (error) {
        logger.error('Error executing key binding', error)
      }
    }
  }

  /**
   * Create binding key from event
   */
  private createBindingKey(e: KeyboardEvent): string {
    const parts: string[] = []

    if (e.ctrlKey || e.metaKey) parts.push('ctrl')
    if (e.shiftKey) parts.push('shift')
    if (e.altKey) parts.push('alt')
    parts.push(e.key)

    return parts.join('+')
  }

  /**
   * Create binding key from binding definition
   */
  private createBindingKeyFromDef(binding: KeyBinding): string {
    const parts: string[] = []

    const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)

    if (binding.ctrl || binding.meta) parts.push('ctrl')
    if (binding.shift) parts.push('shift')
    if (binding.alt) parts.push('alt')
    parts.push(binding.key)

    return parts.join('+')
  }

  /**
   * Add key binding
   */
  addBinding(binding: KeyBinding): void {
    const key = this.createBindingKeyFromDef(binding)
    this.keyBindings.set(key, binding)

    logger.debug('Key binding added', { key, description: binding.description })
  }

  /**
   * Remove key binding
   */
  removeBinding(key: string): void {
    this.keyBindings.delete(key)
  }

  /**
   * Get all bindings
   */
  getBindings(): KeyBinding[] {
    return Array.from(this.keyBindings.values())
  }

  /**
   * Check if grid is focused
   */
  private isGridFocused(): boolean {
    const activeElement = document.activeElement
    return (
      activeElement === this.grid.container ||
      this.grid.container.contains(activeElement)
    )
  }

  /**
   * Set focus to item
   */
  setFocus(item: GridItem | null): void {
    // Clear previous focus
    if (this.focusedItem && this.focusedItem !== item) {
      this.focusedItem.element?.classList.remove('grid-item-focused')
      this.focusedItem.element?.removeAttribute('aria-current')
    }

    // Set new focus
    this.focusedItem = item

    if (item) {
      item.element?.classList.add('grid-item-focused')
      item.element?.setAttribute('aria-current', 'true')
      item.element?.focus()

      // Emit focus event
      this.grid.emit('item:focus', item)

      logger.debug('Item focused', { id: item.id })
    }
  }

  /**
   * Clear focus
   */
  clearFocus(): void {
    if (this.focusedItem) {
      this.focusedItem.element?.classList.remove('grid-item-focused')
      this.focusedItem.element?.removeAttribute('aria-current')
      this.grid.emit('item:blur', this.focusedItem)
    }

    this.focusedItem = null
    this.grid.container.focus()
  }

  /**
   * Get focused item
   */
  getFocusedItem(): GridItem | null {
    return this.focusedItem
  }

  /**
   * Move focus in direction
   */
  private moveFocus(direction: 'up' | 'down' | 'left' | 'right'): void {
    if (!this.focusedItem) {
      this.moveFocusFirst()
      return
    }

    const items = this.grid.getAllItems()
    const current = this.focusedItem

    let closest: GridItem | null = null
    let closestDistance = Infinity

    items.forEach(item => {
      if (item === current) return

      const dx = (item.x || 0) - (current.x || 0)
      const dy = (item.y || 0) - (current.y || 0)

      let isValidDirection = false
      let distance = 0

      switch (direction) {
        case 'up':
          isValidDirection = dy < 0
          distance = Math.abs(dy) + Math.abs(dx) * 0.5
          break
        case 'down':
          isValidDirection = dy > 0
          distance = Math.abs(dy) + Math.abs(dx) * 0.5
          break
        case 'left':
          isValidDirection = dx < 0
          distance = Math.abs(dx) + Math.abs(dy) * 0.5
          break
        case 'right':
          isValidDirection = dx > 0
          distance = Math.abs(dx) + Math.abs(dy) * 0.5
          break
      }

      if (isValidDirection && distance < closestDistance) {
        closest = item
        closestDistance = distance
      }
    })

    if (closest) {
      this.setFocus(closest)
    }
  }

  /**
   * Move focus to next item
   */
  private moveFocusNext(): void {
    const items = this.grid.getAllItems()
    if (items.length === 0) return

    const currentIndex = this.focusedItem
      ? items.findIndex(i => i.id === this.focusedItem!.id)
      : -1

    const nextIndex = (currentIndex + 1) % items.length
    this.setFocus(items[nextIndex])
  }

  /**
   * Move focus to previous item
   */
  private moveFocusPrevious(): void {
    const items = this.grid.getAllItems()
    if (items.length === 0) return

    const currentIndex = this.focusedItem
      ? items.findIndex(i => i.id === this.focusedItem!.id)
      : 0

    const prevIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1
    this.setFocus(items[prevIndex])
  }

  /**
   * Move focus to first item
   */
  private moveFocusFirst(): void {
    const items = this.grid.getAllItems()
    if (items.length > 0) {
      this.setFocus(items[0])
    }
  }

  /**
   * Move focus to last item
   */
  private moveFocusLast(): void {
    const items = this.grid.getAllItems()
    if (items.length > 0) {
      this.setFocus(items[items.length - 1])
    }
  }

  /**
   * Copy item to clipboard
   */
  private clipboard: any = null

  private copyItem(item: GridItem): void {
    this.clipboard = {
      action: 'copy',
      data: {
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        content: item.element?.innerHTML,
        data: item.data
      }
    }

    logger.info('Item copied', { id: item.id })
    this.grid.emit('item:copy', item)
  }

  /**
   * Cut item to clipboard
   */
  private cutItem(item: GridItem): void {
    this.copyItem(item)
    this.clipboard.action = 'cut'
    this.clipboard.itemId = item.id

    logger.info('Item cut', { id: item.id })
    this.grid.emit('item:cut', item)
  }

  /**
   * Paste item from clipboard
   */
  private pasteItem(): void {
    if (!this.clipboard) {
      logger.debug('Nothing to paste')
      return
    }

    const data = this.clipboard.data
    const element = document.createElement('div')
    element.className = 'grid-stack-item'

    const content = document.createElement('div')
    content.className = 'grid-stack-item-content'
    content.innerHTML = data.content || ''
    element.appendChild(content)

    const newItem = this.grid.addItem(element, {
      x: (data.x || 0) + 1,
      y: (data.y || 0) + 1,
      w: data.w,
      h: data.h,
      data: data.data
    })

    // If it was cut, remove the original
    if (this.clipboard.action === 'cut' && this.clipboard.itemId) {
      this.grid.removeItem(this.clipboard.itemId)
      this.clipboard = null
    }

    this.setFocus(newItem)

    logger.info('Item pasted')
    this.grid.emit('item:paste', newItem)
  }

  /**
   * Enable keyboard manager
   */
  enable(): void {
    this.options.enabled = true
  }

  /**
   * Disable keyboard manager
   */
  disable(): void {
    this.options.enabled = false
    this.clearFocus()
  }

  /**
   * Check if enabled
   */
  isEnabled(): boolean {
    return this.options.enabled
  }

  /**
   * Destroy keyboard manager
   */
  destroy(): void {
    if (this.keydownHandler) {
      window.removeEventListener('keydown', this.keydownHandler)
      this.keydownHandler = null
    }

    this.clearFocus()
    this.keyBindings.clear()
    this.clipboard = null
  }
}

