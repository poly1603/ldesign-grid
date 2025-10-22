/**
 * @ldesign/grid - Main entry point
 * Feature-rich GridStack wrapper for any framework
 * @version 2.0.0
 */

// Core exports
export { GridManager, getGridManager } from './core/GridManager'
export { GridInstance } from './core/GridInstance'
export { DragManager } from './core/DragManager'
export { NestedGridManager } from './core/NestedGridManager'
export { PerformanceMonitor } from './core/PerformanceMonitor'
export { MemoryManager } from './core/MemoryManager'
export { LayoutSerializer } from './core/LayoutSerializer'
export { ResponsiveManager } from './core/ResponsiveManager'

// v2.0 New managers
export { HistoryManager } from './core/HistoryManager'
export { KeyboardManager } from './core/KeyboardManager'
export { AccessibilityManager } from './core/AccessibilityManager'
export { SelectionManager } from './core/SelectionManager'
export { LayoutEngine } from './core/LayoutEngine'
export { AnimationManager } from './core/AnimationManager'
export { VirtualScrollManager } from './core/VirtualScrollManager'
export { BatchUpdateManager } from './core/BatchUpdateManager'
export { ErrorHandler, ErrorCode, GridError } from './core/ErrorHandler'

// Utilities
export * from './utils/grid-utils'
export * from './utils/collision'
export { EventBus } from './utils/event-bus'
export { Logger, LogLevel, logger } from './utils/logger'
export { TouchHandler } from './utils/touch-handler'
export { ExportHelper } from './utils/export-helper'

// Types
export type * from './types'

// For convenience, export a default factory function
import { GridManager } from './core/GridManager'
import type { GridOptions, IGridInstance } from './types'

/**
 * Create a grid instance
 */
export function createGrid(
  container: HTMLElement | string,
  options: GridOptions = {}
): IGridInstance {
  const element = typeof container === 'string'
    ? document.querySelector(container) as HTMLElement
    : container

  if (!element) {
    throw new Error('Container element not found')
  }

  const manager = GridManager.getInstance()
  return manager.create(element, options)
}

/**
 * Default export
 */
export default {
  createGrid,
  GridManager,
  getGridManager: () => GridManager.getInstance()
}













