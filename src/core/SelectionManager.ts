/**
 * Selection manager for multi-selection and batch operations
 */

import type { IGridInstance, GridItem, GridItemOptions } from '../types'
import { logger } from '../utils/logger'

export interface SelectionOptions {
  enabled?: boolean
  multiple?: boolean
  toggle?: boolean // Toggle selection on click
  clearOnClickOutside?: boolean
}

export class SelectionManager {
  private grid: IGridInstance
  private options: Required<SelectionOptions>
  private selectedItems = new Set<string>()
  private selectionBox: HTMLElement | null = null
  private isSelecting = false
  private selectionStart: { x: number; y: number } | null = null

  constructor(grid: IGridInstance, options: SelectionOptions = {}) {
    this.grid = grid
    this.options = {
      enabled: options.enabled ?? true,
      multiple: options.multiple ?? true,
      toggle: options.toggle ?? true,
      clearOnClickOutside: options.clearOnClickOutside ?? true
    }

    this.init()
  }

  /**
   * Initialize selection manager
   */
  private init(): void {
    if (!this.options.enabled) return

    this.setupEventListeners()
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Handle item clicks
    this.grid.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      const itemElement = target.closest('.grid-stack-item') as HTMLElement

      if (itemElement) {
        const item = this.grid.getAllItems().find(i => i.element === itemElement)
        if (item) {
          this.handleItemClick(item, e)
        }
      } else if (this.options.clearOnClickOutside) {
        this.clearSelection()
      }
    })

    // Handle box selection
    if (this.options.multiple) {
      this.grid.container.addEventListener('mousedown', (e) => {
        // Only start box selection on empty area
        if ((e.target as HTMLElement).closest('.grid-stack-item')) {
          return
        }

        if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
          this.startBoxSelection(e)
        }
      })
    }

    // Handle keyboard selection
    this.grid.on('item:select', (item: GridItem) => {
      this.toggle(item)
    })

    this.grid.on('items:selectAll', () => {
      this.selectAll()
    })
  }

  /**
   * Handle item click
   */
  private handleItemClick(item: GridItem, event: MouseEvent): void {
    const isMultiSelect = (event.ctrlKey || event.metaKey) && this.options.multiple

    if (isMultiSelect) {
      // Toggle selection with Ctrl/Cmd
      this.toggle(item)
    } else if (event.shiftKey && this.options.multiple) {
      // Range selection with Shift
      this.selectRange(item)
    } else {
      // Single selection
      if (this.options.toggle && this.isSelected(item)) {
        this.deselect(item)
      } else {
        this.select(item, !isMultiSelect)
      }
    }
  }

  /**
   * Start box selection
   */
  private startBoxSelection(e: MouseEvent): void {
    this.isSelecting = true

    const rect = this.grid.container.getBoundingClientRect()
    this.selectionStart = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }

    // Create selection box
    this.selectionBox = document.createElement('div')
    this.selectionBox.className = 'grid-selection-box'
    Object.assign(this.selectionBox.style, {
      position: 'absolute',
      border: '2px dashed #4285f4',
      background: 'rgba(66, 133, 244, 0.1)',
      pointerEvents: 'none',
      zIndex: '9999'
    })
    this.grid.container.appendChild(this.selectionBox)

    const handleMouseMove = (e: MouseEvent) => {
      if (!this.isSelecting || !this.selectionStart || !this.selectionBox) return

      const rect = this.grid.container.getBoundingClientRect()
      const currentX = e.clientX - rect.left
      const currentY = e.clientY - rect.top

      const x = Math.min(this.selectionStart.x, currentX)
      const y = Math.min(this.selectionStart.y, currentY)
      const width = Math.abs(currentX - this.selectionStart.x)
      const height = Math.abs(currentY - this.selectionStart.y)

      Object.assign(this.selectionBox.style, {
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`
      })

      // Select items within box
      this.selectItemsInBox(x, y, width, height)
    }

    const handleMouseUp = () => {
      this.isSelecting = false
      this.selectionStart = null

      if (this.selectionBox && this.selectionBox.parentNode) {
        this.selectionBox.parentNode.removeChild(this.selectionBox)
      }
      this.selectionBox = null

      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  /**
   * Select items within selection box
   */
  private selectItemsInBox(x: number, y: number, width: number, height: number): void {
    const boxRect = { x, y, width, height }

    this.grid.getAllItems().forEach(item => {
      if (!item.element) return

      const itemRect = item.element.getBoundingClientRect()
      const containerRect = this.grid.container.getBoundingClientRect()

      const relativeRect = {
        x: itemRect.left - containerRect.left,
        y: itemRect.top - containerRect.top,
        width: itemRect.width,
        height: itemRect.height
      }

      // Check intersection
      const intersects = !(
        relativeRect.x + relativeRect.width < boxRect.x ||
        relativeRect.x > boxRect.x + boxRect.width ||
        relativeRect.y + relativeRect.height < boxRect.y ||
        relativeRect.y > boxRect.y + boxRect.height
      )

      if (intersects) {
        this.select(item, false)
      }
    })
  }

  /**
   * Select item
   */
  select(item: GridItem, clearOthers = true): void {
    if (!this.options.enabled) return

    if (clearOthers) {
      this.clearSelection()
    }

    if (!this.selectedItems.has(item.id!)) {
      this.selectedItems.add(item.id!)
      item.element?.classList.add('grid-item-selected')
      item.element?.setAttribute('aria-selected', 'true')

      logger.debug('Item selected', { id: item.id, total: this.selectedItems.size })
      this.grid.emit('selection:change', this.getSelectedItems())
    }
  }

  /**
   * Deselect item
   */
  deselect(item: GridItem): void {
    if (this.selectedItems.has(item.id!)) {
      this.selectedItems.delete(item.id!)
      item.element?.classList.remove('grid-item-selected')
      item.element?.setAttribute('aria-selected', 'false')

      logger.debug('Item deselected', { id: item.id, total: this.selectedItems.size })
      this.grid.emit('selection:change', this.getSelectedItems())
    }
  }

  /**
   * Toggle item selection
   */
  toggle(item: GridItem): void {
    if (this.isSelected(item)) {
      this.deselect(item)
    } else {
      this.select(item, false)
    }
  }

  /**
   * Select range of items
   */
  private selectRange(endItem: GridItem): void {
    const items = this.grid.getAllItems()
    const selectedItems = this.getSelectedItems()

    if (selectedItems.length === 0) {
      this.select(endItem)
      return
    }

    const lastSelected = selectedItems[selectedItems.length - 1]
    const startIndex = items.findIndex(i => i.id === lastSelected.id)
    const endIndex = items.findIndex(i => i.id === endItem.id)

    if (startIndex === -1 || endIndex === -1) return

    const [min, max] = startIndex < endIndex
      ? [startIndex, endIndex]
      : [endIndex, startIndex]

    for (let i = min; i <= max; i++) {
      this.select(items[i], false)
    }
  }

  /**
   * Select all items
   */
  selectAll(): void {
    if (!this.options.multiple) return

    this.grid.getAllItems().forEach(item => {
      this.select(item, false)
    })

    logger.info('All items selected', { count: this.selectedItems.size })
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectedItems.forEach(id => {
      const item = this.grid.getItem(id)
      if (item) {
        item.element?.classList.remove('grid-item-selected')
        item.element?.setAttribute('aria-selected', 'false')
      }
    })

    this.selectedItems.clear()

    logger.debug('Selection cleared')
    this.grid.emit('selection:change', [])
  }

  /**
   * Check if item is selected
   */
  isSelected(item: GridItem): boolean {
    return this.selectedItems.has(item.id!)
  }

  /**
   * Get selected items
   */
  getSelectedItems(): GridItem[] {
    return Array.from(this.selectedItems)
      .map(id => this.grid.getItem(id))
      .filter((item): item is GridItem => item !== undefined)
  }

  /**
   * Get selected count
   */
  getSelectedCount(): number {
    return this.selectedItems.size
  }

  /**
   * Batch update selected items
   */
  updateSelected(options: Partial<GridItemOptions>): void {
    const items = this.getSelectedItems()

    items.forEach(item => {
      this.grid.updateItem(item.id!, options)
    })

    logger.info('Batch update performed', { count: items.length, options })
    this.grid.emit('selection:batchUpdate', items, options)
  }

  /**
   * Remove selected items
   */
  removeSelected(): void {
    const items = this.getSelectedItems()
    const ids = items.map(i => i.id!)

    ids.forEach(id => {
      this.grid.removeItem(id)
    })

    this.clearSelection()

    logger.info('Selected items removed', { count: ids.length })
    this.grid.emit('selection:batchRemove', ids)
  }

  /**
   * Duplicate selected items
   */
  duplicateSelected(): GridItem[] {
    const items = this.getSelectedItems()
    const duplicated: GridItem[] = []

    items.forEach(item => {
      const element = document.createElement('div')
      element.className = 'grid-stack-item'

      const content = document.createElement('div')
      content.className = 'grid-stack-item-content'
      content.innerHTML = item.element?.querySelector('.grid-stack-item-content')?.innerHTML || ''
      element.appendChild(content)

      const newItem = this.grid.addItem(element, {
        x: (item.x || 0) + 1,
        y: (item.y || 0) + 1,
        w: item.w,
        h: item.h,
        data: item.data
      })

      duplicated.push(newItem)
    })

    // Select duplicated items
    this.clearSelection()
    duplicated.forEach(item => this.select(item, false))

    logger.info('Selected items duplicated', { count: duplicated.length })
    this.grid.emit('selection:duplicate', duplicated)

    return duplicated
  }

  /**
   * Align selected items
   */
  alignSelected(alignment: 'left' | 'right' | 'top' | 'bottom' | 'center' | 'middle'): void {
    const items = this.getSelectedItems()
    if (items.length < 2) return

    let targetPosition: number

    switch (alignment) {
      case 'left':
        targetPosition = Math.min(...items.map(i => i.x || 0))
        items.forEach(item => this.grid.updateItem(item.id!, { x: targetPosition }))
        break

      case 'right':
        targetPosition = Math.max(...items.map(i => (i.x || 0) + (i.w || 1)))
        items.forEach(item => this.grid.updateItem(item.id!, { x: targetPosition - (item.w || 1) }))
        break

      case 'top':
        targetPosition = Math.min(...items.map(i => i.y || 0))
        items.forEach(item => this.grid.updateItem(item.id!, { y: targetPosition }))
        break

      case 'bottom':
        targetPosition = Math.max(...items.map(i => (i.y || 0) + (i.h || 1)))
        items.forEach(item => this.grid.updateItem(item.id!, { y: targetPosition - (item.h || 1) }))
        break

      case 'center':
        const avgX = items.reduce((sum, i) => sum + (i.x || 0) + (i.w || 1) / 2, 0) / items.length
        items.forEach(item => {
          this.grid.updateItem(item.id!, { x: Math.round(avgX - (item.w || 1) / 2) })
        })
        break

      case 'middle':
        const avgY = items.reduce((sum, i) => sum + (i.y || 0) + (i.h || 1) / 2, 0) / items.length
        items.forEach(item => {
          this.grid.updateItem(item.id!, { y: Math.round(avgY - (item.h || 1) / 2) })
        })
        break
    }

    logger.info('Items aligned', { alignment, count: items.length })
    this.grid.emit('selection:align', items, alignment)
  }

  /**
   * Distribute selected items
   */
  distributeSelected(direction: 'horizontal' | 'vertical'): void {
    const items = this.getSelectedItems()
    if (items.length < 3) return

    items.sort((a, b) => {
      if (direction === 'horizontal') {
        return (a.x || 0) - (b.x || 0)
      } else {
        return (a.y || 0) - (b.y || 0)
      }
    })

    if (direction === 'horizontal') {
      const first = items[0].x || 0
      const last = (items[items.length - 1].x || 0) + (items[items.length - 1].w || 1)
      const gap = (last - first) / (items.length - 1)

      items.forEach((item, index) => {
        this.grid.updateItem(item.id!, { x: Math.round(first + gap * index) })
      })
    } else {
      const first = items[0].y || 0
      const last = (items[items.length - 1].y || 0) + (items[items.length - 1].h || 1)
      const gap = (last - first) / (items.length - 1)

      items.forEach((item, index) => {
        this.grid.updateItem(item.id!, { y: Math.round(first + gap * index) })
      })
    }

    logger.info('Items distributed', { direction, count: items.length })
    this.grid.emit('selection:distribute', items, direction)
  }

  /**
   * Enable selection
   */
  enable(): void {
    this.options.enabled = true
  }

  /**
   * Disable selection
   */
  disable(): void {
    this.options.enabled = false
    this.clearSelection()
  }

  /**
   * Check if enabled
   */
  isEnabled(): boolean {
    return this.options.enabled
  }

  /**
   * Destroy selection manager
   */
  destroy(): void {
    this.clearSelection()

    if (this.selectionBox && this.selectionBox.parentNode) {
      this.selectionBox.parentNode.removeChild(this.selectionBox)
    }

    this.selectionBox = null
    this.isSelecting = false
    this.selectionStart = null
  }
}

