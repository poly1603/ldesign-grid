/**
 * Grid utilities tests
 */

import { describe, it, expect } from 'vitest'
import {
  generateId,
  deepClone,
  rectsIntersect,
  pixelToGrid,
  gridToPixel,
  normalizeItemOptions,
  debounce,
  throttle,
  clamp,
  distance
} from '../../../src/utils/grid-utils'

describe('Grid Utils', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
    })

    it('should use prefix', () => {
      const id = generateId('test')
      expect(id).toContain('test')
    })
  })

  describe('deepClone', () => {
    it('should clone primitive values', () => {
      expect(deepClone(42)).toBe(42)
      expect(deepClone('test')).toBe('test')
      expect(deepClone(null)).toBe(null)
    })

    it('should clone arrays', () => {
      const arr = [1, 2, { a: 3 }]
      const cloned = deepClone(arr)
      expect(cloned).toEqual(arr)
      expect(cloned).not.toBe(arr)
      expect(cloned[2]).not.toBe(arr[2])
    })

    it('should clone objects', () => {
      const obj = { a: 1, b: { c: 2 } }
      const cloned = deepClone(obj)
      expect(cloned).toEqual(obj)
      expect(cloned).not.toBe(obj)
      expect(cloned.b).not.toBe(obj.b)
    })

    it('should clone dates', () => {
      const date = new Date()
      const cloned = deepClone(date)
      expect(cloned.getTime()).toBe(date.getTime())
      expect(cloned).not.toBe(date)
    })
  })

  describe('rectsIntersect', () => {
    it('should detect intersection', () => {
      const rect1 = { x: 0, y: 0, width: 100, height: 100 }
      const rect2 = { x: 50, y: 50, width: 100, height: 100 }
      expect(rectsIntersect(rect1, rect2)).toBe(true)
    })

    it('should detect no intersection', () => {
      const rect1 = { x: 0, y: 0, width: 100, height: 100 }
      const rect2 = { x: 200, y: 200, width: 100, height: 100 }
      expect(rectsIntersect(rect1, rect2)).toBe(false)
    })
  })

  describe('pixelToGrid', () => {
    it('should convert pixel to grid coordinates', () => {
      const result = pixelToGrid(150, 200, 50, 100)
      expect(result).toEqual({ x: 3, y: 2 })
    })
  })

  describe('gridToPixel', () => {
    it('should convert grid to pixel coordinates', () => {
      const result = gridToPixel(3, 2, 50, 100)
      expect(result).toEqual({ x: 150, y: 200 })
    })
  })

  describe('normalizeItemOptions', () => {
    it('should provide defaults', () => {
      const options = normalizeItemOptions({})
      expect(options.id).toBeDefined()
      expect(options.x).toBe(0)
      expect(options.y).toBe(0)
      expect(options.w).toBe(1)
      expect(options.h).toBe(1)
      expect(options.locked).toBe(false)
    })

    it('should preserve provided values', () => {
      const options = normalizeItemOptions({
        id: 'custom',
        x: 5,
        y: 10,
        w: 3,
        h: 2
      })

      expect(options.id).toBe('custom')
      expect(options.x).toBe(5)
      expect(options.y).toBe(10)
      expect(options.w).toBe(3)
      expect(options.h).toBe(2)
    })
  })

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      debounced()
      debounced()
      debounced()

      expect(fn).not.toHaveBeenCalled()

      await new Promise(resolve => setTimeout(resolve, 150))
      expect(fn).toHaveBeenCalledTimes(1)
    })
  })

  describe('throttle', () => {
    it('should throttle function calls', async () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled()
      throttled()
      throttled()

      expect(fn).toHaveBeenCalledTimes(1)

      await new Promise(resolve => setTimeout(resolve, 150))
      throttled()
      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('clamp', () => {
    it('should clamp values', () => {
      expect(clamp(5, 0, 10)).toBe(5)
      expect(clamp(-5, 0, 10)).toBe(0)
      expect(clamp(15, 0, 10)).toBe(10)
    })
  })

  describe('distance', () => {
    it('should calculate distance', () => {
      expect(distance(0, 0, 3, 4)).toBe(5)
      expect(distance(0, 0, 0, 0)).toBe(0)
    })
  })
})

