/**
 * 事件类型定义
 */

import type { Position, Size, ResizeHandle } from './base';
import type { GridItem } from './item';

/** 拖拽事件数据 */
export interface DragEventData<T = unknown> {
  /** 被拖拽的项目 */
  item: GridItem<T>;
  /** 当前网格位置 */
  position: Position;
  /** 当前像素位置 */
  pixelPosition: Position;
  /** 原始事件 */
  originalEvent: MouseEvent | TouchEvent;
  /** 是否从外部拖入 */
  external: boolean;
  /** 拖拽偏移量 */
  offset: Position;
}

/** 调整大小事件数据 */
export interface ResizeEventData<T = unknown> {
  /** 被调整的项目 */
  item: GridItem<T>;
  /** 新尺寸 */
  size: Size;
  /** 新位置 (边角调整时会改变) */
  position: Position;
  /** 调整方向 */
  direction: ResizeHandle;
  /** 原始事件 */
  originalEvent: MouseEvent | TouchEvent;
}

/** 变更事件数据 */
export interface ChangeEventData<T = unknown> {
  /** 变更的项目列表 */
  items: GridItem<T>[];
  /** 变更类型 */
  type: 'add' | 'remove' | 'update' | 'move' | 'resize' | 'batch';
  /** 之前的布局 (用于撤销) */
  previousLayout?: GridItem<T>[];
  /** 触发源 */
  source: 'user' | 'api' | 'load' | 'undo' | 'redo';
}

/** 放置事件数据 */
export interface DropEventData<T = unknown> {
  /** 放置的项目 */
  item: GridItem<T>;
  /** 放置位置 */
  position: Position;
  /** 来源元素 (外部拖入时) */
  sourceElement?: HTMLElement;
  /** 是否来自外部 */
  external: boolean;
  /** 是否被接受 */
  accepted: boolean;
}

/** 碰撞事件数据 */
export interface CollisionEventData<T = unknown> {
  /** 移动的项目 */
  item: GridItem<T>;
  /** 碰撞的项目列表 */
  collisions: GridItem<T>[];
  /** 建议的解决位置 */
  suggestedPosition?: Position;
}

/** 撤销/重做事件数据 */
export interface UndoRedoEventData<T = unknown> {
  /** 操作类型 */
  type: 'undo' | 'redo';
  /** 恢复的布局 */
  layout: GridItem<T>[];
  /** 当前历史索引 */
  historyIndex: number;
  /** 历史总长度 */
  historyLength: number;
}

/** 响应式变更事件数据 */
export interface BreakpointEventData {
  /** 当前断点名称 */
  breakpoint: string;
  /** 之前的断点名称 */
  previousBreakpoint: string;
  /** 新的列数 */
  column: number;
  /** 容器宽度 */
  width: number;
}

/** 验证事件数据 */
export interface ValidateEventData<T = unknown> {
  /** 要验证的项目 */
  item: GridItem<T>;
  /** 目标位置 */
  position: Position;
  /** 目标尺寸 */
  size: Size;
  /** 是否有效 */
  valid: boolean;
  /** 无效原因 */
  reason?: string;
}

/** 事件映射表 */
export interface GridEventMap<T = unknown> {
  // 拖拽事件
  'dragstart': DragEventData<T>;
  'drag': DragEventData<T>;
  'dragend': DragEventData<T>;
  'dragcancel': DragEventData<T>;

  // 调整大小事件
  'resizestart': ResizeEventData<T>;
  'resize': ResizeEventData<T>;
  'resizeend': ResizeEventData<T>;
  'resizecancel': ResizeEventData<T>;

  // 变更事件
  'change': ChangeEventData<T>;
  'added': ChangeEventData<T>;
  'removed': ChangeEventData<T>;
  'moved': ChangeEventData<T>;
  'resized': ChangeEventData<T>;

  // 放置事件
  'drop': DropEventData<T>;
  'dropover': DropEventData<T>;
  'dropout': DropEventData<T>;
  'droprejected': DropEventData<T>;

  // 碰撞事件
  'collision': CollisionEventData<T>;

  // 撤销/重做事件
  'undo': UndoRedoEventData<T>;
  'redo': UndoRedoEventData<T>;
  'historychange': UndoRedoEventData<T>;

  // 响应式事件
  'breakpoint': BreakpointEventData;

  // 验证事件
  'validate': ValidateEventData<T>;

  // 生命周期事件
  'init': void;
  'destroy': void;
  'enable': void;
  'disable': void;
  'ready': void;

  // 布局事件
  'layoutstart': void;
  'layoutend': void;
  'compact': void;
}

/** 事件处理函数类型 */
export type GridEventHandler<K extends keyof GridEventMap, T = unknown> = (
  data: GridEventMap<T>[K]
) => void;

/** 事件发射器接口 */
export interface EventEmitter<T = unknown> {
  on<K extends keyof GridEventMap>(
    event: K,
    handler: GridEventHandler<K, T>
  ): () => void;

  off<K extends keyof GridEventMap>(
    event: K,
    handler: GridEventHandler<K, T>
  ): void;

  once<K extends keyof GridEventMap>(
    event: K,
    handler: GridEventHandler<K, T>
  ): () => void;

  emit<K extends keyof GridEventMap>(
    event: K,
    data: GridEventMap<T>[K]
  ): void;
}
