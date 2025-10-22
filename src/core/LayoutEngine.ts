/**
 * Layout engine for advanced layout algorithms and auto-arrangement
 */

import type { IGridInstance, GridItem, GridItemOptions } from '../types'
import { logger } from '../utils/logger'

export type LayoutAlgorithm = 'compact' | 'flow' | 'grid' | 'masonry' | 'columns'

export interface LayoutEngineOptions {
  algorithm?: LayoutAlgorithm
  spacing?: number
  padding?: number
  alignItems?: 'start' | 'center' | 'end'
  justifyItems?: 'start' | 'center' | 'end'
}

export interface SnapGuideOptions {
  enabled?: boolean
  threshold?: number
  color?: string
  lineWidth?: number
}

export class LayoutEngine {
  private grid: IGridInstance
  private snapGuides: HTMLElement[] = []
  private snapOptions: Required<SnapGuideOptions>

  constructor(grid: IGridInstance) {
    this.grid = grid
    this.snapOptions = {
      enabled: true,
      threshold: 10,
      color: '#4285f4',
      lineWidth: 1
    }
  }

  /**
   * Apply automatic layout
   */
  autoLayout(algorithm: LayoutAlgorithm = 'compact', options: LayoutEngineOptions = {}): void {
    const items = this.grid.getAllItems()

    logger.info('Applying auto layout', { algorithm, itemCount: items.length })

    switch (algorithm) {
      case 'compact':
        this.applyCompactLayout(items, options)
        break
      case 'flow':
        this.applyFlowLayout(items, options)
        break
      case 'grid':
        this.applyGridLayout(items, options)
        break
      case 'masonry':
        this.applyMasonryLayout(items, options)
        break
      case 'columns':
        this.applyColumnsLayout(items, options)
        break
    }

    this.grid.emit('layout:auto', { algorithm, options })
  }

  /**
   * Compact layout - pack items tightly
   */
  private applyCompactLayout(items: GridItem[], options: LayoutEngineOptions): void {
    const spacing = options.spacing ?? 0
    const columns = this.grid.options.column || 12

    // Sort items by size (largest first)
    const sortedItems = [...items].sort((a, b) => {
      const sizeA = (a.w || 1) * (a.h || 1)
      const sizeB = (b.w || 1) * (b.h || 1)
      return sizeB - sizeA
    })

    // Track occupied cells
    const occupied = new Set<string>()

    sortedItems.forEach(item => {
      const w = item.w || 1
      const h = item.h || 1

      // Find first available position
      let placed = false
      for (let y = 0; y < 100 && !placed; y++) {
        for (let x = 0; x <= columns - w && !placed; x++) {
          if (this.canPlace(x, y, w, h, occupied)) {
            // Place item
            this.grid.updateItem(item.id!, { x, y })

            // Mark cells as occupied
            for (let dy = 0; dy < h; dy++) {
              for (let dx = 0; dx < w; dx++) {
                occupied.add(`${x + dx},${y + dy}`)
              }
            }

            placed = true
          }
        }
      }
    })
  }

  /**
   * Flow layout - left to right, top to bottom
   */
  private applyFlowLayout(items: GridItem[], options: LayoutEngineOptions): void {
    const spacing = options.spacing ?? 0
    const columns = this.grid.options.column || 12

    let x = 0
    let y = 0
    let rowHeight = 0

    items.forEach(item => {
      const w = item.w || 1
      const h = item.h || 1

      // Move to next row if doesn't fit
      if (x + w > columns) {
        x = 0
        y += rowHeight + spacing
        rowHeight = 0
      }

      // Place item
      this.grid.updateItem(item.id!, { x, y })

      // Update position
      x += w + spacing
      rowHeight = Math.max(rowHeight, h)
    })
  }

  /**
   * Grid layout - evenly distributed grid
   */
  private applyGridLayout(items: GridItem[], options: LayoutEngineOptions): void {
    const spacing = options.spacing ?? 1
    const columns = this.grid.options.column || 12

    // Calculate item size
    const itemsPerRow = Math.ceil(Math.sqrt(items.length))
    const itemWidth = Math.floor((columns - (itemsPerRow - 1) * spacing) / itemsPerRow)

    items.forEach((item, index) => {
      const row = Math.floor(index / itemsPerRow)
      const col = index % itemsPerRow

      const x = col * (itemWidth + spacing)
      const y = row * (itemWidth + spacing)

      this.grid.updateItem(item.id!, {
        x,
        y,
        w: itemWidth,
        h: itemWidth
      })
    })
  }

  /**
   * Masonry layout - Pinterest-style
   */
  private applyMasonryLayout(items: GridItem[], options: LayoutEngineOptions): void {
    const columns = this.grid.options.column || 12
    const numColumns = 3 // Number of masonry columns
    const columnWidth = Math.floor(columns / numColumns)

    // Track height of each column
    const columnHeights = new Array(numColumns).fill(0)

    items.forEach(item => {
      // Find shortest column
      const shortestCol = columnHeights.indexOf(Math.min(...columnHeights))

      const x = shortestCol * columnWidth
      const y = columnHeights[shortestCol]
      const w = columnWidth
      const h = item.h || 2

      this.grid.updateItem(item.id!, { x, y, w, h })

      // Update column height
      columnHeights[shortestCol] += h
    })
  }

  /**
   * Columns layout - distribute into columns
   */
  private applyColumnsLayout(items: GridItem[], options: LayoutEngineOptions): void {
    const columns = this.grid.options.column || 12
    const numColumns = 4
    const columnWidth = Math.floor(columns / numColumns)

    items.forEach((item, index) => {
      const col = index % numColumns
      const row = Math.floor(index / numColumns)

      const x = col * columnWidth
      const y = row * (item.h || 2)

      this.grid.updateItem(item.id!, {
        x,
        y,
        w: columnWidth
      })
    })
  }

  /**
   * Check if item can be placed at position
   */
  private canPlace(x: number, y: number, w: number, h: number, occupied: Set<string>): boolean {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        if (occupied.has(`${x + dx},${y + dy}`)) {
          return false
        }
      }
    }
    return true
  }

  /**
   * Show snap guides when dragging
   */
  showSnapGuides(item: GridItem, candidates: GridItem[]): void {
    if (!this.snapOptions.enabled) return

    this.hideSnapGuides()

    const threshold = this.snapOptions.threshold
    const guides: { type: 'vertical' | 'horizontal', position: number }[] = []

    // Check for alignment with other items
    candidates.forEach(candidate => {
      if (candidate.id === item.id) return

      const itemX = item.x || 0
      const itemY = item.y || 0
      const itemW = item.w || 1
      const itemH = item.h || 1

      const candX = candidate.x || 0
      const candY = candidate.y || 0
      const candW = candidate.w || 1
      const candH = candidate.h || 1

      // Vertical alignment
      if (Math.abs(itemX - candX) < threshold) {
        guides.push({ type: 'vertical', position: candX })
      }
      if (Math.abs(itemX + itemW - (candX + candW)) < threshold) {
        guides.push({ type: 'vertical', position: candX + candW })
      }

      // Horizontal alignment
      if (Math.abs(itemY - candY) < threshold) {
        guides.push({ type: 'horizontal', position: candY })
      }
      if (Math.abs(itemY + itemH - (candY + candH)) < threshold) {
        guides.push({ type: 'horizontal', position: candY + candH })
      }
    })

    // Create guide elements
    guides.forEach(guide => {
      this.createSnapGuide(guide.type, guide.position)
    })
  }

  /**
   * Create snap guide element
   */
  private createSnapGuide(type: 'vertical' | 'horizontal', position: number): void {
    const guide = document.createElement('div')
    guide.className = 'grid-snap-guide'

    const cellWidth = this.grid.container.clientWidth / (this.grid.options.column || 12)
    const cellHeight = this.grid.options.cellHeight || 70

    Object.assign(guide.style, {
      position: 'absolute',
      background: this.snapOptions.color,
      pointerEvents: 'none',
      zIndex: '9998'
    })

    if (type === 'vertical') {
      Object.assign(guide.style, {
        left: `${position * cellWidth}px`,
        top: '0',
        width: `${this.snapOptions.lineWidth}px`,
        height: '100%'
      })
    } else {
      Object.assign(guide.style, {
        left: '0',
        top: `${position * cellHeight}px`,
        width: '100%',
        height: `${this.snapOptions.lineWidth}px`
      })
    }

    this.grid.container.appendChild(guide)
    this.snapGuides.push(guide)
  }

  /**
   * Hide snap guides
   */
  hideSnapGuides(): void {
    this.snapGuides.forEach(guide => {
      if (guide.parentNode) {
        guide.parentNode.removeChild(guide)
      }
    })
    this.snapGuides = []
  }

  /**
   * Snap item to guides
   */
  snapToGuides(item: GridItem, candidates: GridItem[]): { x?: number, y?: number } {
    if (!this.snapOptions.enabled) return {}

    const threshold = this.snapOptions.threshold
    const snapped: { x?: number, y?: number } = {}

    const itemX = item.x || 0
    const itemY = item.y || 0
    const itemW = item.w || 1
    const itemH = item.h || 1

    let closestX = Infinity
    let closestY = Infinity

    candidates.forEach(candidate => {
      if (candidate.id === item.id) return

      const candX = candidate.x || 0
      const candY = candidate.y || 0
      const candW = candidate.w || 1
      const candH = candidate.h || 1

      // Check X alignment
      const dxLeft = Math.abs(itemX - candX)
      const dxRight = Math.abs(itemX + itemW - (candX + candW))

      if (dxLeft < threshold && dxLeft < closestX) {
        snapped.x = candX
        closestX = dxLeft
      }
      if (dxRight < threshold && dxRight < closestX) {
        snapped.x = candX + candW - itemW
        closestX = dxRight
      }

      // Check Y alignment
      const dyTop = Math.abs(itemY - candY)
      const dyBottom = Math.abs(itemY + itemH - (candY + candH))

      if (dyTop < threshold && dyTop < closestY) {
        snapped.y = candY
        closestY = dyTop
      }
      if (dyBottom < threshold && dyBottom < closestY) {
        snapped.y = candY + candH - itemH
        closestY = dyBottom
      }
    })

    return snapped
  }

  /**
   * Configure snap guides
   */
  configureSnapGuides(options: Partial<SnapGuideOptions>): void {
    Object.assign(this.snapOptions, options)
  }

  /**
   * Enable snap guides
   */
  enableSnapGuides(): void {
    this.snapOptions.enabled = true
  }

  /**
   * Disable snap guides
   */
  disableSnapGuides(): void {
    this.snapOptions.enabled = false
    this.hideSnapGuides()
  }

  /**
   * Optimize layout - remove gaps
   */
  optimizeLayout(): void {
    this.autoLayout('compact')
    logger.info('Layout optimized')
  }

  /**
   * Align items to grid
   */
  alignToGrid(): void {
    this.grid.getAllItems().forEach(item => {
      this.grid.updateItem(item.id!, {
        x: Math.round(item.x || 0),
        y: Math.round(item.y || 0)
      })
    })
    logger.info('Items aligned to grid')
  }

  /**
   * Destroy layout engine
   */
  destroy(): void {
    this.hideSnapGuides()
  }
}

