/**
 * 调整大小处理器
 */

import type { Position, Size, ResizeHandle } from '../types/base';
import type { GridItem } from '../types/item';
import type { GridOptions } from '../types/options';
import type { ResizeEventData } from '../types/events';
import { getEventPosition, closest, disableSelection, enableSelection } from '../utils/dom';
import { getCellWidth, getCellHeight, clampSize } from '../utils/grid';
import { throttle } from '../utils/performance';

export interface ResizeState<T = unknown> {
  item: GridItem<T>;
  direction: ResizeHandle;
  startPos: Position;
  startSize: Size;
  startItemPos: Position;
  currentPos: Position;
  event: MouseEvent | TouchEvent;
}

export interface ResizeCallbacks<T = unknown> {
  onResizeStart?: (data: ResizeEventData<T>) => boolean | void;
  onResize?: (data: ResizeEventData<T>) => void;
  onResizeEnd?: (data: ResizeEventData<T>) => void;
  onResizeCancel?: () => void;
}

export class ResizeHandler<T = unknown> {
  private container: HTMLElement;
  private options: GridOptions;
  private callbacks: ResizeCallbacks<T>;
  private resizeState: ResizeState<T> | null = null;
  private throttledResize: ReturnType<typeof throttle> | null = null;
  private containerRect: DOMRect | null = null;
  private cellWidth = 0;
  private cellHeight = 0;

  constructor(container: HTMLElement, options: GridOptions, callbacks: ResizeCallbacks<T>) {
    this.container = container;
    this.options = options;
    this.callbacks = callbacks;
    this.bindEvents();
  }

  private bindEvents(): void {
    this.container.addEventListener('mousedown', this.handleMouseDown);
    if (this.options.touch) {
      this.container.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    }
  }

  private handleMouseDown = (e: MouseEvent): void => {
    if (e.button !== 0) return;
    const handleInfo = this.getResizeHandle(e.target as HTMLElement);
    if (!handleInfo) return;
    e.preventDefault();
    e.stopPropagation();
    this.startResize(handleInfo.item, handleInfo.direction, e);
  };

  private handleTouchStart = (e: TouchEvent): void => {
    if (e.touches.length !== 1) return;
    const handleInfo = this.getResizeHandle(e.target as HTMLElement);
    if (!handleInfo) return;
    e.preventDefault();
    e.stopPropagation();
    this.startResize(handleInfo.item, handleInfo.direction, e);
  };

  private getResizeHandle(target: HTMLElement): { item: GridItem<T>; direction: ResizeHandle } | null {
    const handleEl = closest(target, '[data-resize-handle]') as HTMLElement | null;
    if (!handleEl) return null;
    const direction = handleEl.dataset['resizeHandle'] as ResizeHandle;
    if (!direction || !this.options.resizeHandles.includes(direction)) return null;
    const itemEl = closest(handleEl, `.${this.options.itemClass}`) as HTMLElement | null;
    if (!itemEl) return null;
    const item = (itemEl as HTMLElement & { _gridItem?: GridItem<T> })._gridItem;
    if (!item || item.static || item.locked || item.resizable === false) return null;
    if (!this.options.resizable && item.resizable !== true) return null;
    return { item, direction };
  }

  private startResize(item: GridItem<T>, direction: ResizeHandle, e: MouseEvent | TouchEvent): void {
    this.containerRect = this.container.getBoundingClientRect();
    this.cellWidth = getCellWidth(this.containerRect.width, this.options);
    this.cellHeight = getCellHeight(this.containerRect.width, this.options);
    const pos = getEventPosition(e);
    this.resizeState = {
      item,
      direction,
      startPos: pos,
      startSize: { w: item.w, h: item.h },
      startItemPos: { x: item.x, y: item.y },
      currentPos: pos,
      event: e,
    };
    item._originalRect = { x: item.x, y: item.y, w: item.w, h: item.h };
    item._isResizing = true;
    disableSelection();
    this.throttledResize = throttle(this.processResize.bind(this), 16);
    if ('touches' in e) {
      document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
      document.addEventListener('touchend', this.handleTouchEnd);
      document.addEventListener('touchcancel', this.handleTouchEnd);
    } else {
      document.addEventListener('mousemove', this.handleMouseMove);
      document.addEventListener('mouseup', this.handleMouseUp);
    }
    const eventData = this.createEventData();
    if (this.callbacks.onResizeStart?.(eventData) === false) this.cancelResize();
  }

  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.resizeState) return;
    e.preventDefault();
    this.resizeState.currentPos = getEventPosition(e);
    this.resizeState.event = e;
    this.throttledResize?.();
  };

  private handleMouseUp = (e: MouseEvent): void => {
    if (!this.resizeState) return;
    e.preventDefault();
    this.endResize();
  };

  private handleTouchMove = (e: TouchEvent): void => {
    if (!this.resizeState) return;
    e.preventDefault();
    this.resizeState.currentPos = getEventPosition(e);
    this.resizeState.event = e;
    this.throttledResize?.();
  };

  private handleTouchEnd = (e: TouchEvent): void => {
    if (!this.resizeState) return;
    e.preventDefault();
    this.endResize();
  };

  private processResize(): void {
    if (!this.resizeState) return;
    const { item, direction, startPos, startSize, startItemPos, currentPos } = this.resizeState;
    const deltaX = currentPos.x - startPos.x;
    const deltaY = currentPos.y - startPos.y;
    const cellWithGap = this.cellWidth + this.options.gap;
    const cellHeightWithGap = this.cellHeight + this.options.gap;
    const deltaW = Math.round(deltaX / cellWithGap);
    const deltaH = Math.round(deltaY / cellHeightWithGap);
    let newW = startSize.w, newH = startSize.h, newX = startItemPos.x, newY = startItemPos.y;

    if (direction.includes('e')) newW = startSize.w + deltaW;
    if (direction.includes('w')) { newW = startSize.w - deltaW; newX = startItemPos.x + deltaW; }
    if (direction.includes('s')) newH = startSize.h + deltaH;
    if (direction.includes('n')) { newH = startSize.h - deltaH; newY = startItemPos.y + deltaH; }

    const clamped = clampSize({ w: newW, h: newH }, { ...item, x: newX }, this.options);
    if (direction.includes('w') && clamped.w !== newW) newX = startItemPos.x + (startSize.w - clamped.w);
    if (direction.includes('n') && clamped.h !== newH) newY = startItemPos.y + (startSize.h - clamped.h);
    newX = Math.max(0, newX);
    newY = Math.max(0, newY);
    item._tempRect = { x: newX, y: newY, w: clamped.w, h: clamped.h };
    this.callbacks.onResize?.(this.createEventData());
  }

  private endResize(): void {
    if (!this.resizeState) return;
    const { item } = this.resizeState;
    if (item._tempRect) {
      item.x = item._tempRect.x;
      item.y = item._tempRect.y;
      item.w = item._tempRect.w;
      item.h = item._tempRect.h;
    }
    this.cleanupResize();
    this.callbacks.onResizeEnd?.(this.createEventData());
    item._isResizing = false;
    item._tempRect = undefined;
    item._originalRect = undefined;
  }

  private cancelResize(): void {
    if (!this.resizeState) return;
    const { item } = this.resizeState;
    if (item._originalRect) {
      item.x = item._originalRect.x;
      item.y = item._originalRect.y;
      item.w = item._originalRect.w;
      item.h = item._originalRect.h;
    }
    this.cleanupResize();
    this.callbacks.onResizeCancel?.();
    item._isResizing = false;
    item._tempRect = undefined;
    item._originalRect = undefined;
  }

  private cleanupResize(): void {
    this.throttledResize?.cancel();
    this.throttledResize = null;
    enableSelection();
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
    document.removeEventListener('touchcancel', this.handleTouchEnd);
    this.resizeState = null;
    this.containerRect = null;
  }

  private createEventData(): ResizeEventData<T> {
    const s = this.resizeState!;
    const rect = s.item._tempRect ?? { x: s.item.x, y: s.item.y, w: s.item.w, h: s.item.h };
    return {
      item: s.item,
      size: { w: rect.w, h: rect.h },
      position: { x: rect.x, y: rect.y },
      direction: s.direction,
      originalEvent: s.event,
    };
  }

  isResizing(): boolean { return this.resizeState !== null; }
  setOptions(options: GridOptions): void { this.options = options; }

  destroy(): void {
    this.cancelResize();
    this.container.removeEventListener('mousedown', this.handleMouseDown);
    this.container.removeEventListener('touchstart', this.handleTouchStart);
  }
}

export function createResizeHandles(container: HTMLElement, handles: ResizeHandle[]): void {
  for (const handle of handles) {
    const el = document.createElement('div');
    el.className = `grid-resize-handle grid-resize-handle-${handle}`;
    el.dataset['resizeHandle'] = handle;
    container.appendChild(el);
  }
}
