/**
 * 外部拖拽处理器 - 支持从网格外部拖入元素
 */

import type { Position, Size } from '../types/base';
import type { GridItem, GridItemData } from '../types/item';
import type { GridOptions } from '../types/options';
import type { ExternalDragConfig } from '../types';
import { getEventPosition, closest, setStyles } from '../utils/dom';
import { getCellWidth, getCellHeight, pixelToGrid } from '../utils/grid';
import { generateId } from '../utils/items';

export interface ExternalDragState {
  sourceEl: HTMLElement;
  helper: HTMLElement;
  startPos: Position;
  currentPos: Position;
  defaultSize: Size;
  itemData: Partial<GridItemData>;
}

export interface ExternalDragCallbacks<T = unknown> {
  onExternalDragStart?: (el: HTMLElement, data: Partial<GridItemData<T>>) => boolean | void;
  onExternalDragOver?: (pos: Position, data: Partial<GridItemData<T>>) => void;
  onExternalDrop?: (item: GridItem<T>) => void;
  onExternalDragEnd?: () => void;
}

export class ExternalDragHandler<T = unknown> {
  private container: HTMLElement;
  private options: GridOptions;
  private config: ExternalDragConfig;
  private callbacks: ExternalDragCallbacks<T>;
  private dragState: ExternalDragState | null = null;
  private sources: HTMLElement[] = [];
  private containerRect: DOMRect | null = null;

  constructor(
    container: HTMLElement,
    options: GridOptions,
    config: ExternalDragConfig,
    callbacks: ExternalDragCallbacks<T>
  ) {
    this.container = container;
    this.options = options;
    this.config = config;
    this.callbacks = callbacks;
    this.setupSources();
  }

  private setupSources(): void {
    const { source } = this.config;
    if (typeof source === 'string') {
      this.sources = Array.from(document.querySelectorAll(source));
    } else if (source instanceof HTMLElement) {
      this.sources = [source];
    } else if (Array.isArray(source)) {
      this.sources = source;
    }
    this.sources.forEach(el => this.bindSource(el));
  }

  private bindSource(el: HTMLElement): void {
    el.addEventListener('mousedown', this.handleMouseDown);
    el.addEventListener('touchstart', this.handleTouchStart, { passive: false });
  }

  private handleMouseDown = (e: MouseEvent): void => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    const sourceEl = this.findSourceElement(target);
    if (!sourceEl) return;
    if (this.config.handle && !closest(target, this.config.handle)) return;
    e.preventDefault();
    this.startDrag(sourceEl, e);
  };

  private handleTouchStart = (e: TouchEvent): void => {
    if (e.touches.length !== 1) return;
    const target = e.target as HTMLElement;
    const sourceEl = this.findSourceElement(target);
    if (!sourceEl) return;
    if (this.config.handle && !closest(target, this.config.handle)) return;
    e.preventDefault();
    this.startDrag(sourceEl, e);
  };

  private findSourceElement(target: HTMLElement): HTMLElement | null {
    for (const source of this.sources) {
      if (source.contains(target)) return source;
    }
    return null;
  }

  private startDrag(sourceEl: HTMLElement, e: MouseEvent | TouchEvent): void {
    const pos = getEventPosition(e);
    const itemData = this.config.createItem?.(sourceEl) ?? {};
    const defaultSize = this.config.defaultSize ?? { w: 1, h: 1 };

    // 创建辅助元素
    const helper = this.createHelper(sourceEl);
    this.positionHelper(helper, pos);

    this.dragState = {
      sourceEl,
      helper,
      startPos: pos,
      currentPos: pos,
      defaultSize,
      itemData,
    };

    this.containerRect = this.container.getBoundingClientRect();

    if (this.callbacks.onExternalDragStart?.(sourceEl, itemData as Partial<GridItemData<T>>) === false) {
      this.cancelDrag();
      return;
    }

    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd);
    document.addEventListener('touchcancel', this.handleTouchEnd);
  }

  private createHelper(sourceEl: HTMLElement): HTMLElement {
    let helper: HTMLElement;

    if (this.config.helper === 'clone') {
      helper = sourceEl.cloneNode(true) as HTMLElement;
    } else if (this.config.helper === 'original') {
      helper = sourceEl;
    } else if (typeof this.config.helper === 'function') {
      helper = this.config.helper(sourceEl);
    } else {
      helper = sourceEl.cloneNode(true) as HTMLElement;
    }

    helper.classList.add('grid-external-helper');
    setStyles(helper, {
      position: 'fixed',
      zIndex: String(this.config.zIndex ?? 10000),
      opacity: String(this.config.opacity ?? 0.8),
      pointerEvents: 'none',
    });

    const appendTo = this.config.appendTo
      ? (typeof this.config.appendTo === 'string'
        ? document.querySelector(this.config.appendTo)
        : this.config.appendTo)
      : document.body;

    (appendTo ?? document.body).appendChild(helper);
    return helper;
  }

  private positionHelper(helper: HTMLElement, pos: Position): void {
    const rect = helper.getBoundingClientRect();
    setStyles(helper, {
      left: `${pos.x - rect.width / 2}px`,
      top: `${pos.y - rect.height / 2}px`,
    });
  }

  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.dragState) return;
    e.preventDefault();
    this.updateDrag(getEventPosition(e));
  };

  private handleMouseUp = (e: MouseEvent): void => {
    if (!this.dragState) return;
    e.preventDefault();
    this.endDrag(getEventPosition(e));
  };

  private handleTouchMove = (e: TouchEvent): void => {
    if (!this.dragState) return;
    e.preventDefault();
    this.updateDrag(getEventPosition(e));
  };

  private handleTouchEnd = (e: TouchEvent): void => {
    if (!this.dragState) return;
    e.preventDefault();
    const pos = e.changedTouches.length > 0
      ? getEventPosition(e)
      : this.dragState.currentPos;
    this.endDrag(pos);
  };

  private updateDrag(pos: Position): void {
    if (!this.dragState || !this.containerRect) return;
    this.dragState.currentPos = pos;
    this.positionHelper(this.dragState.helper, pos);

    // 检查是否在容器上方
    if (this.isOverContainer(pos)) {
      this.container.classList.add('grid-drop-target');
      const cellWidth = getCellWidth(this.containerRect.width, this.options);
      const cellHeight = getCellHeight(this.containerRect.width, this.options);
      const relX = pos.x - this.containerRect.left;
      const relY = pos.y - this.containerRect.top;
      const gridPos = pixelToGrid({ x: relX, y: relY }, cellWidth, cellHeight, this.options);
      this.callbacks.onExternalDragOver?.(gridPos, this.dragState.itemData as Partial<GridItemData<T>>);
    } else {
      this.container.classList.remove('grid-drop-target');
    }
  }

  private endDrag(pos: Position): void {
    if (!this.dragState || !this.containerRect) return;

    const isOver = this.isOverContainer(pos);

    if (isOver) {
      const cellWidth = getCellWidth(this.containerRect.width, this.options);
      const cellHeight = getCellHeight(this.containerRect.width, this.options);
      const relX = pos.x - this.containerRect.left;
      const relY = pos.y - this.containerRect.top;
      const gridPos = pixelToGrid({ x: relX, y: relY }, cellWidth, cellHeight, this.options);

      const newItem: GridItem<T> = {
        id: this.dragState.itemData.id ?? generateId(),
        x: gridPos.x,
        y: gridPos.y,
        w: this.dragState.defaultSize.w,
        h: this.dragState.defaultSize.h,
        ...this.dragState.itemData,
      } as GridItem<T>;

      this.callbacks.onExternalDrop?.(newItem);

      if (this.config.removeOnDrop && this.dragState.sourceEl.parentNode) {
        this.dragState.sourceEl.remove();
      }
    }

    this.cleanupDrag();
    this.callbacks.onExternalDragEnd?.();
  }

  private cancelDrag(): void {
    this.cleanupDrag();
    this.callbacks.onExternalDragEnd?.();
  }

  private cleanupDrag(): void {
    if (this.dragState) {
      if (this.dragState.helper !== this.dragState.sourceEl) {
        this.dragState.helper.remove();
      }
    }
    this.container.classList.remove('grid-drop-target');
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
    document.removeEventListener('touchcancel', this.handleTouchEnd);
    this.dragState = null;
    this.containerRect = null;
  }

  private isOverContainer(pos: Position): boolean {
    if (!this.containerRect) return false;
    return (
      pos.x >= this.containerRect.left &&
      pos.x <= this.containerRect.right &&
      pos.y >= this.containerRect.top &&
      pos.y <= this.containerRect.bottom
    );
  }

  addSource(el: HTMLElement): void {
    if (!this.sources.includes(el)) {
      this.sources.push(el);
      this.bindSource(el);
    }
  }

  removeSource(el: HTMLElement): void {
    const index = this.sources.indexOf(el);
    if (index !== -1) {
      this.sources.splice(index, 1);
      el.removeEventListener('mousedown', this.handleMouseDown);
      el.removeEventListener('touchstart', this.handleTouchStart);
    }
  }

  setConfig(config: Partial<ExternalDragConfig>): void {
    this.config = { ...this.config, ...config };
  }

  destroy(): void {
    this.cancelDrag();
    this.sources.forEach(el => {
      el.removeEventListener('mousedown', this.handleMouseDown);
      el.removeEventListener('touchstart', this.handleTouchStart);
    });
    this.sources = [];
  }
}
