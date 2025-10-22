/**
 * Touch event handler for mobile devices
 */

export interface TouchEventData {
  startX: number
  startY: number
  currentX: number
  currentY: number
  deltaX: number
  deltaY: number
  target: HTMLElement
  identifier: number
}

export class TouchHandler {
  private activeTouches = new Map<number, TouchEventData>()
  private element: HTMLElement
  private onTouchStart?: (data: TouchEventData) => void
  private onTouchMove?: (data: TouchEventData) => void
  private onTouchEnd?: (data: TouchEventData) => void
  private minMoveDistance = 10 // Minimum distance to consider as move

  constructor(
    element: HTMLElement,
    handlers: {
      onTouchStart?: (data: TouchEventData) => void
      onTouchMove?: (data: TouchEventData) => void
      onTouchEnd?: (data: TouchEventData) => void
    }
  ) {
    this.element = element
    this.onTouchStart = handlers.onTouchStart
    this.onTouchMove = handlers.onTouchMove
    this.onTouchEnd = handlers.onTouchEnd

    this.init()
  }

  /**
   * Initialize touch handlers
   */
  private init(): void {
    this.element.addEventListener('touchstart', this.handleTouchStart, { passive: false })
    this.element.addEventListener('touchmove', this.handleTouchMove, { passive: false })
    this.element.addEventListener('touchend', this.handleTouchEnd, { passive: false })
    this.element.addEventListener('touchcancel', this.handleTouchEnd, { passive: false })
  }

  /**
   * Handle touch start
   */
  private handleTouchStart = (e: TouchEvent): void => {
    Array.from(e.changedTouches).forEach(touch => {
      const data: TouchEventData = {
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        deltaX: 0,
        deltaY: 0,
        target: touch.target as HTMLElement,
        identifier: touch.identifier
      }

      this.activeTouches.set(touch.identifier, data)

      if (this.onTouchStart) {
        this.onTouchStart(data)
      }
    })
  }

  /**
   * Handle touch move
   */
  private handleTouchMove = (e: TouchEvent): void => {
    Array.from(e.changedTouches).forEach(touch => {
      const data = this.activeTouches.get(touch.identifier)
      if (!data) return

      data.currentX = touch.clientX
      data.currentY = touch.clientY
      data.deltaX = data.currentX - data.startX
      data.deltaY = data.currentY - data.startY

      // Only trigger if moved enough
      const distance = Math.sqrt(data.deltaX ** 2 + data.deltaY ** 2)
      if (distance >= this.minMoveDistance) {
        if (this.onTouchMove) {
          this.onTouchMove(data)
        }
        e.preventDefault()
      }
    })
  }

  /**
   * Handle touch end
   */
  private handleTouchEnd = (e: TouchEvent): void => {
    Array.from(e.changedTouches).forEach(touch => {
      const data = this.activeTouches.get(touch.identifier)
      if (!data) return

      data.currentX = touch.clientX
      data.currentY = touch.clientY
      data.deltaX = data.currentX - data.startX
      data.deltaY = data.currentY - data.startY

      if (this.onTouchEnd) {
        this.onTouchEnd(data)
      }

      this.activeTouches.delete(touch.identifier)
    })
  }

  /**
   * Get active touches count
   */
  getActiveTouchCount(): number {
    return this.activeTouches.size
  }

  /**
   * Check if multi-touch
   */
  isMultiTouch(): boolean {
    return this.activeTouches.size > 1
  }

  /**
   * Destroy touch handler
   */
  destroy(): void {
    this.element.removeEventListener('touchstart', this.handleTouchStart)
    this.element.removeEventListener('touchmove', this.handleTouchMove)
    this.element.removeEventListener('touchend', this.handleTouchEnd)
    this.element.removeEventListener('touchcancel', this.handleTouchEnd)
    this.activeTouches.clear()
  }
}

/**
 * Convert touch event to mouse event
 */
export function touchToMouse(touch: Touch): MouseEvent {
  return new MouseEvent('mouse', {
    clientX: touch.clientX,
    clientY: touch.clientY,
    screenX: touch.screenX,
    screenY: touch.screenY,
    bubbles: true,
    cancelable: true
  })
}

