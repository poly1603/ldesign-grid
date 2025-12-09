/**
 * 网格配置选项
 */

import type {
  ResizeHandle,
  CollisionMode,
  StyleMode,
  LayoutMode,
  Margin
} from './base';

/** 动画配置 */
export interface AnimationConfig {
  /** 启用/禁用动画 */
  enabled: boolean;
  /** 动画时长 (ms) */
  duration: number;
  /** CSS缓动函数 */
  easing: string;
}

/** 响应式断点配置 */
export interface BreakpointConfig {
  /** 断点名称 */
  name: string;
  /** 最小宽度 */
  minWidth: number;
  /** 该断点下的列数 */
  column: number;
  /** 该断点下的单元格高度 */
  cellHeight?: number | 'auto';
  /** 该断点下的间距 */
  gap?: number;
}

/** 滚动配置 */
export interface ScrollConfig {
  /** 滚动速度 */
  speed: number;
  /** 触发滚动的边缘距离 */
  sensitivity: number;
  /** 允许的滚动方向 */
  direction: 'vertical' | 'horizontal' | 'both';
}

/** 网格完整配置 */
export interface GridOptions {
  // ==================== 布局配置 ====================
  /** 列数 */
  column: number;
  /** 单元格高度 (像素)，或 'auto' 表示正方形 */
  cellHeight: number | 'auto';
  /** 最小行数 */
  minRow: number;
  /** 最大行数 (0 = 无限制) */
  maxRow: number;
  /** 项目间距 (像素) */
  gap: number;
  /** 网格边距 */
  margin: number | Margin | [number, number, number, number];
  /** 布局模式 */
  layoutMode: LayoutMode;
  /** RTL布局 */
  rtl: boolean;

  // ==================== 交互配置 ====================
  /** 启用拖拽 */
  draggable: boolean;
  /** 启用调整大小 */
  resizable: boolean;
  /** 调整大小的手柄 */
  resizeHandles: ResizeHandle[];
  /** 拖拽手柄选择器 */
  handle: string;
  /** 取消拖拽的选择器 */
  handleCancel: string;
  /** 启用触摸支持 */
  touch: boolean;
  /** 触摸延迟 (ms) - 防止意外拖拽 */
  touchDelay: number;

  // ==================== 行为配置 ====================
  /** 启用动画 */
  animate: boolean | AnimationConfig;
  /** 浮动项目 (不自动压缩) */
  float: boolean;
  /** 自动压缩 */
  compact: boolean;
  /** 碰撞处理模式 */
  collision: CollisionMode;
  /** 自动调整网格高度 */
  autoHeight: boolean;
  /** 样式模式 */
  styleMode: StyleMode;

  // ==================== 外部拖入配置 ====================
  /** 接受外部项目 */
  acceptWidgets: boolean | string | ((el: HTMLElement) => boolean);
  /** 可移除 (拖出网格时删除) */
  removable: boolean;
  /** 移除区域选择器 */
  removeZone: string;

  // ==================== 响应式配置 ====================
  /** 响应式断点 */
  breakpoints: BreakpointConfig[];
  /** 禁用单列模式 */
  disableOneColumnMode: boolean;
  /** 单列模式触发宽度 */
  oneColumnSize: number;

  // ==================== 子网格配置 ====================
  /** 启用子网格 */
  subGrid: boolean;
  /** 子网格选项 */
  subGridOptions: Partial<GridOptions>;

  // ==================== 滚动配置 ====================
  /** 自动滚动配置 */
  scroll: ScrollConfig;

  // ==================== 样式配置 ====================
  /** 占位符类名 */
  placeholderClass: string;
  /** 项目类名 */
  itemClass: string;
  /** 容器类名 */
  containerClass: string;
  /** 拖拽中类名 */
  draggingClass: string;
  /** 调整大小中类名 */
  resizingClass: string;

  // ==================== 高级配置 ====================
  /** 启用撤销/重做 */
  enableUndo: boolean;
  /** 撤销历史最大长度 */
  undoLimit: number;
  /** 启用键盘导航 */
  enableKeyboard: boolean;
  /** 启用辅助功能 */
  enableA11y: boolean;
  /** 调试模式 */
  debug: boolean;
}

/** 默认配置 */
export const DEFAULT_OPTIONS: GridOptions = {
  // 布局
  column: 12,
  cellHeight: 80,
  minRow: 0,
  maxRow: 0,
  gap: 10,
  margin: 10,
  layoutMode: 'vertical',
  rtl: false,

  // 交互
  draggable: true,
  resizable: true,
  resizeHandles: ['se'],
  handle: '',
  handleCancel: 'input, textarea, button, select, [data-no-drag]',
  touch: true,
  touchDelay: 200,

  // 行为
  animate: true,
  float: false,
  compact: true,
  collision: 'push',
  autoHeight: true,
  styleMode: 'transform',

  // 外部拖入
  acceptWidgets: false,
  removable: false,
  removeZone: '',

  // 响应式
  breakpoints: [],
  disableOneColumnMode: false,
  oneColumnSize: 768,

  // 子网格
  subGrid: false,
  subGridOptions: {},

  // 滚动
  scroll: {
    speed: 40,
    sensitivity: 40,
    direction: 'both',
  },

  // 样式
  placeholderClass: 'grid-placeholder',
  itemClass: 'grid-item',
  containerClass: 'grid-container',
  draggingClass: 'grid-dragging',
  resizingClass: 'grid-resizing',

  // 高级
  enableUndo: false,
  undoLimit: 50,
  enableKeyboard: true,
  enableA11y: true,
  debug: false,
};

/** 深度可选类型 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
