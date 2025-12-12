/**
 * Grid - 主网格类
 */

import type { ItemId } from '../types/base';
import type { GridItem, GridItemData } from '../types/item';
import type { GridOptions, DeepPartial } from '../types/options';
import { DEFAULT_OPTIONS } from '../types/options';
import type { GridEventMap, GridEventHandler, ChangeEventData, DragEventData, ResizeEventData } from '../types/events';
import { LayoutEngine } from '../engine/LayoutEngine';
import { DragHandler } from '../handlers/DragHandler';
import { ResizeHandler, createResizeHandles } from '../handlers/ResizeHandler';
import { generateId } from '../utils/items';
import { getCellWidth, getCellHeight, getPixelRect } from '../utils/grid';
import { debounce } from '../utils/performance';
import { createElement, setStyles, addClass, removeClass } from '../utils/dom';

export class Grid<T = unknown> {
  private container: HTMLElement;
  private options: GridOptions;
  private engine: LayoutEngine<T>;
  private dragHandler: DragHandler<T> | null = null;
  private resizeHandler: ResizeHandler<T> | null = null;
  private listeners = new Map<keyof GridEventMap, Set<GridEventHandler<keyof GridEventMap, T>>>();
  private placeholder: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private enabled = true;
  private cellWidth = 0;
  private cellHeight = 0;
  private debouncedLayout: ReturnType<typeof debounce>;
  private styleElement: HTMLStyleElement | null = null;
  // 拖拽/调整大小开始时的原始布局快照
  private originalSnapshot: LayoutEngine<T> | null = null;

  constructor(container: HTMLElement | string, options: DeepPartial<GridOptions> = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container) as HTMLElement
      : container;
    if (!this.container) throw new Error('Grid container not found');

    this.options = { ...DEFAULT_OPTIONS, ...options } as GridOptions;
    this.engine = new LayoutEngine<T>(this.options);
    this.debouncedLayout = debounce(this.updateLayout.bind(this), 100);
    this.init();
  }

  private init(): void {
    addClass(this.container, this.options.containerClass);
    this.container.style.position = 'relative';
    if (this.options.acceptWidgets) this.container.dataset['gridAccept'] = 'true';
    this.injectStyles();
    this.updateDimensions();
    if (this.options.draggable) this.setupDragHandler();
    if (this.options.resizable) this.setupResizeHandler();
    this.setupResizeObserver();
    this.createPlaceholder();
    this.emit('init', undefined as unknown as void);
    this.emit('ready', undefined as unknown as void);
  }

  private injectStyles(): void {
    if (document.getElementById('ldesign-grid-styles')) return;
    this.styleElement = createElement('style', { id: 'ldesign-grid-styles' });
    this.styleElement.textContent = this.generateStyles();
    document.head.appendChild(this.styleElement);
  }

  private generateStyles(): string {
    const { animate, placeholderClass, itemClass, containerClass, draggingClass, resizingClass } = this.options;
    const anim = typeof animate === 'object' ? animate : { enabled: !!animate, duration: 200, easing: 'ease' };
    return `
.${containerClass} { position: relative; box-sizing: border-box; }
.${itemClass} { position: absolute; box-sizing: border-box; ${anim.enabled ? `transition: transform ${anim.duration}ms ${anim.easing}, width ${anim.duration}ms ${anim.easing}, height ${anim.duration}ms ${anim.easing};` : ''} }
.${itemClass}.${draggingClass}, .${itemClass}.${resizingClass} { z-index: 100; opacity: 0.9; transition: none !important; }
.${placeholderClass} { position: absolute; background: rgba(0,120,255,0.15); border: 2px dashed rgba(0,120,255,0.4); border-radius: 4px; z-index: 0; pointer-events: none; ${anim.enabled ? `transition: all ${anim.duration}ms ${anim.easing};` : ''} }
.grid-item-content { width: 100%; height: 100%; overflow: hidden; position: relative; }
.grid-item-inner { width: 100%; height: 100%; overflow: auto; position: relative; z-index: 1; }
.grid-resize-handle { position: absolute; z-index: 10; background: transparent; }
.grid-resize-handle-se { right: 0; bottom: 0; width: 20px; height: 20px; cursor: nwse-resize; }
.grid-resize-handle-sw { left: 0; bottom: 0; width: 20px; height: 20px; cursor: nesw-resize; }
.grid-resize-handle-ne { right: 0; top: 0; width: 20px; height: 20px; cursor: nesw-resize; }
.grid-resize-handle-nw { left: 0; top: 0; width: 20px; height: 20px; cursor: nwse-resize; }
.grid-resize-handle-n, .grid-resize-handle-s { left: 0; right: 0; height: 10px; cursor: ns-resize; }
.grid-resize-handle-n { top: 0; }
.grid-resize-handle-s { bottom: 0; }
.grid-resize-handle-e, .grid-resize-handle-w { top: 0; bottom: 0; width: 10px; cursor: ew-resize; }
.grid-resize-handle-e { right: 0; }
.grid-resize-handle-w { left: 0; }
`;
  }

  private setupDragHandler(): void {
    this.dragHandler = new DragHandler<T>(this.container, this.options, {
      onDragStart: (data) => {
        // 保存原始布局快照
        this.originalSnapshot = this.engine.clone();
        this.updatePlaceholder(data.item);
        this.showPlaceholder();
        addClass(data.item.el!, this.options.draggingClass);
        this.emit('dragstart', data);
        return true;
      },
      onDrag: (data) => {
        // 更新被拖拽元素的视觉位置（跟随鼠标）
        this.updateDraggingItemPosition(data);
        if (data.item._tempRect) this.updatePlaceholder(data.item);
        this.previewLayout(data.item);
        this.emit('drag', data);
      },
      onDragEnd: (data) => {
        this.originalSnapshot = null;
        this.hidePlaceholder();
        removeClass(data.item.el!, this.options.draggingClass);
        // 强制解决碰撞（因为 item 位置已被 DragHandler 更新，直接调用 resolveCollisions）
        this.engine.resolveCollisions(data.item);
        if (this.options.compact) this.engine.compact();
        this.updateAllItems();
        this.emit('dragend', data);
        this.emit('change', { items: [data.item], type: 'move', source: 'user' } as ChangeEventData<T>);
      },
      onDragCancel: () => {
        this.originalSnapshot = null;
        this.hidePlaceholder();
        this.updateAllItems();
      },
    });
  }

  private setupResizeHandler(): void {
    this.resizeHandler = new ResizeHandler<T>(this.container, this.options, {
      onResizeStart: (data) => {
        // 保存原始布局快照
        this.originalSnapshot = this.engine.clone();
        this.updatePlaceholder(data.item);
        this.showPlaceholder();
        addClass(data.item.el!, this.options.resizingClass);
        this.emit('resizestart', data);
        return true;
      },
      onResize: (data) => {
        // 更新正在调整大小的元素的视觉尺寸
        this.updateResizingItemPosition(data);
        if (data.item._tempRect) this.updatePlaceholder(data.item);
        this.previewLayout(data.item);
        this.emit('resize', data);
      },
      onResizeEnd: (data) => {
        this.originalSnapshot = null;
        this.hidePlaceholder();
        removeClass(data.item.el!, this.options.resizingClass);
        // 强制解决碰撞（因为 item 位置/尺寸已被 ResizeHandler 更新）
        this.engine.resolveCollisions(data.item);
        if (this.options.compact) this.engine.compact();
        this.updateAllItems();
        this.emit('resizeend', data);
        this.emit('change', { items: [data.item], type: 'resize', source: 'user' } as ChangeEventData<T>);
      },
      onResizeCancel: () => {
        this.originalSnapshot = null;
        this.hidePlaceholder();
        this.updateAllItems();
      },
    });
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => this.debouncedLayout());
    this.resizeObserver.observe(this.container);
  }

  // ==================== 公共API ====================

  addWidget(data: Partial<GridItemData<T>>): GridItem<T> {
    const item: GridItem<T> = { id: data.id ?? generateId(), x: data.x ?? 0, y: data.y ?? 0, w: data.w ?? 1, h: data.h ?? 1, ...data } as GridItem<T>;
    this.engine.addItem(item, data.autoPosition ?? true);
    this.createItemElement(item);
    this.updateLayout();
    this.emit('added', { items: [item], type: 'add', source: 'api' } as ChangeEventData<T>);
    return item;
  }

  addWidgets(items: Partial<GridItemData<T>>[]): GridItem<T>[] {
    this.engine.beginBatch();
    const added = items.map(data => {
      const item: GridItem<T> = { id: data.id ?? generateId(), x: data.x ?? 0, y: data.y ?? 0, w: data.w ?? 1, h: data.h ?? 1, ...data } as GridItem<T>;
      this.engine.addItem(item, data.autoPosition ?? true);
      this.createItemElement(item);
      return item;
    });
    this.engine.endBatch();
    this.updateLayout();
    this.emit('added', { items: added, type: 'add', source: 'api' } as ChangeEventData<T>);
    return added;
  }

  removeWidget(id: ItemId): boolean {
    const item = this.engine.getItem(id);
    if (!item) return false;
    this.engine.removeItem(id);
    item.el?.remove();
    this.updateLayout();
    this.emit('removed', { items: [item], type: 'remove', source: 'api' } as ChangeEventData<T>);
    return true;
  }

  removeAll(): void {
    const items = this.engine.getItems();
    items.forEach(item => item.el?.remove());
    this.engine.clear();
    this.updateLayout();
    this.emit('removed', { items, type: 'remove', source: 'api' } as ChangeEventData<T>);
  }

  getWidget(id: ItemId): GridItem<T> | undefined { return this.engine.getItem(id); }
  getWidgets(): GridItem<T>[] { return this.engine.getItems(); }
  /** Alias for getWidgets */
  getItems(): GridItem<T>[] { return this.getWidgets(); }

  updateWidget(id: ItemId, updates: Partial<GridItemData<T>>): boolean {
    const success = this.engine.updateItem(id, updates);
    if (success) {
      this.updateLayout();
      this.emit('change', { items: [this.engine.getItem(id)!], type: 'update', source: 'api' } as ChangeEventData<T>);
    }
    return success;
  }

  moveWidget(id: ItemId, x: number, y: number): boolean {
    const success = this.engine.moveItem(id, x, y);
    if (success) this.updateLayout();
    return success;
  }

  resizeWidget(id: ItemId, w: number, h: number): boolean {
    const success = this.engine.resizeItem(id, w, h);
    if (success) this.updateLayout();
    return success;
  }

  load(items: Partial<GridItemData<T>>[]): void {
    this.removeAll();
    this.addWidgets(items);
  }

  save(): GridItemData<T>[] {
    return this.engine.serialize() as GridItemData<T>[];
  }

  compact(): void {
    this.engine.compact();
    this.updateLayout();
    this.emit('compact', undefined as unknown as void);
  }

  enable(): void { this.enabled = true; removeClass(this.container, 'grid-disabled'); this.emit('enable', undefined as unknown as void); }
  disable(): void { this.enabled = false; addClass(this.container, 'grid-disabled'); this.emit('disable', undefined as unknown as void); }
  isEnabled(): boolean { return this.enabled; }

  setOptions(opts: DeepPartial<GridOptions>): void {
    this.options = { ...this.options, ...opts } as GridOptions;
    this.engine.setOptions(this.options);
    this.dragHandler?.setOptions(this.options);
    this.resizeHandler?.setOptions(this.options);
    this.updateDimensions();
    this.updateLayout();
  }

  getOptions(): GridOptions { return { ...this.options }; }
  getHeight(): number { return this.engine.getHeight() * (this.cellHeight + this.options.gap) + this.options.gap; }
  getColumn(): number { return this.options.column; }
  setColumn(col: number): void { this.options.column = col; this.engine.setOptions({ column: col }); this.updateDimensions(); this.updateLayout(); }

  // 便捷方法
  setFloat(value: boolean): void { this.setOptions({ float: value }); if (!value) this.compact(); }
  setStatic(value: boolean): void { this.setOptions({ draggable: !value, resizable: !value }); }
  setCellHeight(height: number): void { this.setOptions({ cellHeight: height }); }

  /** 像素坐标转网格坐标 */
  pixelToGrid(px: number, py: number): { x: number; y: number } {
    this.updateDimensions();
    const { gap } = this.options;
    const marginVal = typeof this.options.margin === 'number' ? this.options.margin : 10;
    const cellW = this.cellWidth + gap;
    const cellH = this.cellHeight + gap;
    return {
      x: Math.round(Math.max(0, (px - marginVal)) / cellW),
      y: Math.round(Math.max(0, (py - marginVal)) / cellH),
    };
  }

  /** 便捷的 change 事件监听 */
  onChange(callback: (items: GridItemData<T>[]) => void): () => void {
    return this.on('change', (data) => callback(data.items.map(i => ({
      id: i.id, x: i.x, y: i.y, w: i.w, h: i.h,
      minW: i.minW, maxW: i.maxW, minH: i.minH, maxH: i.maxH, static: i.static,
    })) as GridItemData<T>[]));
  }

  // ==================== 事件 ====================

  on<K extends keyof GridEventMap>(event: K, handler: GridEventHandler<K, T>): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler as GridEventHandler<keyof GridEventMap, T>);
    return () => this.off(event, handler);
  }

  off<K extends keyof GridEventMap>(event: K, handler: GridEventHandler<K, T>): void {
    this.listeners.get(event)?.delete(handler as GridEventHandler<keyof GridEventMap, T>);
  }

  private emit<K extends keyof GridEventMap>(event: K, data: GridEventMap<T>[K]): void {
    this.listeners.get(event)?.forEach(h => h(data));
  }

  // ==================== DOM ====================

  private createItemElement(item: GridItem<T>): HTMLElement {
    const el = createElement('div', { class: `${this.options.itemClass}${item.className ? ' ' + item.className : ''}`, 'data-grid-id': String(item.id) });
    (el as unknown as { _gridItem: GridItem<T> })._gridItem = item;
    item.el = el;
    // 创建 content 容器
    const content = createElement('div', { class: 'grid-item-content' });
    // 创建内部容器用于放置实际内容（Vue Teleport 目标）
    const inner = createElement('div', { class: 'grid-item-inner' });
    if (item.content) {
      inner.innerHTML = item.content;
    }
    content.appendChild(inner);
    // resize handles 放在 inner 之后（确保在所有内容之上）
    if (this.options.resizable && !item.static && item.resizable !== false) {
      createResizeHandles(content, item.resizeHandles ?? this.options.resizeHandles);
    }
    el.appendChild(content);
    this.applyItemPosition(item);
    this.container.appendChild(el);
    return el;
  }

  private applyItemPosition(item: GridItem<T>): void {
    if (!item.el) return;
    const rect = item._tempRect ?? { x: item.x, y: item.y, w: item.w, h: item.h };
    const px = getPixelRect(rect, this.cellWidth, this.cellHeight, this.options);
    if (this.options.styleMode === 'transform') {
      setStyles(item.el, { transform: `translate(${px.left}px, ${px.top}px)`, width: `${px.width}px`, height: `${px.height}px` });
    } else {
      setStyles(item.el, { left: `${px.left}px`, top: `${px.top}px`, width: `${px.width}px`, height: `${px.height}px` });
    }
    item._pixelRect = px;
  }

  private createPlaceholder(): void {
    this.placeholder = createElement('div', { class: this.options.placeholderClass });
    this.placeholder.style.display = 'none';
    this.container.appendChild(this.placeholder);
  }

  private updatePlaceholder(item: GridItem<T>): void {
    if (!this.placeholder) return;
    const rect = item._tempRect ?? { x: item.x, y: item.y, w: item.w, h: item.h };
    const px = getPixelRect(rect, this.cellWidth, this.cellHeight, this.options);
    if (this.options.styleMode === 'transform') {
      setStyles(this.placeholder, { transform: `translate(${px.left}px, ${px.top}px)`, width: `${px.width}px`, height: `${px.height}px` });
    } else {
      setStyles(this.placeholder, { left: `${px.left}px`, top: `${px.top}px`, width: `${px.width}px`, height: `${px.height}px` });
    }
  }

  private showPlaceholder(): void { if (this.placeholder) this.placeholder.style.display = 'block'; }
  private hidePlaceholder(): void { if (this.placeholder) this.placeholder.style.display = 'none'; }

  /** 更新正在拖拽的元素的视觉位置（跟随鼠标） */
  private updateDraggingItemPosition(data: DragEventData<T>): void {
    const { item, pixelPosition, offset } = data;
    if (!item.el) return;

    const containerRect = this.container.getBoundingClientRect();
    const relX = pixelPosition.x - containerRect.left - offset.x + this.container.scrollLeft;
    const relY = pixelPosition.y - containerRect.top - offset.y + this.container.scrollTop;

    // 计算元素尺寸（保持不变）
    const px = getPixelRect({ x: item.x, y: item.y, w: item.w, h: item.h }, this.cellWidth, this.cellHeight, this.options);

    // 直接设置像素位置和尺寸，让元素跟随鼠标
    if (this.options.styleMode === 'transform') {
      setStyles(item.el, {
        transform: `translate(${relX}px, ${relY}px)`,
        width: `${px.width}px`,
        height: `${px.height}px`
      });
    } else {
      setStyles(item.el, {
        left: `${relX}px`,
        top: `${relY}px`,
        width: `${px.width}px`,
        height: `${px.height}px`
      });
    }
  }

  /** 更新正在调整大小的元素的视觉尺寸 */
  private updateResizingItemPosition(data: ResizeEventData<T>): void {
    const { item } = data;
    if (!item.el || !item._tempRect) return;

    // 使用临时矩形计算像素尺寸
    const px = getPixelRect(item._tempRect, this.cellWidth, this.cellHeight, this.options);

    if (this.options.styleMode === 'transform') {
      setStyles(item.el, {
        transform: `translate(${px.left}px, ${px.top}px)`,
        width: `${px.width}px`,
        height: `${px.height}px`
      });
    } else {
      setStyles(item.el, {
        left: `${px.left}px`,
        top: `${px.top}px`,
        width: `${px.width}px`,
        height: `${px.height}px`
      });
    }
  }

  private updateDimensions(): void {
    const rect = this.container.getBoundingClientRect();
    this.cellWidth = getCellWidth(rect.width, this.options);
    this.cellHeight = getCellHeight(rect.width, this.options);
  }

  private updateLayout(): void {
    this.updateDimensions();
    this.updateAllItems();
    if (this.options.autoHeight) this.container.style.minHeight = `${this.getHeight()}px`;
  }

  private updateAllItems(): void {
    this.engine.getItems().forEach(item => this.applyItemPosition(item));
  }

  private previewLayout(activeItem: GridItem<T>): void {
    // 使用原始快照，确保每次预览都从原始位置开始计算
    const baseEngine = this.originalSnapshot ?? this.engine;
    const preview = baseEngine.clone();
    const temp = activeItem._tempRect;
    if (temp) {
      preview.moveItem(activeItem.id, temp.x, temp.y);
      if (temp.w !== activeItem.w || temp.h !== activeItem.h) preview.resizeItem(activeItem.id, temp.w, temp.h);
    }
    // 更新其他 item 的预览位置
    preview.getItems().forEach(pi => {
      if (pi.id === activeItem.id) return;
      const item = this.engine.getItem(pi.id);
      if (item?.el) {
        const px = getPixelRect({ x: pi.x, y: pi.y, w: pi.w, h: pi.h }, this.cellWidth, this.cellHeight, this.options);
        if (this.options.styleMode === 'transform') setStyles(item.el, { transform: `translate(${px.left}px, ${px.top}px)` });
        else setStyles(item.el, { left: `${px.left}px`, top: `${px.top}px` });
      }
    });
  }

  destroy(): void {
    this.debouncedLayout.cancel();
    this.dragHandler?.destroy();
    this.resizeHandler?.destroy();
    this.resizeObserver?.disconnect();
    this.placeholder?.remove();
    this.listeners.clear();
    this.engine.getItems().forEach(item => item.el?.remove());
    this.engine.clear();
    removeClass(this.container, this.options.containerClass);
    this.emit('destroy', undefined as unknown as void);
  }
}

export function createGrid<T = unknown>(container: HTMLElement | string, options?: DeepPartial<GridOptions>): Grid<T> {
  return new Grid<T>(container, options);
}
