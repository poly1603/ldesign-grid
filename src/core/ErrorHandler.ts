/**
 * Centralized error handling for grid operations
 */

import { logger } from '../utils/logger'

export enum ErrorCode {
  // Grid errors
  GRID_INIT_FAILED = 'GRID_INIT_FAILED',
  GRID_DESTROY_FAILED = 'GRID_DESTROY_FAILED',
  GRID_NOT_FOUND = 'GRID_NOT_FOUND',
  GRID_MAX_INSTANCES = 'GRID_MAX_INSTANCES',

  // Item errors
  ITEM_ADD_FAILED = 'ITEM_ADD_FAILED',
  ITEM_REMOVE_FAILED = 'ITEM_REMOVE_FAILED',
  ITEM_UPDATE_FAILED = 'ITEM_UPDATE_FAILED',
  ITEM_NOT_FOUND = 'ITEM_NOT_FOUND',

  // Layout errors
  LAYOUT_INVALID = 'LAYOUT_INVALID',
  LAYOUT_LOAD_FAILED = 'LAYOUT_LOAD_FAILED',
  LAYOUT_SAVE_FAILED = 'LAYOUT_SAVE_FAILED',

  // Drag errors
  DRAG_INIT_FAILED = 'DRAG_INIT_FAILED',
  DRAG_INVALID_SOURCE = 'DRAG_INVALID_SOURCE',

  // Performance errors
  PERFORMANCE_DEGRADED = 'PERFORMANCE_DEGRADED',
  MEMORY_LIMIT_EXCEEDED = 'MEMORY_LIMIT_EXCEEDED',

  // Nested grid errors
  NESTED_MAX_DEPTH = 'NESTED_MAX_DEPTH',
  NESTED_CREATION_FAILED = 'NESTED_CREATION_FAILED',

  // General errors
  INVALID_ARGUMENT = 'INVALID_ARGUMENT',
  INVALID_OPERATION = 'INVALID_OPERATION',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED'
}

export class GridError extends Error {
  code: ErrorCode
  context?: any
  recoverable: boolean

  constructor(code: ErrorCode, message: string, context?: any, recoverable = true) {
    super(message)
    this.name = 'GridError'
    this.code = code
    this.context = context
    this.recoverable = recoverable

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GridError)
    }
  }
}

export interface ErrorHandlerOptions {
  onError?: (error: GridError) => void
  throwOnError?: boolean
  logErrors?: boolean
}

export class ErrorHandler {
  private static instance: ErrorHandler | null = null
  private options: Required<ErrorHandlerOptions>
  private errorCount = 0
  private errors: GridError[] = []
  private maxErrorStorage = 100

  private constructor(options: ErrorHandlerOptions = {}) {
    this.options = {
      onError: options.onError || (() => { }),
      throwOnError: options.throwOnError ?? false,
      logErrors: options.logErrors ?? true
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(options?: ErrorHandlerOptions): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler(options)
    }
    return ErrorHandler.instance
  }

  /**
   * Reset error handler
   */
  static reset(): void {
    ErrorHandler.instance = null
  }

  /**
   * Configure error handler
   */
  configure(options: Partial<ErrorHandlerOptions>): void {
    Object.assign(this.options, options)
  }

  /**
   * Handle error
   */
  handle(code: ErrorCode, message: string, context?: any, recoverable = true): GridError {
    const error = new GridError(code, message, context, recoverable)

    this.errorCount++
    this.errors.push(error)

    // Limit stored errors
    if (this.errors.length > this.maxErrorStorage) {
      this.errors.shift()
    }

    // Log error
    if (this.options.logErrors) {
      logger.error(`[${code}] ${message}`, { context, recoverable })
    }

    // Call error callback
    try {
      this.options.onError(error)
    } catch (callbackError) {
      logger.error('Error in error handler callback', callbackError)
    }

    // Throw if configured
    if (this.options.throwOnError && !recoverable) {
      throw error
    }

    return error
  }

  /**
   * Create error without handling
   */
  create(code: ErrorCode, message: string, context?: any, recoverable = true): GridError {
    return new GridError(code, message, context, recoverable)
  }

  /**
   * Wrap function with error handling
   */
  wrap<T extends (...args: any[]) => any>(
    fn: T,
    code: ErrorCode,
    message: string
  ): T {
    return ((...args: any[]) => {
      try {
        return fn(...args)
      } catch (error) {
        this.handle(code, message, { originalError: error, args }, true)
        return undefined
      }
    }) as T
  }

  /**
   * Wrap async function with error handling
   */
  wrapAsync<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    code: ErrorCode,
    message: string
  ): T {
    return (async (...args: any[]) => {
      try {
        return await fn(...args)
      } catch (error) {
        this.handle(code, message, { originalError: error, args }, true)
        return undefined
      }
    }) as T
  }

  /**
   * Get error count
   */
  getErrorCount(): number {
    return this.errorCount
  }

  /**
   * Get stored errors
   */
  getErrors(): GridError[] {
    return [...this.errors]
  }

  /**
   * Get errors by code
   */
  getErrorsByCode(code: ErrorCode): GridError[] {
    return this.errors.filter(err => err.code === code)
  }

  /**
   * Clear error history
   */
  clearErrors(): void {
    this.errors = []
    this.errorCount = 0
  }

  /**
   * Check if has errors
   */
  hasErrors(): boolean {
    return this.errors.length > 0
  }

  /**
   * Check if has specific error code
   */
  hasErrorCode(code: ErrorCode): boolean {
    return this.errors.some(err => err.code === code)
  }

  /**
   * Get last error
   */
  getLastError(): GridError | undefined {
    return this.errors[this.errors.length - 1]
  }

  /**
   * Assert condition
   */
  assert(condition: boolean, code: ErrorCode, message: string, context?: any): void {
    if (!condition) {
      this.handle(code, message, context, false)
    }
  }

  /**
   * Validate and throw if invalid
   */
  validate(condition: boolean, code: ErrorCode, message: string, context?: any): void {
    if (!condition) {
      throw this.create(code, message, context, false)
    }
  }
}

// Export singleton getter
export const errorHandler = ErrorHandler.getInstance()

// Export convenience functions
export const handleError = (code: ErrorCode, message: string, context?: any, recoverable = true) =>
  errorHandler.handle(code, message, context, recoverable)

export const createError = (code: ErrorCode, message: string, context?: any, recoverable = true) =>
  errorHandler.create(code, message, context, recoverable)

export const assertCondition = (condition: boolean, code: ErrorCode, message: string, context?: any) =>
  errorHandler.assert(condition, code, message, context)

export const validateCondition = (condition: boolean, code: ErrorCode, message: string, context?: any) =>
  errorHandler.validate(condition, code, message, context)

