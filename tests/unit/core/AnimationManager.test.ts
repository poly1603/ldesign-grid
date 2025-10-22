/**
 * AnimationManager tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AnimationManager } from '../../../src/core/AnimationManager'

function createMockGrid() {
  return {
    getAllItems: vi.fn(() => [])
  }
}

function createMockItem() {
  const element = document.createElement('div')
  return {
    id: 'test-item',
    x: 0,
    y: 0,
    w: 2,
    h: 2,
    element
  }
}

describe('AnimationManager', () => {
  let grid: any
  let animation: AnimationManager

  beforeEach(() => {
    grid = createMockGrid()
    animation = new AnimationManager(grid)
  })

  it('should be created', () => {
    expect(animation).toBeDefined()
  })

  it('should animate item addition', async () => {
    const item = createMockItem()
    await animation.animateAdd(item, 'fade', { duration: 10 })
    expect(item.element.style.opacity).toBe('1')
  })

  it('should handle none animation', async () => {
    const item = createMockItem()
    await animation.animateAdd(item, 'none')
    // Should resolve immediately
  })

  it('should animate with different presets', async () => {
    const item = createMockItem()

    await Promise.all([
      animation.animateAdd(createMockItem(), 'fade', { duration: 10 }),
      animation.animateAdd(createMockItem(), 'slide', { duration: 10 }),
      animation.animateAdd(createMockItem(), 'scale', { duration: 10 }),
      animation.animateAdd(createMockItem(), 'bounce', { duration: 10 }),
      animation.animateAdd(createMockItem(), 'flip', { duration: 10 })
    ])

    // All should complete without error
  })

  it('should pulse item', async () => {
    const item = createMockItem()
    await animation.pulse(item, 1, { duration: 10 })
    // Should complete
  })

  it('should shake item', async () => {
    const item = createMockItem()

    // Mock animate function
    item.element.animate = vi.fn().mockReturnValue({
      onfinish: null,
      finished: Promise.resolve()
    })

    await animation.shake(item, { duration: 10 })
    expect(item.element.animate).toHaveBeenCalled()
  })

  it('should flash item', async () => {
    const item = createMockItem()

    item.element.animate = vi.fn().mockReturnValue({
      onfinish: null,
      finished: Promise.resolve()
    })

    await animation.flash(item, { duration: 10 })
    expect(item.element.animate).toHaveBeenCalled()
  })

  it('should set default duration', () => {
    animation.setDefaultDuration(500)
    expect(animation.getDefaultDuration()).toBe(500)
  })

  it('should set default easing', () => {
    animation.setDefaultEasing('ease-in')
    expect(animation.getDefaultEasing()).toBe('ease-in')
  })

  it('should handle missing element gracefully', async () => {
    const item = createMockItem()
    item.element = null as any

    await animation.animateAdd(item, 'fade')
    // Should not throw
  })
})

