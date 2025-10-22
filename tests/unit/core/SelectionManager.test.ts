/**
 * SelectionManager tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SelectionManager } from '../../../src/core/SelectionManager'

function createMockGrid() {
  const items = [
    { id: '1', x: 0, y: 0, w: 2, h: 2, element: document.createElement('div') },
    { id: '2', x: 2, y: 0, w: 2, h: 2, element: document.createElement('div') },
    { id: '3', x: 4, y: 0, w: 2, h: 2, element: document.createElement('div') }
  ]

  return {
    container: document.createElement('div'),
    on: vi.fn(),
    emit: vi.fn(),
    getAllItems: vi.fn(() => items),
    getItem: vi.fn((id: string) => items.find(i => i.id === id)),
    updateItem: vi.fn(),
    removeItem: vi.fn()
  }
}

describe('SelectionManager', () => {
  let grid: any
  let selection: SelectionManager

  beforeEach(() => {
    grid = createMockGrid()
    selection = new SelectionManager(grid, {
      enabled: true,
      multiple: true
    })
  })

  it('should be created', () => {
    expect(selection).toBeDefined()
  })

  it('should select items', () => {
    const items = grid.getAllItems()
    selection.select(items[0])

    expect(selection.isSelected(items[0])).toBe(true)
    expect(selection.getSelectedCount()).toBe(1)
  })

  it('should deselect items', () => {
    const items = grid.getAllItems()
    selection.select(items[0])
    selection.deselect(items[0])

    expect(selection.isSelected(items[0])).toBe(false)
  })

  it('should toggle selection', () => {
    const items = grid.getAllItems()

    selection.toggle(items[0])
    expect(selection.isSelected(items[0])).toBe(true)

    selection.toggle(items[0])
    expect(selection.isSelected(items[0])).toBe(false)
  })

  it('should select all items', () => {
    selection.selectAll()
    expect(selection.getSelectedCount()).toBe(3)
  })

  it('should clear selection', () => {
    selection.selectAll()
    selection.clearSelection()

    expect(selection.getSelectedCount()).toBe(0)
  })

  it('should get selected items', () => {
    const items = grid.getAllItems()
    selection.select(items[0], false)
    selection.select(items[1], false)

    const selected = selection.getSelectedItems()
    expect(selected).toHaveLength(2)
  })

  it('should update selected items', () => {
    const items = grid.getAllItems()
    selection.select(items[0], false)
    selection.select(items[1], false)

    selection.updateSelected({ w: 3 })

    expect(grid.updateItem).toHaveBeenCalledTimes(2)
  })

  it('should remove selected items', () => {
    const items = grid.getAllItems()
    selection.select(items[0], false)
    selection.select(items[1], false)

    selection.removeSelected()

    expect(grid.removeItem).toHaveBeenCalledTimes(2)
  })

  it('should enable/disable', () => {
    selection.disable()
    expect(selection.isEnabled()).toBe(false)

    selection.enable()
    expect(selection.isEnabled()).toBe(true)
  })

  it('should destroy cleanly', () => {
    selection.selectAll()
    selection.destroy()

    expect(selection.getSelectedCount()).toBe(0)
  })
})

