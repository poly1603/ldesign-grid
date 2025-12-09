/**
 * 类型导出
 */

export * from './base';
export * from './item';
export * from './options';
export * from './events';

// 外部拖拽配置
import type { Size, Position } from './base';
import type { GridItemData } from './item';

/** 外部拖拽配置 */
export interface ExternalDragConfig {
  /** 外部可拖拽元素的选择器或元素 */
  source: string | HTMLElement | HTMLElement[];
  /** 放置时的默认尺寸 */
  defaultSize?: Size;
  /** 从外部元素创建网格项数据 */
  createItem?: (el: HTMLElement) => Partial<GridItemData>;
  /** 拖拽手柄选择器 */
  handle?: string;
  /** 辅助元素类型 */
  helper?: 'clone' | 'original' | ((el: HTMLElement) => HTMLElement);
  /** 辅助元素附加到的容器 */
  appendTo?: string | HTMLElement;
  /** 拖拽时的光标 */
  cursor?: string;
  /** 拖拽时的z-index */
  zIndex?: number;
  /** 拖拽时的透明度 */
  opacity?: number;
  /** 是否在拖拽后移除源元素 */
  removeOnDrop?: boolean;
}

/** 碰撞结果 */
export interface CollisionResult<T = unknown> {
  /** 是否发生碰撞 */
  collides: boolean;
  /** 碰撞的项目列表 */
  items: import('./item').GridItem<T>[];
  /** 建议的避免碰撞位置 */
  suggestedPosition?: Position;
}

/** 放置验证结果 */
export interface PlacementResult<T = unknown> {
  /** 放置是否有效 */
  valid: boolean;
  /** 最终位置 */
  position: Position;
  /** 需要移动的项目 */
  displaced: import('./item').GridItem<T>[];
  /** 无效原因 */
  reason?: string;
}

/** 框架适配器接口 */
export interface GridAdapter<E = HTMLElement, T = unknown> {
  /** 初始化适配器 */
  init(container: E, options: import('./options').GridOptions): void;
  /** 挂载项目到DOM */
  mountItem(item: import('./item').GridItem<T>, container: E): E;
  /** 从DOM卸载项目 */
  unmountItem(item: import('./item').GridItem<T>): void;
  /** 更新项目位置/尺寸 */
  updateItem(item: import('./item').GridItem<T>): void;
  /** 渲染占位符 */
  renderPlaceholder(rect: import('./base').Rect): E | null;
  /** 移除占位符 */
  removePlaceholder(): void;
  /** 批量更新开始 */
  batchStart?(): void;
  /** 批量更新结束 */
  batchEnd?(): void;
  /** 清理 */
  destroy(): void;
}

/** 插件接口 */
export interface GridPlugin<T = unknown> {
  /** 插件名称 */
  name: string;
  /** 插件版本 */
  version?: string;
  /** 安装插件 */
  install(grid: unknown, options?: Record<string, unknown>): void;
  /** 卸载插件 */
  uninstall?(): void;
}

/** 辅助类型: 使某些键必填 */
export type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

/** 辅助类型: 提取项目ID类型 */
export type ExtractId<T extends import('./item').GridItem> = T['id'];
