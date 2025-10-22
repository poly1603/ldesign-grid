/**
 * History manager for undo/redo functionality
 */

import type { IGridInstance, GridItemOptions, GridLayout } from '../types'
import { deepClone } from '../utils/grid-utils'
import { logger } from '../utils/logger'
import { ErrorCode, handleError } from './ErrorHandler'

export enum ActionType {
  ADD_ITEM = 'ADD_ITEM',
  REMOVE_ITEM = 'REMOVE_ITEM',
  UPDATE_ITEM = 'UPDATE_ITEM',
  MOVE_ITEM = 'MOVE_ITEM',
  RESIZE_ITEM = 'RESIZE_ITEM',
  BATCH = 'BATCH',
  LAYOUT_CHANGE = 'LAYOUT_CHANGE'
}

export interface HistoryAction {
  type: ActionType
  timestamp: number
  data: any
  undo: () => void
  redo: () => void
}

export interface HistoryOptions {
  maxSize?: number
  enabled?: boolean
  captureInterval?: number // Minimum ms between captures
  groupTimeout?: number // Timeout for grouping actions
}

export class HistoryManager {
  private grid: IGridInstance
  private options: Required<HistoryOptions>
  private undoStack: HistoryAction[] = []
  private redoStack: HistoryAction[] = []
  private isPerformingAction = false
  private lastCaptureTime = 0
  private groupingTimer: number | null = null
  private pendingActions: HistoryAction[] = []

  constructor(grid: IGridInstance, options: HistoryOptions = {}) {
    this.grid = grid
    this.options = {
      maxSize: options.maxSize ?? 50,
      enabled: options.enabled ?? true,
      captureInterval: options.captureInterval ?? 300,
      groupTimeout: options.groupTimeout ?? 500
    }

    this.init()
  }

  /**
   * Initialize history manager
   */
  private init(): void {
    if (!this.options.enabled) return

    // Listen to grid events
    this.grid.on('added', (item) => {
      if (!this.isPerformingAction) {
        this.recordAddItem(item)
      }
    })

    this.grid.on('removed', (item) => {
      if (!this.isPerformingAction) {
        this.recordRemoveItem(item)
      }
    })

    this.grid.on('updated', (item) => {
      if (!this.isPerformingAction) {
        this.recordUpdateItem(item)
      }
    })

    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts()
  }

  /**
   * Setup keyboard shortcuts for undo/redo
   */
  private setupKeyboardShortcuts(): void {
    if (typeof window === 'undefined') return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if grid container or child is focused
      if (!this.grid.container.contains(document.activeElement)) {
        return
      }

      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform)
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey

      // Ctrl+Z / Cmd+Z: Undo
      if (ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        this.undo()
      }
      // Ctrl+Shift+Z / Cmd+Shift+Z or Ctrl+Y: Redo
      else if (ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        this.redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

      // Store reference for cleanup
      ; (this as any)._keyboardHandler = handleKeyDown
  }

  /**
   * Record add item action
   */
  private recordAddItem(item: any): void {
    const itemData = this.captureItemData(item)

    const action: HistoryAction = {
      type: ActionType.ADD_ITEM,
      timestamp: Date.now(),
      data: { item: itemData },
      undo: () => {
        this.grid.removeItem(item.id)
      },
      redo: () => {
        const element = this.recreateItemElement(itemData)
        this.grid.addItem(element, itemData)
      }
    }

    this.pushAction(action)
  }

  /**
   * Record remove item action
   */
  private recordRemoveItem(item: any): void {
    const itemData = this.captureItemData(item)

    const action: HistoryAction = {
      type: ActionType.REMOVE_ITEM,
      timestamp: Date.now(),
      data: { item: itemData },
      undo: () => {
        const element = this.recreateItemElement(itemData)
        this.grid.addItem(element, itemData)
      },
      redo: () => {
        this.grid.removeItem(itemData.id)
      }
    }

    this.pushAction(action)
  }

  /**
   * Record update item action
   */
  private recordUpdateItem(item: any): void {
    const now = Date.now()

    // Throttle captures
    if (now - this.lastCaptureTime < this.options.captureInterval) {
      return
    }
    this.lastCaptureTime = now

    const currentItem = this.grid.getItem(item.id)
    if (!currentItem) return

    const oldData = this.captureItemData(item)
    const newData = this.captureItemData(currentItem)

    const action: HistoryAction = {
      type: ActionType.UPDATE_ITEM,
      timestamp: now,
      data: { oldItem: oldData, newItem: newData },
      undo: () => {
        this.grid.updateItem(oldData.id, oldData)
      },
      redo: () => {
        this.grid.updateItem(newData.id, newData)
      }
    }

    this.pushAction(action)
  }

  /**
   * Capture item data for history
   */
  private captureItemData(item: any): GridItemOptions {
    return {
      id: item.id,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      minW: item.minW,
      maxW: item.maxW,
      minH: item.minH,
      maxH: item.maxH,
      locked: item.locked,
      noResize: item.noResize,
      noMove: item.noMove,
      content: item.element?.innerHTML,
      data: deepClone(item.data)
    }
  }

  /**
   * Recreate item element from data
   */
  private recreateItemElement(itemData: GridItemOptions): HTMLElement {
    const element = document.createElement('div')
    element.className = 'grid-stack-item'

    const content = document.createElement('div')
    content.className = 'grid-stack-item-content'

    if (itemData.content) {
      if (typeof itemData.content === 'string') {
        content.innerHTML = itemData.content
      } else {
        content.appendChild(itemData.content as HTMLElement)
      }
    }

    element.appendChild(content)
    return element
  }

  /**
   * Push action to undo stack
   */
  private pushAction(action: HistoryAction): void {
    // Clear redo stack when new action is added
    this.redoStack = []

    // Add to pending actions for grouping
    this.pendingActions.push(action)

    // Clear existing timer
    if (this.groupingTimer) {
      clearTimeout(this.groupingTimer)
    }

    // Set new timer to flush pending actions
    this.groupingTimer = window.setTimeout(() => {
      this.flushPendingActions()
    }, this.options.groupTimeout)
  }

  /**
   * Flush pending actions to undo stack
   */
  private flushPendingActions(): void {
    if (this.pendingActions.length === 0) return

    let actionToAdd: HistoryAction

    if (this.pendingActions.length === 1) {
      actionToAdd = this.pendingActions[0]
    } else {
      // Create batch action
      const actions = [...this.pendingActions]
      actionToAdd = {
        type: ActionType.BATCH,
        timestamp: Date.now(),
        data: { actions },
        undo: () => {
          // Undo in reverse order
          for (let i = actions.length - 1; i >= 0; i--) {
            actions[i].undo()
          }
        },
        redo: () => {
          // Redo in forward order
          for (const action of actions) {
            action.redo()
          }
        }
      }
    }

    this.undoStack.push(actionToAdd)
    this.pendingActions = []
    this.groupingTimer = null

    // Limit stack size
    if (this.undoStack.length > this.options.maxSize) {
      this.undoStack.shift()
    }

    logger.debug('Action recorded', {
      type: actionToAdd.type,
      undoStackSize: this.undoStack.length
    })
  }

  /**
   * Undo last action
   */
  undo(): boolean {
    // Flush any pending actions first
    if (this.groupingTimer) {
      clearTimeout(this.groupingTimer)
      this.flushPendingActions()
    }

    if (this.undoStack.length === 0) {
      logger.debug('Nothing to undo')
      return false
    }

    const action = this.undoStack.pop()!
    this.isPerformingAction = true

    try {
      action.undo()
      this.redoStack.push(action)

      logger.info('Undo performed', { type: action.type })

      // Emit event
      this.grid.emit('history:undo', action)

      return true
    } catch (error) {
      handleError(ErrorCode.INVALID_OPERATION, 'Failed to undo action', error)
      // Restore action to undo stack
      this.undoStack.push(action)
      return false
    } finally {
      this.isPerformingAction = false
    }
  }

  /**
   * Redo last undone action
   */
  redo(): boolean {
    if (this.redoStack.length === 0) {
      logger.debug('Nothing to redo')
      return false
    }

    const action = this.redoStack.pop()!
    this.isPerformingAction = true

    try {
      action.redo()
      this.undoStack.push(action)

      logger.info('Redo performed', { type: action.type })

      // Emit event
      this.grid.emit('history:redo', action)

      return true
    } catch (error) {
      handleError(ErrorCode.INVALID_OPERATION, 'Failed to redo action', error)
      // Restore action to redo stack
      this.redoStack.push(action)
      return false
    } finally {
      this.isPerformingAction = false
    }
  }

  /**
   * Clear history
   */
  clear(): void {
    // Flush pending actions
    if (this.groupingTimer) {
      clearTimeout(this.groupingTimer)
      this.flushPendingActions()
    }

    this.undoStack = []
    this.redoStack = []

    logger.info('History cleared')
  }

  /**
   * Check if can undo
   */
  canUndo(): boolean {
    return this.undoStack.length > 0 || this.pendingActions.length > 0
  }

  /**
   * Check if can redo
   */
  canRedo(): boolean {
    return this.redoStack.length > 0
  }

  /**
   * Get undo stack size
   */
  getUndoStackSize(): number {
    return this.undoStack.length + (this.pendingActions.length > 0 ? 1 : 0)
  }

  /**
   * Get redo stack size
   */
  getRedoStackSize(): number {
    return this.redoStack.length
  }

  /**
   * Enable history tracking
   */
  enable(): void {
    this.options.enabled = true
  }

  /**
   * Disable history tracking
   */
  disable(): void {
    this.options.enabled = false
  }

  /**
   * Check if enabled
   */
  isEnabled(): boolean {
    return this.options.enabled
  }

  /**
   * Create checkpoint (layout snapshot)
   */
  createCheckpoint(name?: string): void {
    const layout = this.grid.save()

    const action: HistoryAction = {
      type: ActionType.LAYOUT_CHANGE,
      timestamp: Date.now(),
      data: { name, layout: deepClone(layout) },
      undo: () => {
        this.grid.load(layout)
      },
      redo: () => {
        const currentLayout = this.grid.save()
        this.grid.load(currentLayout)
      }
    }

    this.undoStack.push(action)
    this.redoStack = []

    logger.info('Checkpoint created', { name })
  }

  /**
   * Destroy history manager
   */
  destroy(): void {
    // Clear timers
    if (this.groupingTimer) {
      clearTimeout(this.groupingTimer)
      this.groupingTimer = null
    }

    // Remove keyboard listener
    const handler = (this as any)._keyboardHandler
    if (handler) {
      window.removeEventListener('keydown', handler)
    }

    // Clear stacks
    this.clear()
    this.pendingActions = []
  }
}

