/**
 * Animation manager for grid item animations
 */

import type { IGridInstance, GridItem } from '../types'
import { logger } from '../utils/logger'

export type AnimationPreset = 'fade' | 'slide' | 'scale' | 'bounce' | 'flip' | 'none'

export interface AnimationOptions {
  duration?: number
  easing?: string
  delay?: number
}

export class AnimationManager {
  private grid: IGridInstance
  private defaultDuration = 300
  private defaultEasing = 'ease-in-out'

  constructor(grid: IGridInstance) {
    this.grid = grid
  }

  /**
   * Animate item addition
   */
  animateAdd(item: GridItem, preset: AnimationPreset = 'fade', options: AnimationOptions = {}): Promise<void> {
    if (!item.element || preset === 'none') {
      return Promise.resolve()
    }

    const duration = options.duration ?? this.defaultDuration
    const easing = options.easing ?? this.defaultEasing
    const delay = options.delay ?? 0

    return new Promise((resolve) => {
      const element = item.element!

      // Set initial state
      switch (preset) {
        case 'fade':
          element.style.opacity = '0'
          break
        case 'slide':
          element.style.transform = 'translateY(-20px)'
          element.style.opacity = '0'
          break
        case 'scale':
          element.style.transform = 'scale(0.8)'
          element.style.opacity = '0'
          break
        case 'bounce':
          element.style.transform = 'scale(0.3)'
          element.style.opacity = '0'
          break
        case 'flip':
          element.style.transform = 'rotateX(-90deg)'
          element.style.opacity = '0'
          break
      }

      // Apply transition
      element.style.transition = `all ${duration}ms ${easing}`

      // Trigger animation after delay
      setTimeout(() => {
        requestAnimationFrame(() => {
          element.style.opacity = '1'
          element.style.transform = 'none'

          // Clean up after animation
          setTimeout(() => {
            element.style.transition = ''
            resolve()
          }, duration)
        })
      }, delay)
    })
  }

  /**
   * Animate item removal
   */
  animateRemove(item: GridItem, preset: AnimationPreset = 'fade', options: AnimationOptions = {}): Promise<void> {
    if (!item.element || preset === 'none') {
      return Promise.resolve()
    }

    const duration = options.duration ?? this.defaultDuration
    const easing = options.easing ?? this.defaultEasing

    return new Promise((resolve) => {
      const element = item.element!

      // Apply transition
      element.style.transition = `all ${duration}ms ${easing}`

      // Trigger animation
      requestAnimationFrame(() => {
        switch (preset) {
          case 'fade':
            element.style.opacity = '0'
            break
          case 'slide':
            element.style.transform = 'translateY(20px)'
            element.style.opacity = '0'
            break
          case 'scale':
            element.style.transform = 'scale(0.8)'
            element.style.opacity = '0'
            break
          case 'bounce':
            element.style.transform = 'scale(0)'
            element.style.opacity = '0'
            break
          case 'flip':
            element.style.transform = 'rotateX(90deg)'
            element.style.opacity = '0'
            break
        }

        // Clean up after animation
        setTimeout(() => {
          resolve()
        }, duration)
      })
    })
  }

  /**
   * Animate item update
   */
  animateUpdate(item: GridItem, options: AnimationOptions = {}): Promise<void> {
    if (!item.element) {
      return Promise.resolve()
    }

    const duration = options.duration ?? this.defaultDuration
    const easing = options.easing ?? this.defaultEasing

    return new Promise((resolve) => {
      const element = item.element!

      // Highlight animation
      element.style.transition = `background-color ${duration}ms ${easing}`
      const originalBg = element.style.backgroundColor

      element.style.backgroundColor = 'rgba(66, 133, 244, 0.2)'

      setTimeout(() => {
        element.style.backgroundColor = originalBg

        setTimeout(() => {
          element.style.transition = ''
          resolve()
        }, duration)
      }, 100)
    })
  }

  /**
   * Animate layout change
   */
  animateLayout(duration: number = 300, easing: string = 'ease-in-out'): void {
    this.grid.getAllItems().forEach(item => {
      if (item.element) {
        item.element.style.transition = `all ${duration}ms ${easing}`

        setTimeout(() => {
          if (item.element) {
            item.element.style.transition = ''
          }
        }, duration)
      }
    })
  }

  /**
   * Pulse animation for item
   */
  pulse(item: GridItem, count: number = 1, options: AnimationOptions = {}): Promise<void> {
    if (!item.element) {
      return Promise.resolve()
    }

    const duration = options.duration ?? 300
    const easing = options.easing ?? 'ease-in-out'

    return new Promise((resolve) => {
      const element = item.element!
      let pulsed = 0

      const doPulse = () => {
        element.style.transition = `transform ${duration / 2}ms ${easing}`
        element.style.transform = 'scale(1.05)'

        setTimeout(() => {
          element.style.transform = 'scale(1)'

          pulsed++
          if (pulsed < count) {
            setTimeout(doPulse, duration / 2)
          } else {
            setTimeout(() => {
              element.style.transition = ''
              resolve()
            }, duration / 2)
          }
        }, duration / 2)
      }

      doPulse()
    })
  }

  /**
   * Shake animation for item
   */
  shake(item: GridItem, options: AnimationOptions = {}): Promise<void> {
    if (!item.element) {
      return Promise.resolve()
    }

    const duration = options.duration ?? 500

    return new Promise((resolve) => {
      const element = item.element!
      const keyframes = [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(10px)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(10px)' },
        { transform: 'translateX(0)' }
      ]

      const animation = element.animate(keyframes, {
        duration,
        easing: 'ease-in-out'
      })

      animation.onfinish = () => resolve()
    })
  }

  /**
   * Flash animation for item
   */
  flash(item: GridItem, options: AnimationOptions = {}): Promise<void> {
    if (!item.element) {
      return Promise.resolve()
    }

    const duration = options.duration ?? 400

    return new Promise((resolve) => {
      const element = item.element!
      const keyframes = [
        { opacity: '1' },
        { opacity: '0.3' },
        { opacity: '1' },
        { opacity: '0.3' },
        { opacity: '1' }
      ]

      const animation = element.animate(keyframes, {
        duration,
        easing: 'ease-in-out'
      })

      animation.onfinish = () => resolve()
    })
  }

  /**
   * Stagger animation for multiple items
   */
  stagger(
    items: GridItem[],
    animationFn: (item: GridItem) => Promise<void>,
    delay: number = 50
  ): Promise<void> {
    return items.reduce((promise, item, index) => {
      return promise.then(() => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            animationFn(item).then(resolve)
          }, index * delay)
        })
      })
    }, Promise.resolve())
  }

  /**
   * Custom animation
   */
  custom(
    item: GridItem,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions = {}
  ): Promise<void> {
    if (!item.element) {
      return Promise.resolve()
    }

    return new Promise((resolve) => {
      const animation = item.element!.animate(keyframes, {
        duration: this.defaultDuration,
        easing: this.defaultEasing,
        ...options
      })

      animation.onfinish = () => resolve()
    })
  }

  /**
   * Set default duration
   */
  setDefaultDuration(duration: number): void {
    this.defaultDuration = duration
  }

  /**
   * Set default easing
   */
  setDefaultEasing(easing: string): void {
    this.defaultEasing = easing
  }

  /**
   * Get default duration
   */
  getDefaultDuration(): number {
    return this.defaultDuration
  }

  /**
   * Get default easing
   */
  getDefaultEasing(): string {
    return this.defaultEasing
  }
}

