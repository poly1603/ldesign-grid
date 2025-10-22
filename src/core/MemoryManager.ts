/**
 * Memory management for grid instances
 */

import type { GridItem } from '../types'
import { logger } from '../utils/logger'

export interface MemoryStats {
  heapUsed?: number
  heapTotal?: number
  elementPoolSize: number
  cleanupCallbacks: number
  lastGC?: number
}

export class MemoryManager {
  private itemDataMap = new WeakMap<HTMLElement, any>()
  private cleanupCallbacks: Array<() => void> = []
  private cleanupInterval: number | undefined
  private gcThreshold = 100 // items
  private lastGCTime = 0
  private leakDetection = new Map<string, { element: WeakRef<HTMLElement>, timestamp: number }>()
  private leakCheckInterval: number | undefined

  constructor(enableAutoCleanup = true) {
    if (enableAutoCleanup) {
      this.startAutoCleanup()
      this.startLeakDetection()
    }
  }

  /**
   * Store data for element
   */
  setData(element: HTMLElement, data: any): void {
    this.itemDataMap.set(element, data)
  }

  /**
   * Get data for element
   */
  getData(element: HTMLElement): any {
    return this.itemDataMap.get(element)
  }

  /**
   * Check if element has data
   */
  hasData(element: HTMLElement): boolean {
    return this.itemDataMap.has(element)
  }

  /**
   * Register cleanup callback
   */
  registerCleanup(callback: () => void): void {
    this.cleanupCallbacks.push(callback)
  }

  /**
   * Run all cleanup callbacks
   */
  cleanup(): void {
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback()
      } catch (error) {
        console.error('Error during cleanup:', error)
      }
    })
    this.cleanupCallbacks = []
  }

  /**
   * Start automatic cleanup
   */
  private startAutoCleanup(): void {
    this.cleanupInterval = window.setInterval(() => {
      this.performGC()
    }, 30000) // Every 30 seconds
  }

  /**
   * Start memory leak detection
   */
  private startLeakDetection(): void {
    if (typeof WeakRef === 'undefined') {
      logger.warn('WeakRef not supported, leak detection disabled')
      return
    }

    this.leakCheckInterval = window.setInterval(() => {
      this.checkForLeaks()
    }, 60000) // Every minute
  }

  /**
   * Check for memory leaks
   */
  private checkForLeaks(): void {
    const now = Date.now()
    const staleThreshold = 300000 // 5 minutes
    const leaks: string[] = []

    this.leakDetection.forEach((value, key) => {
      // If element is still referenced after threshold, it might be a leak
      if (now - value.timestamp > staleThreshold) {
        const element = value.element.deref()
        if (element && !document.contains(element)) {
          leaks.push(key)
          logger.warn('Potential memory leak detected', { id: key })
        }
      }
    })

    // Clean up detected leaks
    leaks.forEach(id => {
      this.leakDetection.delete(id)
    })
  }

  /**
   * Register element for leak detection
   */
  registerElement(id: string, element: HTMLElement): void {
    if (typeof WeakRef === 'undefined') return

    this.leakDetection.set(id, {
      element: new WeakRef(element),
      timestamp: Date.now()
    })
  }

  /**
   * Unregister element from leak detection
   */
  unregisterElement(id: string): void {
    this.leakDetection.delete(id)
  }

  /**
   * Perform garbage collection
   */
  private performGC(): void {
    const startTime = performance.now()

    // Run cleanup callbacks
    this.cleanup()

    // Suggest GC if available
    if ('gc' in globalThis) {
      try {
        (globalThis as any).gc()
        logger.debug('Manual GC triggered')
      } catch (e) {
        // GC not available
      }
    }

    this.lastGCTime = Date.now()
    const duration = performance.now() - startTime

    logger.debug('GC performed', { duration: duration.toFixed(2) + 'ms' })
  }

  /**
   * Force garbage collection
   */
  forceGC(): void {
    this.performGC()
  }

  /**
   * Get memory usage estimate
   */
  getMemoryUsage(): number | undefined {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return memory.usedJSHeapSize
    }
    return undefined
  }

  /**
   * Clear all event listeners from element
   */
  clearEventListeners(element: HTMLElement): void {
    const clone = element.cloneNode(true) as HTMLElement
    element.parentNode?.replaceChild(clone, element)
  }

  /**
   * Remove all children from element efficiently
   */
  clearChildren(element: HTMLElement): void {
    while (element.firstChild) {
      element.removeChild(element.firstChild)
    }
  }

  /**
   * Lazy load image
   */
  lazyLoadImage(img: HTMLImageElement, src: string): void {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            img.src = src
            observer.unobserve(img)
          }
        })
      })
      observer.observe(img)
    } else {
      img.src = src
    }
  }

  /**
   * Optimize item for memory
   */
  optimizeItem(item: GridItem): void {
    const element = item.element

    // Remove inline styles that can be in CSS
    const unnecessaryStyles = ['position', 'left', 'top', 'width', 'height']
    unnecessaryStyles.forEach(style => {
      if (element.style[style as any]) {
        element.style.removeProperty(style)
      }
    })

    // Lazy load images
    const images = element.querySelectorAll('img[data-src]')
    images.forEach((img: any) => {
      const src = img.getAttribute('data-src')
      if (src) {
        this.lazyLoadImage(img, src)
      }
    })
  }

  /**
   * Pool for reusing DOM elements
   */
  private elementPool: HTMLElement[] = []

  /**
   * Get element from pool or create new
   */
  getElement(tagName = 'div'): HTMLElement {
    if (this.elementPool.length > 0) {
      return this.elementPool.pop()!
    }
    return document.createElement(tagName)
  }

  /**
   * Return element to pool
   */
  recycleElement(element: HTMLElement): void {
    // Clear element
    this.clearChildren(element)
    element.className = ''
    element.removeAttribute('style')

    // Add to pool
    if (this.elementPool.length < 100) {
      this.elementPool.push(element)
    }
  }

  /**
   * Get memory statistics
   */
  getStats(): MemoryStats {
    const stats: MemoryStats = {
      elementPoolSize: this.elementPool.length,
      cleanupCallbacks: this.cleanupCallbacks.length,
      lastGC: this.lastGCTime
    }

    // Add heap stats if available
    if ('memory' in performance) {
      const memory = (performance as any).memory
      stats.heapUsed = memory.usedJSHeapSize
      stats.heapTotal = memory.totalJSHeapSize
    }

    return stats
  }

  /**
   * Get memory usage percentage
   */
  getMemoryUsagePercent(): number | undefined {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    }
    return undefined
  }

  /**
   * Check if memory usage is high
   */
  isMemoryHigh(threshold = 80): boolean {
    const usage = this.getMemoryUsagePercent()
    return usage !== undefined && usage > threshold
  }

  /**
   * Optimize memory if usage is high
   */
  optimizeIfNeeded(): void {
    if (this.isMemoryHigh()) {
      logger.warn('High memory usage detected, performing optimization')
      this.performGC()

      // Clear some of the element pool if it's large
      if (this.elementPool.length > 50) {
        this.elementPool.splice(50)
      }
    }
  }

  /**
   * Destroy and cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = undefined
    }

    if (this.leakCheckInterval) {
      clearInterval(this.leakCheckInterval)
      this.leakCheckInterval = undefined
    }

    this.cleanup()
    this.elementPool = []
    this.leakDetection.clear()
  }
}













