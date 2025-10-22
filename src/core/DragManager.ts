/**
 * Drag Manager - Handles external drag sources and drag operations
 * Enhanced with touch support and drag copy
 */

import type { DragSourceOptions, DragEventData, GridItemOptions, IGridInstance } from '../types'
import { generateId, normalizeItemOptions } from '../utils/grid-utils'
import { TouchHandler, type TouchEventData } from '../utils/touch-handler'
import { logger } from '../utils/logger'

export class DragManager {
  private grid: IGridInstance
  private dragSources = new WeakMap<HTMLElement, DragSourceOptions>()
  private touchHandlers = new WeakMap<HTMLElement, TouchHandler>()
  private activeDrag: DragEventData | null = null
  private placeholder: HTMLElement | null = null
  private isDragging = false
  private dragCopy = false // Ctrl+Drag to copy
  private touchDragElement: HTMLElement | null = null

  constructor(grid: IGridInstance) {
    this.grid = grid
    this.init()
  }

  /**
   * Initialize drag manager
   */
  private init(): void {
    // Setup drop zone on grid container
    this.setupDropZone()
  }

  /**
   * Setup drop zone
   */
  private setupDropZone(): void {
    const container = this.grid.container

    container.addEventListener('dragover', this.handleDragOver)
    container.addEventListener('drop', this.handleDrop)
    container.addEventListener('dragleave', this.handleDragLeave)
  }

  /**
   * Register external drag source (supports both mouse and touch)
   */
  registerDragSource(element: HTMLElement, options: DragSourceOptions): () => void {
    // Store options
    this.dragSources.set(element, options)

    // Make element draggable
    element.setAttribute('draggable', 'true')
    element.classList.add('grid-drag-source')

    // Mouse drag handlers
    const handleDragStart = (e: DragEvent) => {
      this.handleDragStart(e, element, options)
    }

    const handleDragEnd = (e: DragEvent) => {
      this.handleDragEnd(e)
    }

    element.addEventListener('dragstart', handleDragStart)
    element.addEventListener('dragend', handleDragEnd)

    // Touch drag handlers
    const touchHandler = new TouchHandler(element, {
      onTouchStart: (data) => this.handleTouchDragStart(data, element, options),
      onTouchMove: (data) => this.handleTouchDragMove(data),
      onTouchEnd: (data) => this.handleTouchDragEnd(data)
    })

    this.touchHandlers.set(element, touchHandler)

    // Return cleanup function
    return () => {
      this.dragSources.delete(element)
      element.removeAttribute('draggable')
      element.classList.remove('grid-drag-source')
      element.removeEventListener('dragstart', handleDragStart)
      element.removeEventListener('dragend', handleDragEnd)

      // Cleanup touch handler
      const handler = this.touchHandlers.get(element)
      if (handler) {
        handler.destroy()
        this.touchHandlers.delete(element)
      }
    }
  }

  /**
   * Unregister drag source
   */
  unregisterDragSource(element: HTMLElement): void {
    this.dragSources.delete(element)
    element.removeAttribute('draggable')
    element.classList.remove('grid-drag-source')
  }

  /**
   * Handle drag start
   */
  private handleDragStart = (e: DragEvent, element: HTMLElement, options: DragSourceOptions): void => {
    if (!e.dataTransfer) return

    this.isDragging = true

    // Check for copy mode (Ctrl/Cmd key)
    this.dragCopy = e.ctrlKey || e.metaKey

    // Set drag data
    const dragData = {
      source: element,
      data: options.data,
      itemOptions: options.itemOptions,
      event: e
    }

    this.activeDrag = dragData

    // Set data transfer
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('application/json', JSON.stringify({
      data: options.data,
      itemOptions: options.itemOptions
    }))

    // Set drag image
    if (options.preview) {
      const preview = typeof options.preview === 'string'
        ? this.createPreviewFromHTML(options.preview)
        : options.preview.cloneNode(true) as HTMLElement

      preview.style.position = 'absolute'
      preview.style.top = '-1000px'
      document.body.appendChild(preview)
      e.dataTransfer.setDragImage(preview, 0, 0)

      setTimeout(() => document.body.removeChild(preview), 0)
    } else if (options.helper === 'clone') {
      const clone = element.cloneNode(true) as HTMLElement
      clone.style.position = 'absolute'
      clone.style.top = '-1000px'
      document.body.appendChild(clone)
      e.dataTransfer.setDragImage(clone, 0, 0)

      setTimeout(() => document.body.removeChild(clone), 0)
    }

    // Add dragging class
    element.classList.add('dragging')

    // Emit event
    this.grid.container.dispatchEvent(
      new CustomEvent('drag-start', { detail: dragData })
    )
  }

  /**
   * Handle drag over
   */
  private handleDragOver = (e: DragEvent): void => {
    if (!this.isDragging && !e.dataTransfer?.types.includes('application/json')) {
      return
    }

    e.preventDefault()
    e.stopPropagation()

    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy'
    }

    // Calculate grid position
    const rect = this.grid.container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Show placeholder
    this.showPlaceholder(x, y)
  }

  /**
   * Handle drop
   */
  private handleDrop = (e: DragEvent): void => {
    e.preventDefault()
    e.stopPropagation()

    if (!e.dataTransfer) return

    // Get drop data
    let dropData: any
    try {
      const jsonData = e.dataTransfer.getData('application/json')
      if (jsonData) {
        dropData = JSON.parse(jsonData)
      }
    } catch (error) {
      logger.error('Failed to parse drop data', error)
    }

    // Calculate grid position
    const rect = this.grid.container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const gridPos = this.calculateGridPosition(x, y)

    // Create item options
    const itemOptions: GridItemOptions = {
      ...normalizeItemOptions(dropData?.itemOptions || {}),
      x: gridPos.x,
      y: gridPos.y,
      autoPosition: true
    }

    // Create new grid item
    const element = this.createItemElement(dropData?.data)
    const item = this.grid.addItem(element, itemOptions)

    // Remove placeholder
    this.removePlaceholder()

    // Emit event
    this.grid.container.dispatchEvent(
      new CustomEvent('item-dropped', {
        detail: {
          item,
          data: this.activeDrag,
          isCopy: this.dragCopy
        }
      })
    )

    logger.info('Item dropped', {
      id: item.id,
      isCopy: this.dragCopy,
      position: gridPos
    })

    this.isDragging = false
    this.activeDrag = null
    this.dragCopy = false
  }

  /**
   * Handle drag leave
   */
  private handleDragLeave = (e: DragEvent): void => {
    // Check if really leaving the container
    const rect = this.grid.container.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY

    if (
      x < rect.left ||
      x > rect.right ||
      y < rect.top ||
      y > rect.bottom
    ) {
      this.removePlaceholder()
    }
  }

  /**
   * Handle drag end
   */
  private handleDragEnd = (e: DragEvent): void => {
    if (this.activeDrag) {
      this.activeDrag.source.classList.remove('dragging')
    }

    this.isDragging = false
    this.activeDrag = null
    this.removePlaceholder()
  }

  /**
   * Show placeholder at position
   */
  private showPlaceholder(x: number, y: number): void {
    if (!this.placeholder) {
      this.placeholder = document.createElement('div')
      this.placeholder.className = 'grid-stack-placeholder'
      this.placeholder.style.position = 'absolute'
      this.placeholder.style.border = '2px dashed #ccc'
      this.placeholder.style.background = 'rgba(0, 0, 0, 0.05)'
      this.placeholder.style.pointerEvents = 'none'
      this.placeholder.style.zIndex = '100'
    }

    const gridPos = this.calculateGridPosition(x, y)
    const itemOptions = this.activeDrag?.itemOptions || { w: 1, h: 1 }

    const cellWidth = this.grid.container.clientWidth / (this.grid.options.column || 12)
    const cellHeight = this.grid.options.cellHeight || 70

    this.placeholder.style.left = `${gridPos.x * cellWidth}px`
    this.placeholder.style.top = `${gridPos.y * cellHeight}px`
    this.placeholder.style.width = `${(itemOptions.w || 1) * cellWidth}px`
    this.placeholder.style.height = `${(itemOptions.h || 1) * cellHeight}px`

    if (!this.placeholder.parentNode) {
      this.grid.container.appendChild(this.placeholder)
    }
  }

  /**
   * Remove placeholder
   */
  private removePlaceholder(): void {
    if (this.placeholder && this.placeholder.parentNode) {
      this.placeholder.parentNode.removeChild(this.placeholder)
    }
  }

  /**
   * Calculate grid position from pixel position
   */
  private calculateGridPosition(x: number, y: number): { x: number; y: number } {
    const columns = this.grid.options.column || 12
    const cellWidth = this.grid.container.clientWidth / columns
    const cellHeight = this.grid.options.cellHeight || 70

    return {
      x: Math.floor(x / cellWidth),
      y: Math.floor(y / cellHeight)
    }
  }

  /**
   * Create item element from data
   */
  private createItemElement(data: any): HTMLElement {
    const element = document.createElement('div')
    element.className = 'grid-stack-item'

    const content = document.createElement('div')
    content.className = 'grid-stack-item-content'

    if (data) {
      if (typeof data === 'string') {
        content.innerHTML = data
      } else if (data.content) {
        content.innerHTML = data.content
      } else {
        content.textContent = JSON.stringify(data)
      }
    }

    element.appendChild(content)
    return element
  }

  /**
   * Create preview element from HTML
   */
  private createPreviewFromHTML(html: string): HTMLElement {
    const template = document.createElement('template')
    template.innerHTML = html.trim()
    return template.content.firstChild as HTMLElement
  }

  /**
   * Get active drag data
   */
  getActiveDrag(): DragEventData | null {
    return this.activeDrag
  }

  /**
   * Check if dragging
   */
  isDraggingActive(): boolean {
    return this.isDragging
  }

  /**
   * Handle touch drag start
   */
  private handleTouchDragStart(data: TouchEventData, element: HTMLElement, options: DragSourceOptions): void {
    this.isDragging = true
    this.touchDragElement = element.cloneNode(true) as HTMLElement

    // Style the drag element
    Object.assign(this.touchDragElement.style, {
      position: 'fixed',
      left: `${data.currentX}px`,
      top: `${data.currentY}px`,
      opacity: '0.8',
      pointerEvents: 'none',
      zIndex: '10000',
      transform: 'scale(1.1)'
    })

    document.body.appendChild(this.touchDragElement)

    this.activeDrag = {
      source: element,
      data: options.data,
      itemOptions: options.itemOptions,
      event: null as any
    }

    element.classList.add('dragging')
    logger.debug('Touch drag started', { element: element.className })
  }

  /**
   * Handle touch drag move
   */
  private handleTouchDragMove(data: TouchEventData): void {
    if (!this.isDragging || !this.touchDragElement) return

    // Move the drag element
    this.touchDragElement.style.left = `${data.currentX}px`
    this.touchDragElement.style.top = `${data.currentY}px`

    // Check if over grid
    const gridRect = this.grid.container.getBoundingClientRect()
    const isOverGrid =
      data.currentX >= gridRect.left &&
      data.currentX <= gridRect.right &&
      data.currentY >= gridRect.top &&
      data.currentY <= gridRect.bottom

    if (isOverGrid) {
      const x = data.currentX - gridRect.left
      const y = data.currentY - gridRect.top
      this.showPlaceholder(x, y)
    } else {
      this.removePlaceholder()
    }
  }

  /**
   * Handle touch drag end
   */
  private handleTouchDragEnd(data: TouchEventData): void {
    if (!this.isDragging) return

    // Remove touch drag element
    if (this.touchDragElement && this.touchDragElement.parentNode) {
      this.touchDragElement.parentNode.removeChild(this.touchDragElement)
      this.touchDragElement = null
    }

    // Check if dropped on grid
    const gridRect = this.grid.container.getBoundingClientRect()
    const isOverGrid =
      data.currentX >= gridRect.left &&
      data.currentX <= gridRect.right &&
      data.currentY >= gridRect.top &&
      data.currentY <= gridRect.bottom

    if (isOverGrid && this.activeDrag) {
      // Calculate grid position
      const x = data.currentX - gridRect.left
      const y = data.currentY - gridRect.top
      const gridPos = this.calculateGridPosition(x, y)

      // Create item options
      const itemOptions: GridItemOptions = {
        ...normalizeItemOptions(this.activeDrag.itemOptions || {}),
        x: gridPos.x,
        y: gridPos.y,
        autoPosition: true
      }

      // Create new grid item
      const element = this.createItemElement(this.activeDrag.data)
      const item = this.grid.addItem(element, itemOptions)

      // Emit event
      this.grid.container.dispatchEvent(
        new CustomEvent('item-dropped', {
          detail: {
            item,
            data: this.activeDrag,
            isTouch: true
          }
        })
      )

      logger.info('Touch item dropped', { id: item.id, position: gridPos })
    }

    // Cleanup
    if (this.activeDrag) {
      this.activeDrag.source.classList.remove('dragging')
    }

    this.removePlaceholder()
    this.isDragging = false
    this.activeDrag = null
  }

  /**
   * Enable drag copy mode
   */
  enableDragCopy(): void {
    this.dragCopy = true
  }

  /**
   * Disable drag copy mode
   */
  disableDragCopy(): void {
    this.dragCopy = false
  }

  /**
   * Check if drag copy is enabled
   */
  isDragCopyEnabled(): boolean {
    return this.dragCopy
  }

  /**
   * Destroy drag manager
   */
  destroy(): void {
    const container = this.grid.container
    container.removeEventListener('dragover', this.handleDragOver)
    container.removeEventListener('drop', this.handleDrop)
    container.removeEventListener('dragleave', this.handleDragLeave)

    // Destroy all touch handlers
    this.touchHandlers.forEach(handler => handler.destroy())
    this.touchHandlers = new WeakMap()

    // Remove touch drag element if exists
    if (this.touchDragElement && this.touchDragElement.parentNode) {
      this.touchDragElement.parentNode.removeChild(this.touchDragElement)
    }

    this.removePlaceholder()
    this.isDragging = false
    this.activeDrag = null
    this.touchDragElement = null
  }
}













