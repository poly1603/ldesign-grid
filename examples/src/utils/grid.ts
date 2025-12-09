/**
 * Grid 核心实现 - 简化版
 * 用于示例演示，实际应从 @ldesign/grid-core 引入
 */

export interface GridItemData {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  static?: boolean;
  content?: string;
  [key: string]: any;
}

export interface GridOptions {
  column: number;
  cellHeight: number;
  gap: number;
  margin: number;
  float: boolean;
  animate: boolean;
  staticGrid: boolean;
}

const defaultOptions: GridOptions = {
  column: 12,
  cellHeight: 80,
  gap: 10,
  margin: 10,
  float: false,
  animate: true,
  staticGrid: false,
};

export class Grid {
  container: HTMLElement;
  options: GridOptions;
  items: GridItemData[] = [];
  placeholder: HTMLElement | null = null;

  private itemId = 0;
  private cellWidth = 0;
  private dragState: DragState | null = null;
  private resizeState: ResizeState | null = null;
  private lastMousePos = { x: 0, y: 0 };
  private animationFrame: number | null = null;
  private onChangeCallback?: (items: GridItemData[]) => void;
  private originalPositions: Map<string, { x: number; y: number }> = new Map();

  constructor(container: HTMLElement, options: Partial<GridOptions> = {}) {
    this.container = container;
    this.options = { ...defaultOptions, ...options };
    this.init();
  }

  private init() {
    this.container.style.position = 'relative';
    this.container.classList.add('grid-stack');
    this.createPlaceholder();
    this.updateCellWidth();
    this.bindEvents();
    this.updateHeight();
    window.addEventListener('resize', this.handleResize);
  }

  private handleResize = () => {
    this.updateCellWidth();
    this.items.forEach(item => this.updateItemElement(item));
    this.updateHeight();
  };

  private createPlaceholder() {
    this.placeholder = document.createElement('div');
    this.placeholder.className = 'grid-stack-placeholder';
    this.placeholder.style.cssText = 'position:absolute;display:none;pointer-events:none;z-index:0;background:rgba(0,120,255,0.1);border:2px dashed rgba(0,120,255,0.4);border-radius:4px;';
    this.container.appendChild(this.placeholder);
  }

  private updateCellWidth() {
    const { margin, gap, column } = this.options;
    const width = this.container.clientWidth;
    this.cellWidth = (width - margin * 2 - gap * (column - 1)) / column;
  }

  private bindEvents() {
    this.container.addEventListener('mousedown', this.handleMouseDown, { capture: true });
    this.container.addEventListener('touchstart', this.handleTouchStart, { passive: false, capture: true });
    document.addEventListener('mousemove', this.handleMouseMove, { passive: true });
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd);
    document.addEventListener('keydown', this.handleKeyDown);
  }

  gridToPixel(x: number, y: number, w: number, h: number) {
    const { margin, gap, cellHeight } = this.options;
    return {
      left: margin + x * (this.cellWidth + gap),
      top: margin + y * (cellHeight + gap),
      width: w * this.cellWidth + (w - 1) * gap,
      height: h * cellHeight + (h - 1) * gap,
    };
  }

  pixelToGrid(px: number, py: number): { x: number; y: number } {
    const { margin, gap, cellHeight } = this.options;
    const cellW = this.cellWidth + gap;
    const cellH = cellHeight + gap;
    return {
      x: Math.round(Math.max(0, (px - margin)) / cellW),
      y: Math.round(Math.max(0, (py - margin)) / cellH),
    };
  }

  private collides(a: GridItemData, b: GridItemData): boolean {
    return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
  }

  private getCollisions(item: GridItemData): GridItemData[] {
    return this.items.filter(other => other.id !== item.id && this.collides(item, other));
  }

  private isAreaEmpty(x: number, y: number, w: number, h: number, excludeId?: string): boolean {
    const testItem = { id: excludeId || '', x, y, w, h };
    return this.getCollisions(testItem).length === 0;
  }

  private pushItemsDown(pusher: GridItemData, collisions: GridItemData[]) {
    collisions.sort((a, b) => a.y - b.y);
    for (const item of collisions) {
      if (item.static) continue;
      const newY = pusher.y + pusher.h;
      if (newY > item.y) {
        item.y = newY;
        const newCollisions = this.getCollisions(item);
        if (newCollisions.length > 0) this.pushItemsDown(item, newCollisions);
        this.updateItemElement(item);
      }
    }
  }

  private findPosition(item: GridItemData): { x: number; y: number } {
    const { column } = this.options;
    for (let y = 0; y < 100; y++) {
      for (let x = 0; x <= column - item.w; x++) {
        if (this.isAreaEmpty(x, y, item.w, item.h, item.id)) return { x, y };
      }
    }
    return { x: 0, y: this.getMaxY() };
  }

  private getMaxY(): number {
    return this.items.length === 0 ? 0 : Math.max(...this.items.map(i => i.y + i.h));
  }

  compact() {
    if (this.options.float) return;
    const sorted = [...this.items].filter(i => !i.static).sort((a, b) => a.y - b.y || a.x - b.x);
    for (const item of sorted) {
      while (item.y > 0 && this.isAreaEmpty(item.x, item.y - 1, item.w, item.h, item.id)) item.y--;
    }
    this.items.forEach(item => this.updateItemElement(item));
  }

  private handleMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return;
    this.startInteraction(e.target as HTMLElement, e.clientX, e.clientY, e);
  };

  private handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    this.startInteraction(e.target as HTMLElement, touch.clientX, touch.clientY, e);
  };

  private startInteraction(target: HTMLElement, clientX: number, clientY: number, e: Event) {
    if (this.options.staticGrid) return;

    const resizeHandle = target.closest('[data-gs-resize]') as HTMLElement;
    if (resizeHandle) {
      const itemEl = resizeHandle.closest('.grid-stack-item') as HTMLElement;
      if (itemEl) {
        e.preventDefault();
        e.stopPropagation();
        this.startResize(itemEl, clientX, clientY, resizeHandle.dataset.gsResize || 'se');
        return;
      }
    }

    const itemEl = target.closest('.grid-stack-item') as HTMLElement;
    if (!itemEl) return;
    if (target.closest('input, textarea, button, select, a, [data-no-drag]')) return;

    e.preventDefault();
    e.stopPropagation();
    this.startDrag(itemEl, clientX, clientY);
  }

  private startDrag(itemEl: HTMLElement, clientX: number, clientY: number) {
    const item = this.items.find(i => i.id === itemEl.dataset.gsId);
    if (!item || item.static) return;

    const rect = itemEl.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();

    this.originalPositions.clear();
    this.items.forEach(i => this.originalPositions.set(i.id, { x: i.x, y: i.y }));

    this.dragState = {
      item, itemEl,
      startX: clientX, startY: clientY,
      startItemX: item.x, startItemY: item.y,
      offsetX: clientX - rect.left, offsetY: clientY - rect.top,
      containerRect, lastX: item.x, lastY: item.y,
    };

    this.lastMousePos = { x: clientX, y: clientY };
    itemEl.classList.add('grid-stack-item-dragging');
    itemEl.style.zIndex = '1000';
    itemEl.style.transition = 'none';
    this.showPlaceholder(item);
    this.container.dispatchEvent(new CustomEvent('dragstart', { detail: { item } }));
  }

  private startResize(itemEl: HTMLElement, clientX: number, clientY: number, direction: string) {
    const item = this.items.find(i => i.id === itemEl.dataset.gsId);
    if (!item || item.static) return;

    this.originalPositions.clear();
    this.items.forEach(i => this.originalPositions.set(i.id, { x: i.x, y: i.y }));

    this.resizeState = {
      item, itemEl, direction,
      startX: clientX, startY: clientY,
      startW: item.w, startH: item.h,
      startItemX: item.x, startItemY: item.y,
      containerRect: this.container.getBoundingClientRect(),
    };

    itemEl.classList.add('grid-stack-item-resizing');
    itemEl.style.zIndex = '1000';
    itemEl.style.transition = 'none';
    this.showPlaceholder(item);
  }

  private handleMouseMove = (e: MouseEvent) => {
    this.lastMousePos = { x: e.clientX, y: e.clientY };
    this.scheduleUpdate();
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length !== 1) return;
    if (this.dragState || this.resizeState) e.preventDefault();
    const touch = e.touches[0];
    this.lastMousePos = { x: touch.clientX, y: touch.clientY };
    this.scheduleUpdate();
  };

  private scheduleUpdate() {
    if (this.animationFrame) return;
    this.animationFrame = requestAnimationFrame(() => {
      this.animationFrame = null;
      this.performUpdate();
    });
  }

  private performUpdate() {
    const { x: clientX, y: clientY } = this.lastMousePos;
    if (this.dragState) this.updateDrag(clientX, clientY);
    else if (this.resizeState) this.updateResize(clientX, clientY);
  }

  private updateDrag(clientX: number, clientY: number) {
    const state = this.dragState!;
    const { item, itemEl, offsetX, offsetY, containerRect } = state;

    const relX = clientX - containerRect.left - offsetX + this.container.scrollLeft;
    const relY = clientY - containerRect.top - offsetY + this.container.scrollTop;

    const pixel = this.gridToPixel(0, 0, item.w, item.h);
    itemEl.style.transform = `translate(${relX}px, ${relY}px)`;
    itemEl.style.width = `${pixel.width}px`;
    itemEl.style.height = `${pixel.height}px`;

    const gridPos = this.pixelToGrid(relX, relY);
    const newX = Math.max(0, Math.min(this.options.column - item.w, gridPos.x));
    const newY = Math.max(0, gridPos.y);

    if (newX !== state.lastX || newY !== state.lastY) {
      state.lastX = newX;
      state.lastY = newY;

      this.items.forEach(i => {
        if (i.id !== item.id) {
          const orig = this.originalPositions.get(i.id);
          if (orig) { i.x = orig.x; i.y = orig.y; }
        }
      });

      item.x = newX;
      item.y = newY;

      if (!this.options.float) {
        const collisions = this.getCollisions(item);
        if (collisions.length > 0) this.pushItemsDown(item, collisions);
      }

      this.updatePlaceholder(newX, newY, item.w, item.h);
      this.items.forEach(i => { if (i.id !== item.id) this.updateItemElement(i, true); });
    }
  }

  private updateResize(clientX: number, clientY: number) {
    const state = this.resizeState!;
    const { item, itemEl, direction, startX, startY, startW, startH, startItemX, startItemY } = state;
    const { gap, cellHeight, column } = this.options;

    const deltaX = clientX - startX;
    const deltaY = clientY - startY;
    const cellWithGap = this.cellWidth + gap;
    const cellHeightWithGap = cellHeight + gap;

    let newW = startW, newH = startH, newX = startItemX, newY = startItemY;

    if (direction.includes('e')) newW = Math.max(item.minW || 1, Math.min(item.maxW || column, startW + Math.round(deltaX / cellWithGap)));
    if (direction.includes('w')) {
      const dw = Math.round(deltaX / cellWithGap);
      newW = Math.max(item.minW || 1, Math.min(item.maxW || column, startW - dw));
      newX = startItemX + (startW - newW);
    }
    if (direction.includes('s')) newH = Math.max(item.minH || 1, Math.min(item.maxH || 100, startH + Math.round(deltaY / cellHeightWithGap)));
    if (direction.includes('n')) {
      const dh = Math.round(deltaY / cellHeightWithGap);
      newH = Math.max(item.minH || 1, Math.min(item.maxH || 100, startH - dh));
      newY = startItemY + (startH - newH);
    }

    newX = Math.max(0, newX);
    newY = Math.max(0, newY);
    newW = Math.min(newW, column - newX);

    const pixel = this.gridToPixel(newX, newY, newW, newH);
    itemEl.style.transform = `translate(${pixel.left}px, ${pixel.top}px)`;
    itemEl.style.width = `${pixel.width}px`;
    itemEl.style.height = `${pixel.height}px`;
    this.updatePlaceholder(newX, newY, newW, newH);

    const lastW = state.targetW ?? startW;
    const lastH = state.targetH ?? startH;

    if (newW !== lastW || newH !== lastH || newX !== (state.targetX ?? startItemX) || newY !== (state.targetY ?? startItemY)) {
      this.items.forEach(i => {
        if (i.id !== item.id) {
          const orig = this.originalPositions.get(i.id);
          if (orig) { i.x = orig.x; i.y = orig.y; }
        }
      });

      item.x = newX; item.y = newY; item.w = newW; item.h = newH;

      if (!this.options.float) {
        const collisions = this.getCollisions(item);
        if (collisions.length > 0) this.pushItemsDown(item, collisions);
      }

      this.items.forEach(i => { if (i.id !== item.id) this.updateItemElement(i, true); });
    }

    state.targetX = newX; state.targetY = newY; state.targetW = newW; state.targetH = newH;
  }

  private handleMouseUp = () => this.endInteraction();
  private handleTouchEnd = () => this.endInteraction();
  private handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape' && (this.dragState || this.resizeState)) this.cancelInteraction(); };

  private cancelInteraction() {
    if (this.dragState) {
      const { item, itemEl } = this.dragState;
      this.items.forEach(i => {
        const orig = this.originalPositions.get(i.id);
        if (orig) { i.x = orig.x; i.y = orig.y; this.updateItemElement(i, true); }
      });
      itemEl.classList.remove('grid-stack-item-dragging');
      itemEl.style.zIndex = '';
      itemEl.style.transition = '';
      this.updateItemElement(item, true);
    }
    if (this.resizeState) {
      const { item, itemEl, startItemX, startItemY, startW, startH } = this.resizeState;
      item.x = startItemX; item.y = startItemY; item.w = startW; item.h = startH;
      itemEl.classList.remove('grid-stack-item-resizing');
      itemEl.style.zIndex = '';
      itemEl.style.transition = '';
      this.updateItemElement(item, true);
    }
    this.hidePlaceholder();
    this.dragState = null;
    this.resizeState = null;
  }

  private endInteraction() {
    if (this.animationFrame) { cancelAnimationFrame(this.animationFrame); this.animationFrame = null; }
    if (this.dragState) this.endDrag();
    else if (this.resizeState) this.endResize();
  }

  private endDrag() {
    const state = this.dragState!;
    const { item, itemEl, lastX, lastY } = state;
    item.x = lastX; item.y = lastY;
    itemEl.classList.remove('grid-stack-item-dragging');
    itemEl.style.zIndex = '';
    itemEl.style.transition = '';
    this.hidePlaceholder();
    this.compact();
    this.updateItemElement(item, true);
    this.updateHeight();
    this.triggerChange();
    this.container.dispatchEvent(new CustomEvent('dragend', { detail: { item } }));
    this.dragState = null;
  }

  private endResize() {
    const state = this.resizeState!;
    const { item, itemEl, targetX, targetY, targetW, targetH } = state;
    if (targetW !== undefined && targetH !== undefined) {
      item.x = targetX!; item.y = targetY!; item.w = targetW; item.h = targetH;
      if (!this.options.float) {
        const collisions = this.getCollisions(item);
        if (collisions.length > 0) this.pushItemsDown(item, collisions);
      }
    }
    itemEl.classList.remove('grid-stack-item-resizing');
    itemEl.style.zIndex = '';
    itemEl.style.transition = '';
    this.hidePlaceholder();
    this.compact();
    this.items.forEach(i => this.updateItemElement(i, true));
    this.updateHeight();
    this.triggerChange();
    this.resizeState = null;
  }

  private showPlaceholder(item: GridItemData) {
    if (!this.placeholder) return;
    this.updatePlaceholder(item.x, item.y, item.w, item.h);
    this.placeholder.style.display = 'block';
  }

  private updatePlaceholder(x: number, y: number, w: number, h: number) {
    if (!this.placeholder) return;
    const pixel = this.gridToPixel(x, y, w, h);
    this.placeholder.style.transform = `translate(${pixel.left}px, ${pixel.top}px)`;
    this.placeholder.style.width = `${pixel.width}px`;
    this.placeholder.style.height = `${pixel.height}px`;
  }

  private hidePlaceholder() {
    if (this.placeholder) this.placeholder.style.display = 'none';
  }

  private updateItemElement(item: GridItemData, animate = false) {
    const el = this.container.querySelector(`[data-gs-id="${item.id}"]`) as HTMLElement;
    if (!el) return;
    const pixel = this.gridToPixel(item.x, item.y, item.w, item.h);
    if (animate && this.options.animate) el.style.transition = 'transform 0.2s ease, width 0.2s ease, height 0.2s ease';
    el.style.transform = `translate(${pixel.left}px, ${pixel.top}px)`;
    el.style.width = `${pixel.width}px`;
    el.style.height = `${pixel.height}px`;
  }

  updateHeight() {
    const maxY = this.getMaxY();
    const { margin, gap, cellHeight } = this.options;
    const height = margin + maxY * (cellHeight + gap);
    this.container.style.minHeight = `${Math.max(height, cellHeight + margin * 2)}px`;
  }

  addWidget(data: Partial<GridItemData> = {}): GridItemData {
    const id = data.id || `gs-${++this.itemId}`;
    const item: GridItemData = { id, x: data.x ?? 0, y: data.y ?? 0, w: data.w ?? 2, h: data.h ?? 2, ...data };
    if (data.x === undefined || data.y === undefined) {
      const pos = this.findPosition(item);
      item.x = pos.x; item.y = pos.y;
    }
    if (!this.options.float) {
      const collisions = this.getCollisions(item);
      if (collisions.length > 0) this.pushItemsDown(item, collisions);
    }
    this.items.push(item);
    this.renderItem(item);
    this.compact();
    this.updateHeight();
    return item;
  }

  private renderItem(item: GridItemData) {
    const el = document.createElement('div');
    el.className = 'grid-stack-item';
    el.dataset.gsId = item.id;
    el.innerHTML = `<div class="grid-stack-item-content">${item.content || ''}<div class="gs-resize-handle gs-resize-handle-se" data-gs-resize="se"></div></div>`;
    const p = this.gridToPixel(item.x, item.y, item.w, item.h);
    el.style.transform = `translate(${p.left}px, ${p.top}px)`;
    el.style.width = `${p.width}px`;
    el.style.height = `${p.height}px`;
    this.container.appendChild(el);
  }

  removeWidget(id: string): boolean {
    const index = this.items.findIndex(i => i.id === id);
    if (index === -1) return false;
    const el = this.container.querySelector(`[data-gs-id="${id}"]`);
    el?.remove();
    this.items.splice(index, 1);
    this.compact();
    this.updateHeight();
    this.triggerChange();
    return true;
  }

  removeAll() {
    this.items.forEach(item => {
      const el = this.container.querySelector(`[data-gs-id="${item.id}"]`);
      el?.remove();
    });
    this.items = [];
    this.updateHeight();
    this.triggerChange();
  }

  getItems(): GridItemData[] { return [...this.items]; }

  load(items: GridItemData[]) {
    this.removeAll();
    items.forEach(item => this.addWidget(item));
  }

  save(): GridItemData[] {
    return this.items.map(({ id, x, y, w, h, minW, maxW, minH, maxH, static: s, content }) =>
      ({ id, x, y, w, h, minW, maxW, minH, maxH, static: s, content }));
  }

  setStatic(value: boolean) { this.options.staticGrid = value; }
  setFloat(value: boolean) {
    this.options.float = value;
    if (!value) { this.compact(); this.items.forEach(item => this.updateItemElement(item, true)); this.updateHeight(); }
  }
  setColumn(column: number) {
    this.options.column = column;
    this.updateCellWidth();
    this.items.forEach(item => {
      if (item.x + item.w > column) { item.w = Math.min(item.w, column); item.x = Math.max(0, column - item.w); }
    });
    this.compact();
    this.items.forEach(item => this.updateItemElement(item, true));
    this.updateHeight();
    this.triggerChange();
  }
  setCellHeight(height: number) {
    this.options.cellHeight = height;
    this.items.forEach(item => this.updateItemElement(item, true));
    this.updateHeight();
  }

  onChange(callback: (items: GridItemData[]) => void) { this.onChangeCallback = callback; }
  private triggerChange() { this.onChangeCallback?.(this.save()); }

  on(event: string, handler: (data: any) => void) {
    this.container.addEventListener(event, ((e: CustomEvent) => handler(e.detail)) as EventListener);
    return () => this.container.removeEventListener(event, handler as EventListener);
  }

  destroy() {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
    document.removeEventListener('keydown', this.handleKeyDown);
    this.placeholder?.remove();
  }
}

interface DragState {
  item: GridItemData;
  itemEl: HTMLElement;
  startX: number;
  startY: number;
  startItemX: number;
  startItemY: number;
  offsetX: number;
  offsetY: number;
  containerRect: DOMRect;
  lastX: number;
  lastY: number;
}

interface ResizeState {
  item: GridItemData;
  itemEl: HTMLElement;
  direction: string;
  startX: number;
  startY: number;
  startW: number;
  startH: number;
  startItemX: number;
  startItemY: number;
  containerRect: DOMRect;
  targetX?: number;
  targetY?: number;
  targetW?: number;
  targetH?: number;
}

export function createGrid(container: HTMLElement | string, options?: Partial<GridOptions>): Grid {
  const el = typeof container === 'string' ? document.querySelector(container) as HTMLElement : container;
  return new Grid(el, options);
}
