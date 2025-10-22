/**
 * React GridDragSource component - Enhanced with external drag support
 */

import React, { useRef, useEffect, useState, useContext, useCallback } from 'react'
import type { GridDragSourceProps } from '../types'
import { GridContext } from '../context/GridContext'

export const GridDragSource: React.FC<GridDragSourceProps> = (props) => {
  const {
    data,
    itemOptions,
    preview,
    helper = 'clone',
    revert = false,
    disabled = false,
    onDragStart,
    onDragEnd,
    onDropped,
    onClick,
    children,
    className = '',
    style
  } = props

  const dragSourceRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isTouchDragging, setIsTouchDragging] = useState(false)
  const gridContext = useContext(GridContext)
  const gridInstance = gridContext?.gridInstance

  // Check if inside a grid
  const isInsideGrid = gridInstance !== undefined

  useEffect(() => {
    if (!dragSourceRef.current || disabled) return

    const element = dragSourceRef.current

    // If inside a GridStack, register with its drag manager
    if (gridInstance) {
      const dragManager = gridInstance.getDragManager()

      // Register drag source
      const cleanup = dragManager.registerDragSource(element, {
        data,
        itemOptions,
        preview,
        helper,
        revert
      })

      return cleanup
    } else {
      // For external drag sources (outside any GridStack)
      // Make it work with ANY GridStack on the page
      setupExternalDragSource(element, data, itemOptions)
    }
  }, [gridInstance, data, itemOptions, preview, helper, revert, disabled])

  // Drag event handlers
  useEffect(() => {
    if (!dragSourceRef.current || disabled) return

    const element = dragSourceRef.current

    const handleDragStart = (e: DragEvent) => {
      if (disabled) {
        e.preventDefault()
        return
      }

      setIsDragging(true)
      onDragStart?.(data)

      // For external drag sources, set drag data
      if (!gridInstance && e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'copy'
        e.dataTransfer.setData('application/json', JSON.stringify({
          data,
          itemOptions: itemOptions || {}
        }))

        // Set custom drag image if provided
        if (preview) {
          const previewEl = typeof preview === 'string'
            ? createPreviewElement(preview)
            : preview.cloneNode(true) as HTMLElement

          document.body.appendChild(previewEl)
          e.dataTransfer.setDragImage(previewEl, 0, 0)
          setTimeout(() => document.body.removeChild(previewEl), 0)
        }
      }
    }

    const handleDragEnd = (e: DragEvent) => {
      setIsDragging(false)
      onDragEnd?.(data)
    }

    element.addEventListener('dragstart', handleDragStart as EventListener)
    element.addEventListener('dragend', handleDragEnd as EventListener)

    return () => {
      element.removeEventListener('dragstart', handleDragStart as EventListener)
      element.removeEventListener('dragend', handleDragEnd as EventListener)
    }
  }, [gridInstance, data, itemOptions, preview, disabled, onDragStart, onDragEnd])

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!disabled) {
      onClick?.(e)
    }
  }, [disabled, onClick])

  const dragClasses = [
    'grid-drag-source',
    isDragging && 'is-dragging',
    isTouchDragging && 'is-touch-dragging',
    disabled && 'is-disabled',
    className
  ].filter(Boolean).join(' ')

  const dragStyles: React.CSSProperties = {
    cursor: disabled ? 'not-allowed' : 'grab',
    userSelect: 'none',
    transition: 'all 0.2s ease',
    position: 'relative',
    opacity: disabled ? 0.5 : 1,
    pointerEvents: disabled ? 'none' : 'auto',
    ...style
  }

  return (
    <div
      ref={dragSourceRef}
      className={dragClasses}
      style={dragStyles}
      draggable={!disabled}
      onClick={handleClick}
    >
      {typeof children === 'function'
        ? children({ isDragging, isTouchDragging, isInsideGrid })
        : children
      }
    </div>
  )
}

/**
 * Setup external drag source (works with any GridStack on page)
 */
function setupExternalDragSource(
  element: HTMLElement,
  data: any,
  itemOptions?: any
) {
  // Store data on element for grid to pick up
  element.setAttribute('data-drag-source', JSON.stringify({
    data,
    itemOptions: itemOptions || {}
  }))

  // Make element draggable
  element.setAttribute('draggable', 'true')
}

/**
 * Create preview element from HTML string
 */
function createPreviewElement(html: string): HTMLElement {
  const temp = document.createElement('div')
  temp.innerHTML = html
  temp.style.position = 'absolute'
  temp.style.top = '-9999px'
  return (temp.firstChild as HTMLElement) || temp
}

GridDragSource.displayName = 'GridDragSource'

export default GridDragSource













