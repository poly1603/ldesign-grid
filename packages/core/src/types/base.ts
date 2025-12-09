/**
 * 基础类型定义
 */

/** 位置坐标 */
export interface Position {
  x: number;
  y: number;
}

/** 尺寸 */
export interface Size {
  w: number;
  h: number;
}

/** 矩形区域 (位置 + 尺寸) */
export interface Rect extends Position, Size { }

/** 像素矩形 (用于DOM操作) */
export interface PixelRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** 边距 */
export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** 唯一标识符 */
export type ItemId = string | number;

/** 方向 */
export type Direction = 'up' | 'down' | 'left' | 'right';

/** 调整大小的手柄位置 */
export type ResizeHandle =
  | 'n' | 's' | 'e' | 'w'      // 四边
  | 'ne' | 'nw' | 'se' | 'sw'; // 四角

/** 布局模式 */
export type LayoutMode = 'vertical' | 'horizontal' | 'masonry' | 'free';

/** 碰撞处理模式 */
export type CollisionMode = 'push' | 'swap' | 'none' | 'compress';

/** 样式模式 */
export type StyleMode = 'transform' | 'absolute';
