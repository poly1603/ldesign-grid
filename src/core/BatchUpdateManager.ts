/**
 * Batch update manager for optimized DOM operations
 */

import type { IGridInstance, GridItemOptions, BatchOperation } from '../types'
import { logger } from '../utils/logger'

export interface BatchUpdateOptions {
  enableRAF?: boolean
  debounceDelay?: number
  maxBatchSize?: number
}

export class BatchUpdateManager {
  private grid: IGridInstance
  private options: Required<BatchUpdateOptions>
  private pendingOperations: BatchOperation[] = []
  private rafId: number | null = null
  private flushTimer: number | null = null
  private isFlushing = false

  constructor(grid: IGridInstance, options: BatchUpdateOptions = {}) {
    this.grid = grid
    this.options = {
      enableRAF: options.enableRAF ?? true,
      debounceDelay: options.debounceDelay ?? 16,
      maxBatchSize: options.maxBatchSize ?? 100
    }
  }

  /**
   * Add operation to batch
   */
  private addOperation(operation: BatchOperation): void {
    this.pendingOperations.push(operation)

    // Auto flush if batch is full
    if (this.pendingOperations.length >= this.options.maxBatchSize) {
      this.flush()
      return
    }

    // Schedule flush
    this.scheduleFlush()
  }

  /**
   * Schedule batch flush
   */
  private scheduleFlush(): void {
    if (this.isFlushing) return

    // Clear existing timer
    if (this.flushTimer !== null) {
      clearTimeout(this.flushTimer)
    }

    if (this.options.enableRAF) {
      // Use RAF for visual updates
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId)
      }

      this.rafId = requestAnimationFrame(() => {
        this.flush()
        this.rafId = null
      })
    } else {
      // Use timeout for non-visual updates
      this.flushTimer = window.setTimeout(() => {
        this.flush()
        this.flushTimer = null
      }, this.options.debounceDelay)
    }
  }

  /**
   * Flush all pending operations
   */
  flush(): void {
    if (this.pendingOperations.length === 0 || this.isFlushing) {
      return
    }

    this.isFlushing = true
    const startTime = performance.now()

    // Clear timers
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    if (this.flushTimer !== null) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }

    // Get operations
    const operations = [...this.pendingOperations]
    this.pendingOperations = []

    logger.debug('Flushing batch operations', { count: operations.length })

    // Disable GridStack animation temporarily for better performance
    const originalAnimate = this.grid.native.opts.animate
    if (operations.length > 5) {
      this.grid.native.opts.animate = false
    }

    // Process operations
    const results = {
      added: 0,
      removed: 0,
      updated: 0,
      errors: 0
    }

    try {
      operations.forEach(op => {
        try {
          switch (op.type) {
            case 'add':
              if (op.element && op.options) {
                this.grid.addItem(op.element, op.options)
                results.added++
              }
              break

            case 'remove':
              if (op.id) {
                this.grid.removeItem(op.id)
                results.removed++
              }
              break

            case 'update':
              if (op.id && op.options) {
                this.grid.updateItem(op.id, op.options)
                results.updated++
              }
              break
          }
        } catch (error) {
          logger.error('Batch operation failed', error)
          results.errors++
        }
      })

      // Restore animation setting
      if (operations.length > 5) {
        this.grid.native.opts.animate = originalAnimate
      }

      const duration = performance.now() - startTime

      logger.info('Batch flush completed', {
        ...results,
        duration: duration.toFixed(2) + 'ms'
      })

      // Emit batch complete event
      this.grid.emit('batch:complete', results)

    } catch (error) {
      logger.error('Batch flush error', error)
    } finally {
      this.isFlushing = false
    }
  }

  /**
   * Queue add operation
   */
  queueAdd(element: HTMLElement, options: GridItemOptions): void {
    this.addOperation({
      type: 'add',
      element,
      options
    })
  }

  /**
   * Queue remove operation
   */
  queueRemove(id: string): void {
    this.addOperation({
      type: 'remove',
      id
    })
  }

  /**
   * Queue update operation
   */
  queueUpdate(id: string, options: Partial<GridItemOptions>): void {
    this.addOperation({
      type: 'update',
      id,
      options
    })
  }

  /**
   * Execute batch function
   */
  batch<T>(fn: () => T): T {
    const originalEnableRAF = this.options.enableRAF

    // Temporarily disable RAF during batch
    this.options.enableRAF = false

    try {
      const result = fn()

      // Flush immediately after batch
      this.flush()

      return result
    } finally {
      // Restore RAF setting
      this.options.enableRAF = originalEnableRAF
    }
  }

  /**
   * Execute async batch function
   */
  async batchAsync<T>(fn: () => Promise<T>): Promise<T> {
    const originalEnableRAF = this.options.enableRAF

    // Temporarily disable RAF during batch
    this.options.enableRAF = false

    try {
      const result = await fn()

      // Flush immediately after batch
      this.flush()

      return result
    } finally {
      // Restore RAF setting
      this.options.enableRAF = originalEnableRAF
    }
  }

  /**
   * Get pending operation count
   */
  getPendingCount(): number {
    return this.pendingOperations.length
  }

  /**
   * Check if has pending operations
   */
  hasPending(): boolean {
    return this.pendingOperations.length > 0
  }

  /**
   * Clear pending operations
   */
  clear(): void {
    this.pendingOperations = []

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }

    if (this.flushTimer !== null) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
  }

  /**
   * Force immediate flush
   */
  flushNow(): void {
    // Cancel scheduled flush
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    if (this.flushTimer !== null) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }

    // Flush immediately
    this.flush()
  }

  /**
   * Destroy batch manager
   */
  destroy(): void {
    // Flush any pending operations
    if (this.pendingOperations.length > 0) {
      this.flush()
    }

    this.clear()
  }
}

