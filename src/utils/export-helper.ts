/**
 * Export helper for grid layouts
 * Supports: Image, PDF, CSV, IndexedDB
 */

import type { IGridInstance, GridLayout } from '../types'
import { logger } from './logger'

export interface ExportImageOptions {
  format?: 'png' | 'jpeg' | 'webp'
  quality?: number
  scale?: number
  backgroundColor?: string
}

export interface ExportPDFOptions {
  title?: string
  orientation?: 'portrait' | 'landscape'
  format?: 'a4' | 'letter'
}

export class ExportHelper {
  /**
   * Export grid as image (Canvas)
   */
  static async exportAsImage(
    grid: IGridInstance,
    options: ExportImageOptions = {}
  ): Promise<Blob> {
    const {
      format = 'png',
      quality = 0.92,
      scale = 2,
      backgroundColor = '#ffffff'
    } = options

    const container = grid.container
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    // Set canvas size
    const rect = container.getBoundingClientRect()
    canvas.width = rect.width * scale
    canvas.height = rect.height * scale
    ctx.scale(scale, scale)

    // Fill background
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, rect.width, rect.height)

    // Draw each grid item
    const items = grid.getAllItems()

    for (const item of items) {
      if (!item.element) continue

      const itemRect = item.element.getBoundingClientRect()
      const x = itemRect.left - rect.left
      const y = itemRect.top - rect.top

      // Draw item background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(x, y, itemRect.width, itemRect.height)

      // Draw border
      ctx.strokeStyle = '#e0e0e0'
      ctx.strokeRect(x, y, itemRect.width, itemRect.height)

      // Draw content (simplified - only text for now)
      const text = item.element.textContent || ''
      if (text) {
        ctx.fillStyle = '#333333'
        ctx.font = '14px sans-serif'
        ctx.fillText(text, x + 10, y + 30)
      }
    }

    // Convert to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            logger.info('Grid exported as image', { format, size: blob.size })
            resolve(blob)
          } else {
            reject(new Error('Failed to create blob'))
          }
        },
        `image/${format}`,
        quality
      )
    })
  }

  /**
   * Download grid as image
   */
  static async downloadAsImage(
    grid: IGridInstance,
    filename = 'grid-layout',
    options: ExportImageOptions = {}
  ): Promise<void> {
    const blob = await ExportHelper.exportAsImage(grid, options)
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.${options.format || 'png'}`
    a.click()

    URL.revokeObjectURL(url)

    logger.info('Grid image downloaded', { filename })
  }

  /**
   * Export grid as SVG
   */
  static exportAsSVG(grid: IGridInstance): string {
    const container = grid.container
    const rect = container.getBoundingClientRect()

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}">`

    // Add background
    svg += `<rect width="${rect.width}" height="${rect.height}" fill="#ffffff"/>`

    // Add each grid item
    grid.getAllItems().forEach(item => {
      if (!item.element) return

      const itemRect = item.element.getBoundingClientRect()
      const x = itemRect.left - rect.left
      const y = itemRect.top - rect.top

      // Item rectangle
      svg += `<rect x="${x}" y="${y}" width="${itemRect.width}" height="${itemRect.height}" 
              fill="#ffffff" stroke="#e0e0e0" stroke-width="1"/>`

      // Item text
      const text = item.element.textContent || ''
      if (text) {
        svg += `<text x="${x + 10}" y="${y + 30}" font-family="sans-serif" font-size="14" fill="#333">${text}</text>`
      }
    })

    svg += '</svg>'

    logger.info('Grid exported as SVG')
    return svg
  }

  /**
   * Download grid as SVG
   */
  static downloadAsSVG(grid: IGridInstance, filename = 'grid-layout'): void {
    const svg = ExportHelper.exportAsSVG(grid)
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.svg`
    a.click()

    URL.revokeObjectURL(url)

    logger.info('Grid SVG downloaded', { filename })
  }

  /**
   * Export layout as CSV
   */
  static exportAsCSV(grid: IGridInstance): string {
    const items = grid.getAllItems()

    // CSV header
    let csv = 'ID,X,Y,Width,Height,Locked,NoResize,NoMove\n'

    // CSV rows
    items.forEach(item => {
      csv += [
        item.id,
        item.x,
        item.y,
        item.w,
        item.h,
        item.locked ? 'Yes' : 'No',
        item.noResize ? 'Yes' : 'No',
        item.noMove ? 'Yes' : 'No'
      ].join(',') + '\n'
    })

    logger.info('Grid exported as CSV', { rows: items.length })
    return csv
  }

  /**
   * Download layout as CSV
   */
  static downloadAsCSV(grid: IGridInstance, filename = 'grid-layout'): void {
    const csv = ExportHelper.exportAsCSV(grid)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.csv`
    a.click()

    URL.revokeObjectURL(url)

    logger.info('Grid CSV downloaded', { filename })
  }

  /**
   * Save layout to IndexedDB
   */
  static async saveToIndexedDB(
    dbName: string,
    storeName: string,
    key: string,
    layout: GridLayout
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1)

      request.onerror = () => {
        logger.error('Failed to open IndexedDB', request.error)
        reject(request.error)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName)
        }
      }

      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction([storeName], 'readwrite')
        const store = transaction.objectStore(storeName)

        const putRequest = store.put(layout, key)

        putRequest.onsuccess = () => {
          logger.info('Layout saved to IndexedDB', { key })
          resolve()
        }

        putRequest.onerror = () => {
          logger.error('Failed to save to IndexedDB', putRequest.error)
          reject(putRequest.error)
        }

        transaction.oncomplete = () => {
          db.close()
        }
      }
    })
  }

  /**
   * Load layout from IndexedDB
   */
  static async loadFromIndexedDB(
    dbName: string,
    storeName: string,
    key: string
  ): Promise<GridLayout | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1)

      request.onerror = () => {
        logger.error('Failed to open IndexedDB', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        const db = request.result

        if (!db.objectStoreNames.contains(storeName)) {
          logger.warn('Store not found in IndexedDB', { storeName })
          resolve(null)
          db.close()
          return
        }

        const transaction = db.transaction([storeName], 'readonly')
        const store = transaction.objectStore(storeName)
        const getRequest = store.get(key)

        getRequest.onsuccess = () => {
          const layout = getRequest.result
          logger.info('Layout loaded from IndexedDB', { key, found: !!layout })
          resolve(layout || null)
        }

        getRequest.onerror = () => {
          logger.error('Failed to load from IndexedDB', getRequest.error)
          reject(getRequest.error)
        }

        transaction.oncomplete = () => {
          db.close()
        }
      }
    })
  }

  /**
   * Delete layout from IndexedDB
   */
  static async deleteFromIndexedDB(
    dbName: string,
    storeName: string,
    key: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1)

      request.onerror = () => {
        reject(request.error)
      }

      request.onsuccess = () => {
        const db = request.result

        if (!db.objectStoreNames.contains(storeName)) {
          resolve()
          db.close()
          return
        }

        const transaction = db.transaction([storeName], 'readwrite')
        const store = transaction.objectStore(storeName)
        const deleteRequest = store.delete(key)

        deleteRequest.onsuccess = () => {
          logger.info('Layout deleted from IndexedDB', { key })
          resolve()
        }

        deleteRequest.onerror = () => {
          logger.error('Failed to delete from IndexedDB', deleteRequest.error)
          reject(deleteRequest.error)
        }

        transaction.oncomplete = () => {
          db.close()
        }
      }
    })
  }

  /**
   * List all keys in IndexedDB store
   */
  static async listIndexedDBKeys(
    dbName: string,
    storeName: string
  ): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1)

      request.onerror = () => {
        reject(request.error)
      }

      request.onsuccess = () => {
        const db = request.result

        if (!db.objectStoreNames.contains(storeName)) {
          resolve([])
          db.close()
          return
        }

        const transaction = db.transaction([storeName], 'readonly')
        const store = transaction.objectStore(storeName)
        const getAllKeysRequest = store.getAllKeys()

        getAllKeysRequest.onsuccess = () => {
          const keys = getAllKeysRequest.result.map(k => String(k))
          logger.info('IndexedDB keys listed', { count: keys.length })
          resolve(keys)
        }

        getAllKeysRequest.onerror = () => {
          reject(getAllKeysRequest.error)
        }

        transaction.oncomplete = () => {
          db.close()
        }
      }
    })
  }

  /**
   * Export to JSON with download
   */
  static downloadAsJSON(grid: IGridInstance, filename = 'grid-layout'): void {
    const layout = grid.save()
    const json = JSON.stringify(layout, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.json`
    a.click()

    URL.revokeObjectURL(url)

    logger.info('Grid JSON downloaded', { filename })
  }
}

/**
 * Convenience functions
 */

export const exportAsImage = (grid: IGridInstance, options?: ExportImageOptions) =>
  ExportHelper.exportAsImage(grid, options)

export const downloadAsImage = (grid: IGridInstance, filename?: string, options?: ExportImageOptions) =>
  ExportHelper.downloadAsImage(grid, filename, options)

export const exportAsSVG = (grid: IGridInstance) =>
  ExportHelper.exportAsSVG(grid)

export const downloadAsSVG = (grid: IGridInstance, filename?: string) =>
  ExportHelper.downloadAsSVG(grid, filename)

export const exportAsCSV = (grid: IGridInstance) =>
  ExportHelper.exportAsCSV(grid)

export const downloadAsCSV = (grid: IGridInstance, filename?: string) =>
  ExportHelper.downloadAsCSV(grid, filename)

export const downloadAsJSON = (grid: IGridInstance, filename?: string) =>
  ExportHelper.downloadAsJSON(grid, filename)

export const saveToIndexedDB = (dbName: string, storeName: string, key: string, layout: GridLayout) =>
  ExportHelper.saveToIndexedDB(dbName, storeName, key, layout)

export const loadFromIndexedDB = (dbName: string, storeName: string, key: string) =>
  ExportHelper.loadFromIndexedDB(dbName, storeName, key)

export const deleteFromIndexedDB = (dbName: string, storeName: string, key: string) =>
  ExportHelper.deleteFromIndexedDB(dbName, storeName, key)

export const listIndexedDBKeys = (dbName: string, storeName: string) =>
  ExportHelper.listIndexedDBKeys(dbName, storeName)

