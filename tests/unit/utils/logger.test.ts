/**
 * Logger tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Logger, LogLevel } from '../../../src/utils/logger'

describe('Logger', () => {
  let logger: Logger

  beforeEach(() => {
    Logger.reset()
    logger = Logger.getInstance({
      enableConsole: false,
      enableStorage: true
    })
  })

  it('should create singleton instance', () => {
    const logger1 = Logger.getInstance()
    const logger2 = Logger.getInstance()
    expect(logger1).toBe(logger2)
  })

  it('should log debug messages', () => {
    logger.debug('Test debug', { foo: 'bar' })
    const logs = logger.getLogs(LogLevel.DEBUG)
    expect(logs).toHaveLength(1)
    expect(logs[0].message).toBe('Test debug')
  })

  it('should log info messages', () => {
    logger.info('Test info')
    const logs = logger.getLogs(LogLevel.INFO)
    expect(logs).toHaveLength(1)
  })

  it('should log warnings', () => {
    logger.warn('Test warning')
    const logs = logger.getLogs(LogLevel.WARN)
    expect(logs).toHaveLength(1)
  })

  it('should log errors', () => {
    const error = new Error('Test error')
    logger.error('Error occurred', error)
    const logs = logger.getLogs(LogLevel.ERROR)
    expect(logs).toHaveLength(1)
    expect(logs[0].stack).toBeDefined()
  })

  it('should respect log level', () => {
    logger.configure({ level: LogLevel.WARN })

    logger.debug('Should not log')
    logger.info('Should not log')
    logger.warn('Should log')
    logger.error('Should log')

    expect(logger.getLogs()).toHaveLength(2)
  })

  it('should limit stored logs', () => {
    logger.configure({ maxStorageSize: 5 })

    for (let i = 0; i < 10; i++) {
      logger.info(`Message ${i}`)
    }

    expect(logger.getLogs()).toHaveLength(5)
  })

  it('should clear logs', () => {
    logger.info('Test 1')
    logger.info('Test 2')
    expect(logger.getLogs()).toHaveLength(2)

    logger.clearLogs()
    expect(logger.getLogs()).toHaveLength(0)
  })

  it('should export logs as JSON', () => {
    logger.info('Test message')
    const json = logger.exportLogs()
    expect(json).toContain('Test message')
    expect(() => JSON.parse(json)).not.toThrow()
  })

  it('should count logs by level', () => {
    logger.debug('Debug')
    logger.info('Info 1')
    logger.info('Info 2')
    logger.warn('Warn')

    expect(logger.getLogCount()).toBe(4)
    expect(logger.getLogCount(LogLevel.INFO)).toBe(2)
  })

  it('should check if level is enabled', () => {
    logger.configure({ level: LogLevel.WARN })

    expect(logger.isLevelEnabled(LogLevel.DEBUG)).toBe(false)
    expect(logger.isLevelEnabled(LogLevel.INFO)).toBe(false)
    expect(logger.isLevelEnabled(LogLevel.WARN)).toBe(true)
    expect(logger.isLevelEnabled(LogLevel.ERROR)).toBe(true)
  })
})

