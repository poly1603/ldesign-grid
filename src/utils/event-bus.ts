/**
 * Enhanced event bus for grid events with priority and async support
 */

type EventCallback = (...args: any[]) => void | Promise<void>

export interface EventListener {
  callback: EventCallback
  priority: number
  once: boolean
}

export class EventBus {
  private events: Map<string, EventListener[]> = new Map()
  private wildcardListeners: EventListener[] = []
  private maxListeners = 100

  /**
   * Subscribe to an event
   */
  on(event: string, callback: EventCallback, priority = 0): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }

    const listeners = this.events.get(event)!

    // Check max listeners
    if (listeners.length >= this.maxListeners) {
      console.warn(`Max listeners (${this.maxListeners}) reached for event: ${event}`)
    }

    const listener: EventListener = {
      callback,
      priority,
      once: false
    }

    listeners.push(listener)

    // Sort by priority (higher priority first)
    listeners.sort((a, b) => b.priority - a.priority)

    // Return unsubscribe function
    return () => this.off(event, callback)
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, callback: EventCallback): void {
    const listeners = this.events.get(event)
    if (listeners) {
      const index = listeners.findIndex(l => l.callback === callback)
      if (index !== -1) {
        listeners.splice(index, 1)
      }
      if (listeners.length === 0) {
        this.events.delete(event)
      }
    }
  }

  /**
   * Emit an event
   */
  emit(event: string, ...args: any[]): void {
    const listeners = this.events.get(event) || []
    const toRemove: EventListener[] = []

    listeners.forEach(listener => {
      try {
        const result = listener.callback(...args)

        // Handle async callbacks
        if (result instanceof Promise) {
          result.catch(error => {
            console.error(`Error in async event handler for "${event}":`, error)
          })
        }

        if (listener.once) {
          toRemove.push(listener)
        }
      } catch (error) {
        console.error(`Error in event handler for "${event}":`, error)
      }
    })

    // Remove one-time listeners
    if (toRemove.length > 0) {
      const remaining = listeners.filter(l => !toRemove.includes(l))
      if (remaining.length > 0) {
        this.events.set(event, remaining)
      } else {
        this.events.delete(event)
      }
    }

    // Emit to wildcard listeners
    this.emitWildcard(event, args)
  }

  /**
   * Emit async event and wait for all handlers
   */
  async emitAsync(event: string, ...args: any[]): Promise<void> {
    const listeners = this.events.get(event) || []
    const toRemove: EventListener[] = []
    const promises: Promise<void>[] = []

    listeners.forEach(listener => {
      try {
        const result = listener.callback(...args)

        if (result instanceof Promise) {
          promises.push(result)
        }

        if (listener.once) {
          toRemove.push(listener)
        }
      } catch (error) {
        console.error(`Error in event handler for "${event}":`, error)
      }
    })

    // Wait for all async handlers
    await Promise.all(promises)

    // Remove one-time listeners
    if (toRemove.length > 0) {
      const remaining = listeners.filter(l => !toRemove.includes(l))
      if (remaining.length > 0) {
        this.events.set(event, remaining)
      } else {
        this.events.delete(event)
      }
    }

    // Emit to wildcard listeners
    this.emitWildcard(event, args)
  }

  /**
   * Emit to wildcard listeners
   */
  private emitWildcard(event: string, args: any[]): void {
    this.wildcardListeners.forEach(listener => {
      try {
        listener.callback(event, ...args)
      } catch (error) {
        console.error(`Error in wildcard event handler:`, error)
      }
    })
  }

  /**
   * Subscribe to an event once
   */
  once(event: string, callback: EventCallback, priority = 0): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }

    const listener: EventListener = {
      callback,
      priority,
      once: true
    }

    this.events.get(event)!.push(listener)
    this.events.get(event)!.sort((a, b) => b.priority - a.priority)

    return () => this.off(event, callback)
  }

  /**
   * Subscribe to all events (wildcard)
   */
  onAny(callback: (event: string, ...args: any[]) => void, priority = 0): () => void {
    const listener: EventListener = {
      callback,
      priority,
      once: false
    }

    this.wildcardListeners.push(listener)
    this.wildcardListeners.sort((a, b) => b.priority - a.priority)

    return () => {
      const index = this.wildcardListeners.findIndex(l => l.callback === callback)
      if (index !== -1) {
        this.wildcardListeners.splice(index, 1)
      }
    }
  }

  /**
   * Clear all event listeners
   */
  clear(): void {
    this.events.clear()
  }

  /**
   * Get all event names
   */
  getEventNames(): string[] {
    return Array.from(this.events.keys())
  }

  /**
   * Get listener count for an event
   */
  listenerCount(event: string): number {
    return this.events.get(event)?.length ?? 0
  }

  /**
   * Check if event has listeners
   */
  hasListeners(event: string): boolean {
    const listeners = this.events.get(event)
    return listeners !== undefined && listeners.length > 0
  }

  /**
   * Set max listeners
   */
  setMaxListeners(max: number): void {
    this.maxListeners = max
  }

  /**
   * Get max listeners
   */
  getMaxListeners(): number {
    return this.maxListeners
  }

  /**
   * Remove all listeners for specific event
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event)
    } else {
      this.events.clear()
      this.wildcardListeners = []
    }
  }

  /**
   * Pipe events from one bus to another
   */
  pipe(targetBus: EventBus, events?: string[]): () => void {
    if (events) {
      const unsubscribers = events.map(event => {
        return this.on(event, (...args) => {
          targetBus.emit(event, ...args)
        })
      })

      return () => unsubscribers.forEach(unsub => unsub())
    } else {
      return this.onAny((event, ...args) => {
        targetBus.emit(event, ...args)
      })
    }
  }
}













