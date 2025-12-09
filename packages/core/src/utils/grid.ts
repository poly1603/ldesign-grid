/**
 * 网格坐标计算工具
 */

import type { Position, Size, Rect, PixelRect, Margin } from '../types/base';
import type { GridOptions } from '../types/options';
import type { GridItem } from '../types/item';

/** 规范化边距为对象格式 */
export function normalizeMargin(
  margin: number | Margin | [number, number, number, number]
): Margin {
  if (typeof margin === 'number') {
    return { top: margin, right: margin, bottom: margin, left: margin };
  }
  if (Array.isArray(margin)) {
    return { top: margin[0], right: margin[1], bottom: margin[2], left: margin[3] };
  }
  return margin;
}

/** 计算单元格宽度 */
export function getCellWidth(containerWidth: number, options: GridOptions): number {
  const margin = normalizeMargin(options.margin);
  const totalMargin = margin.left + margin.right;
  const totalGap = (options.column - 1) * options.gap;
  return (containerWidth - totalMargin - totalGap) / options.column;
}

/** 计算单元格高度 */
export function getCellHeight(containerWidth: number, options: GridOptions): number {
  if (options.cellHeight === 'auto') {
    return getCellWidth(containerWidth, options);
  }
  return options.cellHeight;
}

/** 网格位置转像素位置 */
export function gridToPixel(
  pos: Position,
  cellWidth: number,
  cellHeight: number,
  options: GridOptions
): Position {
  const margin = normalizeMargin(options.margin);
  return {
    x: margin.left + pos.x * (cellWidth + options.gap),
    y: margin.top + pos.y * (cellHeight + options.gap),
  };
}

/** 网格尺寸转像素尺寸 */
export function sizeToPixel(
  size: Size,
  cellWidth: number,
  cellHeight: number,
  options: GridOptions
): Size {
  return {
    w: size.w * cellWidth + (size.w - 1) * options.gap,
    h: size.h * cellHeight + (size.h - 1) * options.gap,
  };
}

/** 像素位置转网格位置 */
export function pixelToGrid(
  pixelPos: Position,
  cellWidth: number,
  cellHeight: number,
  options: GridOptions
): Position {
  const margin = normalizeMargin(options.margin);
  const cellWithGap = cellWidth + options.gap;
  const cellHeightWithGap = cellHeight + options.gap;

  return {
    x: Math.round((pixelPos.x - margin.left) / cellWithGap),
    y: Math.round((pixelPos.y - margin.top) / cellHeightWithGap),
  };
}

/** 计算网格项的像素矩形 */
export function getPixelRect(
  item: Rect,
  cellWidth: number,
  cellHeight: number,
  options: GridOptions
): PixelRect {
  const pos = gridToPixel(item, cellWidth, cellHeight, options);
  const size = sizeToPixel(item, cellWidth, cellHeight, options);

  return {
    left: pos.x,
    top: pos.y,
    width: size.w,
    height: size.h,
  };
}

/** 限制位置在网格边界内 */
export function clampPosition(
  pos: Position,
  size: Size,
  options: GridOptions
): Position {
  return {
    x: Math.max(0, Math.min(pos.x, options.column - size.w)),
    y: Math.max(0, options.maxRow > 0 ? Math.min(pos.y, options.maxRow - size.h) : pos.y),
  };
}

/** 限制尺寸在约束范围内 */
export function clampSize(
  size: Size,
  item: GridItem,
  options: GridOptions
): Size {
  const minW = item.minW ?? 1;
  const maxW = item.maxW ?? options.column;
  const minH = item.minH ?? 1;
  const maxH = item.maxH ?? (options.maxRow || Infinity);

  return {
    w: Math.max(minW, Math.min(size.w, maxW, options.column - item.x)),
    h: Math.max(minH, Math.min(size.h, maxH, options.maxRow > 0 ? options.maxRow - item.y : Infinity)),
  };
}

/** 计算网格总高度 (行数) */
export function getGridHeight(items: GridItem[]): number {
  if (items.length === 0) return 0;
  return Math.max(...items.map(item => item.y + item.h));
}

/** 计算网格像素高度 */
export function getGridPixelHeight(
  items: GridItem[],
  cellHeight: number,
  options: GridOptions
): number {
  const rows = getGridHeight(items);
  const margin = normalizeMargin(options.margin);
  return margin.top + rows * (cellHeight + options.gap) - options.gap + margin.bottom;
}
