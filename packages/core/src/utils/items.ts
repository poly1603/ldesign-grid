/**
 * 网格项操作工具
 */

import type { Position, Rect, ItemId } from '../types';
import type { GridItem, GridItemData } from '../types';
import type { GridOptions } from '../types';
import { cloneRect } from './geometry';

/** 生成唯一ID */
let idCounter = 0;
export function generateId(): string {
  return `grid-${Date.now().toString(36)}-${(idCounter++).toString(36)}`;
}

/** 重置ID计数器 (用于测试) */
export function resetIdCounter(): void {
  idCounter = 0;
}

/** 按位置排序项目 (上到下, 左到右) */
export function sortItems<T>(items: GridItem<T>[], rtl = false): GridItem<T>[] {
  return [...items].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    return rtl ? b.x - a.x : a.x - b.x;
  });
}

/** 按紧凑顺序排序 */
export function sortForCompact<T>(items: GridItem<T>[]): GridItem<T>[] {
  return [...items].sort((a, b) => {
    const aY = a.y + a.h;
    const bY = b.y + b.h;
    if (aY !== bY) return aY - bY;
    return a.x - b.x;
  });
}

/** 按ID查找项目 */
export function findById<T>(items: GridItem<T>[], id: ItemId): GridItem<T> | undefined {
  return items.find(item => item.id === id);
}

/** 按位置查找项目 */
export function findAtPosition<T>(items: GridItem<T>[], pos: Position): GridItem<T> | undefined {
  return items.find(item =>
    pos.x >= item.x &&
    pos.x < item.x + item.w &&
    pos.y >= item.y &&
    pos.y < item.y + item.h
  );
}

/** 检查项目是否可拖拽 */
export function isDraggable<T>(item: GridItem<T>, options: GridOptions): boolean {
  if (item.static || item.locked) return false;
  if (item.draggable !== undefined) return item.draggable;
  return options.draggable;
}

/** 检查项目是否可调整大小 */
export function isResizable<T>(item: GridItem<T>, options: GridOptions): boolean {
  if (item.static || item.locked) return false;
  if (item.resizable !== undefined) return item.resizable;
  return options.resizable;
}

/** 克隆网格项 */
export function cloneItem<T>(item: GridItem<T>): GridItem<T> {
  return {
    ...item,
    _tempRect: item._tempRect ? cloneRect(item._tempRect) : undefined,
    _originalRect: item._originalRect ? cloneRect(item._originalRect) : undefined,
    _pixelRect: item._pixelRect ? { ...item._pixelRect } : undefined,
  };
}

/** 获取项目的当前矩形 (临时或实际) */
export function getItemRect<T>(item: GridItem<T>): Rect {
  return item._tempRect ?? { x: item.x, y: item.y, w: item.w, h: item.h };
}

/** 应用矩形到项目 */
export function applyRect<T>(item: GridItem<T>, rect: Rect): void {
  item.x = rect.x;
  item.y = rect.y;
  item.w = rect.w;
  item.h = rect.h;
}

/** 创建项目数据 */
export function createItemData<T>(
  input: Partial<GridItemData<T>> & { id?: ItemId }
): GridItemData<T> {
  return {
    id: input.id ?? generateId(),
    x: input.x ?? 0,
    y: input.y ?? 0,
    w: input.w ?? 1,
    h: input.h ?? 1,
    minW: input.minW,
    maxW: input.maxW,
    minH: input.minH,
    maxH: input.maxH,
    static: input.static,
    draggable: input.draggable,
    resizable: input.resizable,
    locked: input.locked,
    autoPosition: input.autoPosition,
    data: input.data,
    content: input.content,
    className: input.className,
  };
}

/** 序列化项目 (移除运行时属性) */
export function serializeItem<T>(item: GridItem<T>): GridItemData<T> {
  return {
    id: item.id,
    x: item.x,
    y: item.y,
    w: item.w,
    h: item.h,
    minW: item.minW,
    maxW: item.maxW,
    minH: item.minH,
    maxH: item.maxH,
    static: item.static,
    draggable: item.draggable,
    resizable: item.resizable,
    locked: item.locked,
    autoPosition: item.autoPosition,
    data: item.data,
    content: item.content,
    className: item.className,
  };
}

/** 序列化多个项目 */
export function serializeItems<T>(items: GridItem<T>[]): GridItemData<T>[] {
  return items.map(serializeItem);
}

/** 比较两个项目是否相同位置和大小 */
export function isSamePosition<T>(a: GridItem<T>, b: GridItem<T>): boolean {
  return a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;
}

/** 获取项目的差异 */
export function getItemsDiff<T>(
  oldItems: GridItem<T>[],
  newItems: GridItem<T>[]
): {
  added: GridItem<T>[];
  removed: GridItem<T>[];
  moved: GridItem<T>[];
} {
  const oldMap = new Map(oldItems.map(item => [item.id, item]));
  const newMap = new Map(newItems.map(item => [item.id, item]));

  const added: GridItem<T>[] = [];
  const removed: GridItem<T>[] = [];
  const moved: GridItem<T>[] = [];

  for (const item of newItems) {
    const oldItem = oldMap.get(item.id);
    if (!oldItem) {
      added.push(item);
    } else if (!isSamePosition(oldItem, item)) {
      moved.push(item);
    }
  }

  for (const item of oldItems) {
    if (!newMap.has(item.id)) {
      removed.push(item);
    }
  }

  return { added, removed, moved };
}
