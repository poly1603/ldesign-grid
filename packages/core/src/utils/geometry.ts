/**
 * 几何计算工具
 */

import type { Rect, Position } from '../types/base';

/** 检查两个矩形是否相交 */
export function intersects(a: Rect, b: Rect): boolean {
  return !(
    a.x + a.w <= b.x ||
    b.x + b.w <= a.x ||
    a.y + a.h <= b.y ||
    b.y + b.h <= a.y
  );
}

/** 检查矩形A是否包含矩形B */
export function contains(a: Rect, b: Rect): boolean {
  return (
    b.x >= a.x &&
    b.y >= a.y &&
    b.x + b.w <= a.x + a.w &&
    b.y + b.h <= a.y + a.h
  );
}

/** 获取两个矩形的交集面积 */
export function getIntersectionArea(a: Rect, b: Rect): number {
  const xOverlap = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const yOverlap = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return xOverlap * yOverlap;
}

/** 计算矩形面积 */
export function getArea(rect: Rect): number {
  return rect.w * rect.h;
}

/** 检查两个矩形是否相等 */
export function rectsEqual(a: Rect, b: Rect): boolean {
  return a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;
}

/** 克隆矩形 */
export function cloneRect(rect: Rect): Rect {
  return { x: rect.x, y: rect.y, w: rect.w, h: rect.h };
}

/** 获取多个矩形的边界矩形 */
export function getBoundingRect(rects: Rect[]): Rect {
  if (rects.length === 0) {
    return { x: 0, y: 0, w: 0, h: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const rect of rects) {
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.w);
    maxY = Math.max(maxY, rect.y + rect.h);
  }

  return {
    x: minX,
    y: minY,
    w: maxX - minX,
    h: maxY - minY,
  };
}

/** 两点间欧几里得距离 */
export function distance(a: Position, b: Position): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** 两点间曼哈顿距离 */
export function manhattanDistance(a: Position, b: Position): number {
  return Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
}

/** 扩展矩形 */
export function expandRect(rect: Rect, amount: number): Rect {
  return {
    x: rect.x - amount,
    y: rect.y - amount,
    w: rect.w + amount * 2,
    h: rect.h + amount * 2,
  };
}

/** 缩小矩形 */
export function shrinkRect(rect: Rect, amount: number): Rect {
  return expandRect(rect, -amount);
}

/** 合并两个矩形为包含它们的最小矩形 */
export function mergeRects(a: Rect, b: Rect): Rect {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    x,
    y,
    w: Math.max(a.x + a.w, b.x + b.w) - x,
    h: Math.max(a.y + a.h, b.y + b.h) - y,
  };
}

/** 获取矩形中心点 */
export function getRectCenter(rect: Rect): Position {
  return {
    x: rect.x + rect.w / 2,
    y: rect.y + rect.h / 2,
  };
}

/** 检查点是否在矩形内 */
export function pointInRect(point: Position, rect: Rect): boolean {
  return (
    point.x >= rect.x &&
    point.x < rect.x + rect.w &&
    point.y >= rect.y &&
    point.y < rect.y + rect.h
  );
}

/** 将位置限制在矩形内 */
export function clampPositionToRect(pos: Position, bounds: Rect): Position {
  return {
    x: Math.max(bounds.x, Math.min(pos.x, bounds.x + bounds.w)),
    y: Math.max(bounds.y, Math.min(pos.y, bounds.y + bounds.h)),
  };
}

/** 将矩形限制在边界内 */
export function clampRectToBounds(rect: Rect, bounds: Rect): Rect {
  const x = Math.max(bounds.x, Math.min(rect.x, bounds.x + bounds.w - rect.w));
  const y = Math.max(bounds.y, Math.min(rect.y, bounds.y + bounds.h - rect.h));
  return { x, y, w: rect.w, h: rect.h };
}
