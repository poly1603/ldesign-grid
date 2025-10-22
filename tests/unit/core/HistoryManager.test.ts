/**
 * HistoryManager tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { HistoryManager, ActionType } from '../../../src/core/HistoryManager'

// Mock grid instance
function createMockGrid() {
  const items = new Map()

  return {
    id: 'test-grid',
    items,
    on: vi.fn(),
    emit: vi.fn(),
    addItem: vi.fn((el, opts) => {
      const item = { ...opts, element: el, id: opts.id }
      items.set(opts.id, item)
      return item
    }),
    removeItem: vi.fn((id) => {
      items.delete(id)
    }),
    updateItem: vi.fn((id, opts) => {
      const item = items.get(id)
      if (item) {
        Object.assign(item, opts)
      }
    }),
    getItem: vi.fn((id) => items.get(id)),
    save: vi.fn(() => ({ items: Array.from(items.values()) })),
    load: vi.fn()
  }
}

describe('HistoryManager', () => {
  let grid: any
  let history: HistoryManager

  beforeEach(() => {
    grid = createMockGrid()
    history = new HistoryManager(grid, {
      enabled: true,
      maxSize: 10,
      captureInterval: 0,
      groupTimeout: 10
    })
  })

  it('should be created', () => {
    expect(history).toBeDefined()
  })

  it('should track undo/redo state', () => {
    expect(history.canUndo()).toBe(false)
    expect(history.canRedo()).toBe(false)
  })

  it('should get stack sizes', () => {
    expect(history.getUndoStackSize()).toBe(0)
    expect(history.getRedoStackSize()).toBe(0)
  })

  it('should enable/disable', () => {
    history.disable()
    expect(history.isEnabled()).toBe(false)

    history.enable()
    expect(history.isEnabled()).toBe(true)
  })

  it('should clear history', () => {
    history.clear()
    expect(history.canUndo()).toBe(false)
  })

  it('should create checkpoints', () => {
    history.createCheckpoint('test')
    expect(history.canUndo()).toBe(true)
  })

  it('should destroy cleanly', () => {
    history.destroy()
    expect(history.canUndo()).toBe(false)
  })
})

