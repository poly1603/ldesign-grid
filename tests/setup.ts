/**
 * Test setup for Vitest
 */

import { vi } from 'vitest'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() { }
  unobserve() { }
  disconnect() { }
}

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() { }
  observe() { }
  unobserve() { }
  disconnect() { }
}

// Mock requestAnimationFrame
global.requestAnimationFrame = (cb: FrameRequestCallback) => {
  return setTimeout(cb, 16) as unknown as number
}

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id)
}

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock IndexedDB
const indexedDBMock = {
  open: vi.fn().mockReturnValue({
    onsuccess: null,
    onerror: null,
    result: {
      objectStoreNames: {
        contains: vi.fn().mockReturnValue(false)
      },
      createObjectStore: vi.fn(),
      transaction: vi.fn().mockReturnValue({
        objectStore: vi.fn().mockReturnValue({
          get: vi.fn(),
          put: vi.fn(),
          delete: vi.fn(),
          getAllKeys: vi.fn()
        }),
        oncomplete: null
      }),
      close: vi.fn()
    }
  })
}

Object.defineProperty(window, 'indexedDB', {
  value: indexedDBMock
})

// Setup console spy
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}

