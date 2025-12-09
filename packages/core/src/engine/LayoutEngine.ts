/**
 * 布局引擎 - 核心布局算法
 */

import type { Rect, Position, ItemId } from '../types/base';
import type { GridItem } from '../types/item';
import type { GridOptions } from '../types/options';

/** 碰撞检测结果 */
interface CollisionResult<T> {
  collides: boolean;
  items: GridItem<T>[];
}

/** 放置验证结果 */
interface PlacementResult<T> {
  valid: boolean;
  position: Position;
  displaced: GridItem<T>[];
}
import { intersects, cloneRect, manhattanDistance } from '../utils/geometry';
import { getItemRect, sortItems, cloneItem } from '../utils/items';
import { clampPosition, clampSize, getGridHeight } from '../utils/grid';

export class LayoutEngine<T = unknown> {
  private items: GridItem<T>[] = [];
  private options: GridOptions;
  private itemMap: Map<ItemId, GridItem<T>> = new Map();
  private batchMode = false;
  private pendingUpdates: Set<ItemId> = new Set();

  constructor(options: GridOptions) {
    this.options = options;
  }

  getItems(): GridItem<T>[] { return this.items; }
  getItem(id: ItemId): GridItem<T> | undefined { return this.itemMap.get(id); }
  getHeight(): number { return getGridHeight(this.items); }
  getOptions(): GridOptions { return this.options; }

  setOptions(options: Partial<GridOptions>): void {
    this.options = { ...this.options, ...options };
  }

  beginBatch(): void {
    this.batchMode = true;
    this.pendingUpdates.clear();
  }

  endBatch(): GridItem<T>[] {
    this.batchMode = false;
    const updated = Array.from(this.pendingUpdates)
      .map(id => this.itemMap.get(id))
      .filter((item): item is GridItem<T> => item !== undefined);
    this.pendingUpdates.clear();
    if (this.options.compact) this.compact();
    return updated;
  }

  addItem(item: GridItem<T>, autoPosition = true): GridItem<T> {
    if (this.itemMap.has(item.id)) {
      throw new Error(`Item "${item.id}" already exists`);
    }
    if (autoPosition && (item.autoPosition || item.x === undefined || item.y === undefined)) {
      const pos = this.findPosition(item);
      item.x = pos.x;
      item.y = pos.y;
    }
    const clampedPos = clampPosition(item, item, this.options);
    item.x = clampedPos.x;
    item.y = clampedPos.y;
    this.items.push(item);
    this.itemMap.set(item.id, item);
    if (!item.static) this.resolveCollisions(item);
    if (this.options.compact && !this.batchMode) this.compact();
    return item;
  }

  addItems(items: GridItem<T>[]): GridItem<T>[] {
    this.beginBatch();
    const added = items.map(item => this.addItem(item, true));
    this.endBatch();
    return added;
  }

  removeItem(id: ItemId): GridItem<T> | undefined {
    const item = this.itemMap.get(id);
    if (!item) return undefined;
    const index = this.items.indexOf(item);
    if (index !== -1) this.items.splice(index, 1);
    this.itemMap.delete(id);
    if (this.options.compact && !this.batchMode) this.compact();
    return item;
  }

  clear(): void {
    this.items = [];
    this.itemMap.clear();
  }

  load(items: GridItem<T>[]): void {
    this.clear();
    this.addItems(items);
  }

  moveItem(id: ItemId, x: number, y: number): boolean {
    const item = this.itemMap.get(id);
    if (!item || item.static || item.locked) return false;
    const newPos = clampPosition({ x, y }, item, this.options);
    if (newPos.x === item.x && newPos.y === item.y) return false;
    const originalRect = cloneRect(item);
    item.x = newPos.x;
    item.y = newPos.y;
    item._lastUpdate = Date.now();
    this.resolveCollisions(item, originalRect);
    if (this.options.compact && !this.batchMode) this.compact();
    this.markUpdated(id);
    return true;
  }

  resizeItem(id: ItemId, w: number, h: number): boolean {
    const item = this.itemMap.get(id);
    if (!item || item.static || item.locked) return false;
    const newSize = clampSize({ w, h }, item, this.options);
    if (newSize.w === item.w && newSize.h === item.h) return false;
    const originalRect = cloneRect(item);
    item.w = newSize.w;
    item.h = newSize.h;
    item._lastUpdate = Date.now();
    this.resolveCollisions(item, originalRect);
    if (this.options.compact && !this.batchMode) this.compact();
    this.markUpdated(id);
    return true;
  }

  updateItem(id: ItemId, updates: Partial<GridItem<T>>): boolean {
    const item = this.itemMap.get(id);
    if (!item) return false;
    Object.assign(item, updates);
    item._lastUpdate = Date.now();
    if ('x' in updates || 'y' in updates || 'w' in updates || 'h' in updates) {
      this.resolveCollisions(item);
      if (this.options.compact && !this.batchMode) this.compact();
    }
    this.markUpdated(id);
    return true;
  }

  checkCollision(item: GridItem<T>, exclude?: ItemId): CollisionResult<T> {
    const rect = getItemRect(item);
    const colliding: GridItem<T>[] = [];
    for (const other of this.items) {
      if (other.id === item.id || other.id === exclude) continue;
      if (intersects(rect, getItemRect(other))) colliding.push(other);
    }
    return { collides: colliding.length > 0, items: colliding };
  }

  resolveCollisions(item: GridItem<T>, originalRect?: Rect): void {
    if (this.options.collision === 'none') return;
    const collision = this.checkCollision(item);
    if (!collision.collides) return;
    if (this.options.collision === 'swap' && collision.items.length === 1) {
      this.swapItems(item, collision.items[0]!, originalRect);
    } else {
      this.pushItems(item, collision.items);
    }
  }

  private swapItems(item: GridItem<T>, other: GridItem<T>, originalRect?: Rect): void {
    if (other.static || other.locked) {
      this.pushItems(item, [other]);
      return;
    }
    if (originalRect) {
      other.x = originalRect.x;
      other.y = originalRect.y;
    } else {
      const pos = this.findPosition(other, item.id);
      other.x = pos.x;
      other.y = pos.y;
    }
    other._lastUpdate = Date.now();
    this.markUpdated(other.id);
  }

  private pushItems(item: GridItem<T>, colliding: GridItem<T>[]): void {
    const itemRect = getItemRect(item);
    const sorted = colliding.sort((a, b) =>
      manhattanDistance(itemRect, getItemRect(a)) - manhattanDistance(itemRect, getItemRect(b))
    );
    for (const other of sorted) {
      if (other.static || other.locked) continue;
      let newY = itemRect.y + itemRect.h;
      if (this.options.maxRow > 0 && newY + other.h > this.options.maxRow) {
        newY = other.y;
      }
      other.y = newY;
      other._lastUpdate = Date.now();
      this.markUpdated(other.id);
      this.resolveCollisions(other);
    }
  }

  findPosition(item: GridItem<T>, excludeId?: ItemId): Position {
    const { column, maxRow } = this.options;
    const height = maxRow || 1000;
    const occupied = this.createOccupancyGrid(excludeId);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x <= column - item.w; x++) {
        if (this.canPlace(x, y, item.w, item.h, occupied, column)) {
          return { x, y };
        }
      }
    }
    return { x: 0, y: this.getHeight() };
  }

  private createOccupancyGrid(excludeId?: ItemId): Set<string> {
    const occupied = new Set<string>();
    for (const item of this.items) {
      if (item.id === excludeId) continue;
      for (let x = item.x; x < item.x + item.w; x++) {
        for (let y = item.y; y < item.y + item.h; y++) {
          occupied.add(`${x},${y}`);
        }
      }
    }
    return occupied;
  }

  private canPlace(x: number, y: number, w: number, h: number, occupied: Set<string>, column: number): boolean {
    if (x + w > column) return false;
    if (this.options.maxRow > 0 && y + h > this.options.maxRow) return false;
    for (let px = x; px < x + w; px++) {
      for (let py = y; py < y + h; py++) {
        if (occupied.has(`${px},${py}`)) return false;
      }
    }
    return true;
  }

  validatePlacement(item: GridItem<T>, position: Position): PlacementResult<T> {
    const testRect: Rect = { x: position.x, y: position.y, w: item.w, h: item.h };
    if (position.x < 0 || position.x + item.w > this.options.column) {
      return { valid: false, position, displaced: [] };
    }
    if (this.options.maxRow > 0 && position.y + item.h > this.options.maxRow) {
      return { valid: false, position, displaced: [] };
    }
    const collision = this.checkCollision({ ...item, ...testRect }, item.id);
    return { valid: true, position, displaced: collision.items };
  }

  compact(): void {
    if (this.options.float) return;
    const sorted = sortItems(this.items, this.options.rtl);
    for (const item of sorted) {
      if (item.static || item.locked) continue;
      let y = item.y;
      while (y > 0) {
        const testRect: Rect = { x: item.x, y: y - 1, w: item.w, h: item.h };
        let canMove = true;
        for (const other of this.items) {
          if (other.id === item.id) continue;
          if (intersects(testRect, getItemRect(other))) {
            canMove = false;
            break;
          }
        }
        if (canMove) y--;
        else break;
      }
      if (y !== item.y) {
        item.y = y;
        item._lastUpdate = Date.now();
        this.markUpdated(item.id);
      }
    }
  }

  private markUpdated(id: ItemId): void {
    if (this.batchMode) this.pendingUpdates.add(id);
  }

  getBottomRow(): number {
    return Math.max(0, ...this.items.map(item => item.y + item.h));
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  getItemsInRegion(rect: Rect): GridItem<T>[] {
    return this.items.filter(item => intersects(getItemRect(item), rect));
  }

  serialize(): GridItem<T>[] {
    return this.items.map(cloneItem);
  }

  clone(): LayoutEngine<T> {
    const engine = new LayoutEngine<T>(this.options);
    engine.load(this.serialize());
    return engine;
  }
}

export function createLayoutEngine<T = unknown>(options: GridOptions): LayoutEngine<T> {
  return new LayoutEngine<T>(options);
}
