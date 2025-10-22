/**
 * Logger utility with level-based logging
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: number
  data?: any
  stack?: string
}

export interface LoggerOptions {
  level?: LogLevel
  prefix?: string
  enableConsole?: boolean
  enableStorage?: boolean
  maxStorageSize?: number
}

export class Logger {
  private static instance: Logger | null = null
  private level: LogLevel
  private prefix: string
  private enableConsole: boolean
  private enableStorage: boolean
  private maxStorageSize: number
  private logs: LogEntry[] = []

  private constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? (process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG)
    this.prefix = options.prefix ?? '[Grid]'
    this.enableConsole = options.enableConsole ?? true
    this.enableStorage = options.enableStorage ?? false
    this.maxStorageSize = options.maxStorageSize ?? 1000
  }

  /**
   * Get singleton instance
   */
  static getInstance(options?: LoggerOptions): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(options)
    }
    return Logger.instance
  }

  /**
   * Reset logger instance
   */
  static reset(): void {
    Logger.instance = null
  }

  /**
   * Configure logger
   */
  configure(options: Partial<LoggerOptions>): void {
    if (options.level !== undefined) this.level = options.level
    if (options.prefix !== undefined) this.prefix = options.prefix
    if (options.enableConsole !== undefined) this.enableConsole = options.enableConsole
    if (options.enableStorage !== undefined) this.enableStorage = options.enableStorage
    if (options.maxStorageSize !== undefined) this.maxStorageSize = options.maxStorageSize
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data)
  }

  /**
   * Log info message
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data)
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data)
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | any): void {
    const stack = error instanceof Error ? error.stack : undefined
    this.log(LogLevel.ERROR, message, error, stack)
  }

  /**
   * Log message at specific level
   */
  private log(level: LogLevel, message: string, data?: any, stack?: string): void {
    if (level < this.level) return

    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      data,
      stack
    }

    // Store log entry
    if (this.enableStorage) {
      this.logs.push(entry)
      if (this.logs.length > this.maxStorageSize) {
        this.logs.shift()
      }
    }

    // Console output
    if (this.enableConsole) {
      this.outputToConsole(entry)
    }
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(entry: LogEntry): void {
    const levelName = LogLevel[entry.level]
    const timestamp = new Date(entry.timestamp).toISOString()
    const prefix = `${this.prefix} [${levelName}] ${timestamp}`

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.data || '')
        break
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.data || '')
        break
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.data || '')
        break
      case LogLevel.ERROR:
        console.error(prefix, entry.message, entry.data || '')
        if (entry.stack) {
          console.error(entry.stack)
        }
        break
    }
  }

  /**
   * Get all stored logs
   */
  getLogs(level?: LogLevel): LogEntry[] {
    if (level === undefined) {
      return [...this.logs]
    }
    return this.logs.filter(log => log.level === level)
  }

  /**
   * Clear all stored logs
   */
  clearLogs(): void {
    this.logs = []
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  /**
   * Download logs as file
   */
  downloadLogs(filename = 'grid-logs.json'): void {
    const json = this.exportLogs()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  /**
   * Get log count by level
   */
  getLogCount(level?: LogLevel): number {
    if (level === undefined) {
      return this.logs.length
    }
    return this.logs.filter(log => log.level === level).length
  }

  /**
   * Check if level is enabled
   */
  isLevelEnabled(level: LogLevel): boolean {
    return level >= this.level
  }
}

// Export singleton getter
export const logger = Logger.getInstance()

// Export convenience functions
export const debug = (message: string, data?: any) => logger.debug(message, data)
export const info = (message: string, data?: any) => logger.info(message, data)
export const warn = (message: string, data?: any) => logger.warn(message, data)
export const error = (message: string, err?: Error | any) => logger.error(message, err)

