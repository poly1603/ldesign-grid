/**
 * EventBus tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EventBus } from '../../../src/utils/event-bus'

describe('EventBus', () => {
  let bus: EventBus

  beforeEach(() => {
    bus = new EventBus()
  })

  it('should subscribe and emit events', () => {
    const callback = vi.fn()
    bus.on('test', callback)
    bus.emit('test', 'data')

    expect(callback).toHaveBeenCalledWith('data')
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should unsubscribe from events', () => {
    const callback = vi.fn()
    const unsubscribe = bus.on('test', callback)

    bus.emit('test')
    expect(callback).toHaveBeenCalledTimes(1)

    unsubscribe()
    bus.emit('test')
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should support once listeners', () => {
    const callback = vi.fn()
    bus.once('test', callback)

    bus.emit('test')
    bus.emit('test')

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should support event priority', () => {
    const results: number[] = []

    bus.on('test', () => results.push(1), 1)
    bus.on('test', () => results.push(2), 2)
    bus.on('test', () => results.push(3), 3)

    bus.emit('test')

    expect(results).toEqual([3, 2, 1])
  })

  it('should support wildcard listeners', () => {
    const callback = vi.fn()
    bus.onAny(callback)

    bus.emit('event1', 'data1')
    bus.emit('event2', 'data2')

    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenNthCalledWith(1, 'event1', 'data1')
    expect(callback).toHaveBeenNthCalledWith(2, 'event2', 'data2')
  })

  it('should handle async events', async () => {
    const callback = vi.fn().mockResolvedValue(undefined)
    bus.on('test', callback)

    await bus.emitAsync('test', 'data')

    expect(callback).toHaveBeenCalledWith('data')
  })

  it('should pipe events to another bus', () => {
    const bus2 = new EventBus()
    const callback = vi.fn()

    bus2.on('test', callback)
    bus.pipe(bus2, ['test'])

    bus.emit('test', 'data')

    expect(callback).toHaveBeenCalledWith('data')
  })

  it('should get event names', () => {
    bus.on('event1', () => { })
    bus.on('event2', () => { })

    const names = bus.getEventNames()
    expect(names).toContain('event1')
    expect(names).toContain('event2')
  })

  it('should count listeners', () => {
    bus.on('test', () => { })
    bus.on('test', () => { })

    expect(bus.listenerCount('test')).toBe(2)
  })

  it('should check if has listeners', () => {
    expect(bus.hasListeners('test')).toBe(false)

    bus.on('test', () => { })
    expect(bus.hasListeners('test')).toBe(true)
  })

  it('should remove all listeners', () => {
    bus.on('event1', () => { })
    bus.on('event2', () => { })

    bus.removeAllListeners('event1')
    expect(bus.hasListeners('event1')).toBe(false)
    expect(bus.hasListeners('event2')).toBe(true)
  })

  it('should clear all events', () => {
    bus.on('event1', () => { })
    bus.on('event2', () => { })

    bus.clear()

    expect(bus.getEventNames()).toHaveLength(0)
  })

  it('should handle errors in callbacks', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => { })

    bus.on('test', () => {
      throw new Error('Test error')
    })

    bus.emit('test')

    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('should warn on max listeners', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => { })

    bus.setMaxListeners(2)
    bus.on('test', () => { })
    bus.on('test', () => { })
    bus.on('test', () => { })

    expect(consoleWarn).toHaveBeenCalled()
    consoleWarn.mockRestore()
  })
})

