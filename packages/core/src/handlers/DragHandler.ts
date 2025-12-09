/**
 * 拖拽处理器 - 统一的鼠标和触摸拖拽处理
 */

import type { Position } from '../types/base';
import type { GridItem } from '../types/item';
import type { GridOptions } from '../types/options';
import type { DragEventData } from '../types/events';
import { getEventPosition, closest, disableSelection, enableSelection } from '../utils/dom';
import { getCellWidth, getCellHeight, pixelToGrid, clampPosition } from '../utils/grid';
import { throttle } from '../utils/performance';

export interface DragState<T = unknown> {
  item: GridItem<T>;
  startPos: Position;
  startItemPos: Position;
  currentPos: Position;
  offset: Position;
  external: boolean;
  event: MouseEvent | TouchEvent;
  helper?: HTMLElement;
}

export interface DragCallbacks<T = unknown> {
  onDragStart?: (data: DragEventData<T>) => boolean | void;
  onDrag?: (data: DragEventData<T>) => void;
  onDragEnd?: (data: DragEventData<T>) => void;
  onDragCancel?: () => void;
}

export class DragHandler<T = unknown> {
  private container: HTMLElement;
  private options: GridOptions;
  private callbacks: DragCallbacks<T>;
  private dragState: DragState<T> | null = null;
  private throttledDrag: ReturnType<typeof throttle> | null = null;
  private containerRect: DOMRect | null = null;
  private cellWidth = 0;
  private cellHeight = 0;

  constructor(container: HTMLElement, options: GridOptions, callbacks: DragCallbacks<T>) {
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
    const target = e.target as HTMLElement;
    if (this.options.handleCancel && closest(target, this.options.handleCancel)) return;
    const itemEl = closest(target, `.${this.options.itemClass}`) as HTMLElement | null;
    if (!itemEl) return;
    if (this.options.handle && !closest(target, this.options.handle)) return;
    const item = this.getItemFromElement(itemEl);
    if (!item || item.static || item.locked || item.draggable === false) return;
    if (!this.options.draggable && item.draggable !== true) return;
    e.preventDefault();
    this.startDrag(item, e, itemEl);
  };

  private handleTouchStart = (e: TouchEvent): void => {
    if (e.touches.length !== 1) return;
    const target = e.target as HTMLElement;
    if (this.options.handleCancel && closest(target, this.options.handleCancel)) return;
    const itemEl = closest(target, `.${this.options.itemClass}`) as HTMLElement | null;
    if (!itemEl) return;
    if (this.options.handle && !closest(target, this.options.handle)) return;
    const item = this.getItemFromElement(itemEl);
    if (!item || item.static || item.locked || item.draggable === false) return;
    if (!this.options.draggable && item.draggable !== true) return;
    e.preventDefault();
    this.startDrag(item, e, itemEl);
  };

  private startDrag(item: GridItem<T>, e: MouseEvent | TouchEvent, itemEl: HTMLElement): void {
    this.containerRect = this.container.getBoundingClientRect();
    this.cellWidth = getCellWidth(this.containerRect.width, this.options);
    this.cellHeight = getCellHeight(this.containerRect.width, this.options);
    const pos = getEventPosition(e);
    const itemRect = itemEl.getBoundingClientRect();
    this.dragState = {
      item,
      startPos: pos,
      startItemPos: { x: item.x, y: item.y },
      currentPos: pos,
      offset: { x: pos.x - itemRect.left, y: pos.y - itemRect.top },
      external: false,
      event: e,
    };
    item._originalRect = { x: item.x, y: item.y, w: item.w, h: item.h };
    item._isDragging = true;
    disableSelection();
    this.throttledDrag = throttle(this.processDrag.bind(this), 16);
    if ('touches' in e) {
      document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
      document.addEventListener('touchend', this.handleTouchEnd);
      document.addEventListener('touchcancel', this.handleTouchEnd);
    } else {
      document.addEventListener('mousemove', this.handleMouseMove);
      document.addEventListener('mouseup', this.handleMouseUp);
    }
    const eventData = this.createEventData();
    if (this.callbacks.onDragStart?.(eventData) === false) this.cancelDrag();
  }

  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.dragState) return;
    e.preventDefault();
    this.updateDrag(e);
  };

  private handleMouseUp = (e: MouseEvent): void => {
    if (!this.dragState) return;
    e.preventDefault();
    this.endDrag(e);
  };

  private handleTouchMove = (e: TouchEvent): void => {
    if (!this.dragState) return;
    e.preventDefault();
    this.updateDrag(e);
  };

  private handleTouchEnd = (e: TouchEvent): void => {
    if (!this.dragState) return;
    e.preventDefault();
    this.endDrag(e);
  };

  private updateDrag(e: MouseEvent | TouchEvent): void {
    if (!this.dragState) return;
    this.dragState.currentPos = getEventPosition(e);
    this.dragState.event = e;
    this.throttledDrag?.();
  }

  private processDrag(): void {
    if (!this.dragState || !this.containerRect) return;
    const { item, currentPos, offset } = this.dragState;
    const relX = currentPos.x - this.containerRect.left - offset.x + this.container.scrollLeft;
    const relY = currentPos.y - this.containerRect.top - offset.y + this.container.scrollTop;
    const gridPos = pixelToGrid({ x: relX, y: relY }, this.cellWidth, this.cellHeight, this.options);
    const clampedPos = clampPosition(gridPos, item, this.options);
    item._tempRect = { x: clampedPos.x, y: clampedPos.y, w: item.w, h: item.h };
    this.callbacks.onDrag?.(this.createEventData());
  }

  private endDrag(_e: MouseEvent | TouchEvent): void {
    if (!this.dragState) return;
    const { item } = this.dragState;
    if (item._tempRect) {
      item.x = item._tempRect.x;
      item.y = item._tempRect.y;
    }
    this.cleanupDrag();
    this.callbacks.onDragEnd?.(this.createEventData());
    item._isDragging = false;
    item._tempRect = undefined;
    item._originalRect = undefined;
  }

  private cancelDrag(): void {
    if (!this.dragState) return;
    const { item } = this.dragState;
    if (item._originalRect) {
      item.x = item._originalRect.x;
      item.y = item._originalRect.y;
    }
    this.cleanupDrag();
    this.callbacks.onDragCancel?.();
    item._isDragging = false;
    item._tempRect = undefined;
    item._originalRect = undefined;
  }

  private cleanupDrag(): void {
    this.throttledDrag?.cancel();
    this.throttledDrag = null;
    enableSelection();
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
    document.removeEventListener('touchcancel', this.handleTouchEnd);
    this.dragState = null;
    this.containerRect = null;
  }

  private getItemFromElement(el: HTMLElement): GridItem<T> | null {
    return (el as HTMLElement & { _gridItem?: GridItem<T> })._gridItem ?? null;
  }

  private createEventData(): DragEventData<T> {
    const s = this.dragState!;
    const rect = s.item._tempRect ?? { x: s.item.x, y: s.item.y };
    return {
      item: s.item,
      position: { x: rect.x, y: rect.y },
      pixelPosition: s.currentPos,
      originalEvent: s.event,
      external: s.external,
      offset: s.offset,
    };
  }

  isDragging(): boolean { return this.dragState !== null; }
  getDragState(): DragState<T> | null { return this.dragState; }
  setOptions(options: GridOptions): void { this.options = options; }

  destroy(): void {
    this.cancelDrag();
    this.container.removeEventListener('mousedown', this.handleMouseDown);
    this.container.removeEventListener('touchstart', this.handleTouchStart);
  }
}
