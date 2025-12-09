/**
 * 网格项类型定义
 */

import type { ItemId, Rect, PixelRect, ResizeHandle } from './base';

/** 网格项约束 */
export interface ItemConstraints {
  /** 最小宽度 (格子单位) */
  minW?: number;
  /** 最大宽度 (格子单位) */
  maxW?: number;
  /** 最小高度 (格子单位) */
  minH?: number;
  /** 最大高度 (格子单位) */
  maxH?: number;
}

/** 网格项行为配置 */
export interface ItemBehavior {
  /** 是否为静态项 (不可拖拽/调整大小) */
  static?: boolean;
  /** 是否可拖拽 (覆盖网格设置) */
  draggable?: boolean;
  /** 是否可调整大小 (覆盖网格设置) */
  resizable?: boolean;
  /** 是否锁定位置 */
  locked?: boolean;
  /** 自动定位 */
  autoPosition?: boolean;
  /** 自定义调整手柄 */
  resizeHandles?: ResizeHandle[];
  /** 拖拽手柄选择器 */
  handle?: string;
}

/** 网格项数据 (用于序列化/存储) */
export interface GridItemData<T = unknown> extends ItemConstraints, ItemBehavior {
  /** 唯一标识 */
  id: ItemId;
  /** 列位置 (0索引) */
  x: number;
  /** 行位置 (0索引) */
  y: number;
  /** 宽度 (格子单位) */
  w: number;
  /** 高度 (格子单位) */
  h: number;
  /** 自定义数据 */
  data?: T;
  /** 内容 (HTML字符串或组件引用) */
  content?: string;
  /** CSS类名 */
  className?: string;
}

/** 运行时网格项 (带计算属性) */
export interface GridItem<T = unknown> extends GridItemData<T> {
  /** DOM元素引用 */
  el?: HTMLElement;
  /** 是否正在拖拽 */
  _isDragging?: boolean;
  /** 是否正在调整大小 */
  _isResizing?: boolean;
  /** 拖拽/调整时的临时矩形 */
  _tempRect?: Rect;
  /** 操作前的原始矩形 */
  _originalRect?: Rect;
  /** 计算的像素矩形 */
  _pixelRect?: PixelRect;
  /** 最后更新时间戳 */
  _lastUpdate?: number;
  /** 所属子网格ID */
  _subGridId?: ItemId;
  /** 是否标记为删除 */
  _pendingRemove?: boolean;
}

/** 序列化的网格项 */
export type SerializedItem<T = unknown> = GridItemData<T>;

/** 创建网格项的输入参数 */
export type CreateItemInput<T = unknown> = Partial<GridItemData<T>> & {
  id?: ItemId;
};
