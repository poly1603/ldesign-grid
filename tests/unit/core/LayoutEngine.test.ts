/**
 * LayoutEngine tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LayoutEngine } from '../../../src/core/LayoutEngine'

function createMockGrid() {
  const items = [
    { id: '1', x: 0, y: 0, w: 2, h: 2, element: document.createElement('div') },
    { id: '2', x: 5, y: 5, w: 3, h: 3, element: document.createElement('div') },
    { id: '3', x: 10, y: 10, w: 1, h: 1, element: document.createElement('div') }
  ]

  return {
    container: document.createElement('div'),
    options: { column: 12, cellHeight: 70 },
    emit: vi.fn(),
    getAllItems: vi.fn(() => items),
    updateItem: vi.fn((id, opts) => {
      const item = items.find(i => i.id === id)
      if (item) {
        Object.assign(item, opts)
      }
    })
  }
}

describe('LayoutEngine', () => {
  let grid: any
  let engine: LayoutEngine

  beforeEach(() => {
    grid = createMockGrid()
    engine = new LayoutEngine(grid)
  })

  it('should be created', () => {
    expect(engine).toBeDefined()
  })

  it('should apply compact layout', () => {
    engine.autoLayout('compact')
    expect(grid.updateItem).toHaveBeenCalled()
  })

  it('should apply flow layout', () => {
    engine.autoLayout('flow')
    expect(grid.updateItem).toHaveBeenCalled()
  })

  it('should apply grid layout', () => {
    engine.autoLayout('grid')
    expect(grid.updateItem).toHaveBeenCalled()
  })

  it('should apply masonry layout', () => {
    engine.autoLayout('masonry')
    expect(grid.updateItem).toHaveBeenCalled()
  })

  it('should apply columns layout', () => {
    engine.autoLayout('columns')
    expect(grid.updateItem).toHaveBeenCalled()
  })

  it('should optimize layout', () => {
    engine.optimizeLayout()
    expect(grid.updateItem).toHaveBeenCalled()
  })

  it('should align items to grid', () => {
    const items = grid.getAllItems()
    items[0].x = 0.5
    items[0].y = 0.7

    engine.alignToGrid()

    expect(grid.updateItem).toHaveBeenCalledWith('1', { x: 1, y: 1 })
  })

  it('should enable/disable snap guides', () => {
    engine.enableSnapGuides()
    engine.disableSnapGuides()
    // Should not throw
  })

  it('should destroy cleanly', () => {
    engine.destroy()
    // Should not throw
  })
})

