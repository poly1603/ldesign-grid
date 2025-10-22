/**
 * ErrorHandler tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ErrorHandler, ErrorCode, GridError } from '../../../src/core/ErrorHandler'

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler

  beforeEach(() => {
    ErrorHandler.reset()
    errorHandler = ErrorHandler.getInstance({
      logErrors: false
    })
  })

  it('should create singleton instance', () => {
    const handler1 = ErrorHandler.getInstance()
    const handler2 = ErrorHandler.getInstance()
    expect(handler1).toBe(handler2)
  })

  it('should handle errors', () => {
    const error = errorHandler.handle(
      ErrorCode.ITEM_NOT_FOUND,
      'Item not found',
      { id: '123' }
    )

    expect(error).toBeInstanceOf(GridError)
    expect(error.code).toBe(ErrorCode.ITEM_NOT_FOUND)
    expect(error.message).toBe('Item not found')
    expect(error.context).toEqual({ id: '123' })
  })

  it('should store error history', () => {
    errorHandler.handle(ErrorCode.ITEM_NOT_FOUND, 'Error 1')
    errorHandler.handle(ErrorCode.GRID_INIT_FAILED, 'Error 2')

    const errors = errorHandler.getErrors()
    expect(errors).toHaveLength(2)
  })

  it('should get errors by code', () => {
    errorHandler.handle(ErrorCode.ITEM_NOT_FOUND, 'Error 1')
    errorHandler.handle(ErrorCode.ITEM_NOT_FOUND, 'Error 2')
    errorHandler.handle(ErrorCode.GRID_INIT_FAILED, 'Error 3')

    const errors = errorHandler.getErrorsByCode(ErrorCode.ITEM_NOT_FOUND)
    expect(errors).toHaveLength(2)
  })

  it('should count errors', () => {
    errorHandler.handle(ErrorCode.ITEM_NOT_FOUND, 'Error')
    errorHandler.handle(ErrorCode.GRID_INIT_FAILED, 'Error')

    expect(errorHandler.getErrorCount()).toBe(2)
  })

  it('should get last error', () => {
    errorHandler.handle(ErrorCode.ITEM_NOT_FOUND, 'Error 1')
    errorHandler.handle(ErrorCode.GRID_INIT_FAILED, 'Error 2')

    const last = errorHandler.getLastError()
    expect(last?.code).toBe(ErrorCode.GRID_INIT_FAILED)
  })

  it('should clear errors', () => {
    errorHandler.handle(ErrorCode.ITEM_NOT_FOUND, 'Error')
    expect(errorHandler.hasErrors()).toBe(true)

    errorHandler.clearErrors()
    expect(errorHandler.hasErrors()).toBe(false)
  })

  it('should check error code existence', () => {
    errorHandler.handle(ErrorCode.ITEM_NOT_FOUND, 'Error')

    expect(errorHandler.hasErrorCode(ErrorCode.ITEM_NOT_FOUND)).toBe(true)
    expect(errorHandler.hasErrorCode(ErrorCode.GRID_INIT_FAILED)).toBe(false)
  })

  it('should call error callback', () => {
    const onError = vi.fn()

    ErrorHandler.reset()
    errorHandler = ErrorHandler.getInstance({ onError })

    errorHandler.handle(ErrorCode.ITEM_NOT_FOUND, 'Error')

    expect(onError).toHaveBeenCalled()
    expect(onError.mock.calls[0][0]).toBeInstanceOf(GridError)
  })

  it('should wrap functions with error handling', () => {
    const fn = vi.fn(() => {
      throw new Error('Test error')
    })

    const wrapped = errorHandler.wrap(fn, ErrorCode.INVALID_OPERATION, 'Operation failed')

    const result = wrapped()

    expect(result).toBeUndefined()
    expect(errorHandler.hasErrors()).toBe(true)
  })

  it('should wrap async functions', async () => {
    const fn = vi.fn(async () => {
      throw new Error('Test error')
    })

    const wrapped = errorHandler.wrapAsync(fn, ErrorCode.INVALID_OPERATION, 'Operation failed')

    const result = await wrapped()

    expect(result).toBeUndefined()
    expect(errorHandler.hasErrors()).toBe(true)
  })

  it('should assert conditions', () => {
    errorHandler.assert(true, ErrorCode.INVALID_ARGUMENT, 'Should not error')
    expect(errorHandler.hasErrors()).toBe(false)

    errorHandler.assert(false, ErrorCode.INVALID_ARGUMENT, 'Should error')
    expect(errorHandler.hasErrors()).toBe(true)
  })

  it('should validate and throw', () => {
    expect(() => {
      errorHandler.validate(true, ErrorCode.INVALID_ARGUMENT, 'Should not throw')
    }).not.toThrow()

    expect(() => {
      errorHandler.validate(false, ErrorCode.INVALID_ARGUMENT, 'Should throw')
    }).toThrow(GridError)
  })

  it('should limit stored errors', () => {
    // Generate 150 errors
    for (let i = 0; i < 150; i++) {
      errorHandler.handle(ErrorCode.ITEM_NOT_FOUND, `Error ${i}`)
    }

    // Should keep only last 100
    expect(errorHandler.getErrors().length).toBeLessThanOrEqual(100)
  })
})

