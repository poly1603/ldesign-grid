/**
 * @ldesign/grid-vue - 类型定义
 */

import type { Ref, ComputedRef, InjectionKey } from 'vue';
import type { Grid, GridItem, GridItemData, GridOptions, GridEventMap, ItemId, Position, Size, DeepPartial, ExternalDragConfig } from '@ldesign/grid-core';

// ==================== 组件Props ====================

export interface GridProps {
  modelValue?: GridItemData[];
  column?: number;
  cellHeight?: number | 'auto';
  gap?: number;
  margin?: number | [number, number, number, number];
  draggable?: boolean;
  resizable?: boolean;
  animate?: boolean;
  float?: boolean;
  acceptWidgets?: boolean;
  handle?: string;
  compact?: boolean;
  collision?: 'push' | 'swap' | 'none';
  minRow?: number;
  maxRow?: number;
  rtl?: boolean;
  autoHeight?: boolean;
  touch?: boolean;
  static?: boolean;
  options?: DeepPartial<GridOptions>;
}

export interface GridItemProps {
  id: ItemId;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  static?: boolean;
  draggable?: boolean;
  resizable?: boolean;
  locked?: boolean;
  autoPosition?: boolean;
}

// ==================== Composable类型 ====================

export interface UseGridOptions<T = unknown> extends DeepPartial<GridOptions> {
  items?: GridItemData<T>[];
  autoInit?: boolean;
}

export interface UseGridReturn<T = unknown> {
  containerRef: Ref<HTMLElement | null>;
  items: Ref<GridItem<T>[]>;
  isReady: Ref<boolean>;
  isEnabled: Ref<boolean>;
  height: ComputedRef<number>;
  column: ComputedRef<number>;

  addWidget: (data: Partial<GridItemData<T>>) => GridItem<T> | undefined;
  addWidgets: (items: Partial<GridItemData<T>>[]) => GridItem<T>[];
  removeWidget: (id: ItemId) => boolean;
  removeAll: () => void;
  getWidget: (id: ItemId) => GridItem<T> | undefined;
  updateWidget: (id: ItemId, updates: Partial<GridItemData<T>>) => boolean;
  moveWidget: (id: ItemId, x: number, y: number) => boolean;
  resizeWidget: (id: ItemId, w: number, h: number) => boolean;
  load: (items: Partial<GridItemData<T>>[]) => void;
  save: () => GridItemData<T>[];
  compact: () => void;
  enable: () => void;
  disable: () => void;
  setOptions: (options: DeepPartial<GridOptions>) => void;
  setColumn: (column: number) => void;
  setupExternalDrag: (config: ExternalDragConfig) => void;

  on: <K extends keyof GridEventMap>(event: K, handler: (data: GridEventMap<T>[K]) => void) => () => void;
  off: <K extends keyof GridEventMap>(event: K, handler: (data: GridEventMap<T>[K]) => void) => void;
}

export interface UseGridItemOptions {
  id: ItemId;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  static?: boolean;
  draggable?: boolean;
  resizable?: boolean;
  locked?: boolean;
  autoPosition?: boolean;
}

export interface UseGridItemReturn<T = unknown> {
  itemRef: Ref<HTMLElement | null>;
  item: ComputedRef<GridItem<T> | undefined>;
  isDragging: ComputedRef<boolean>;
  isResizing: ComputedRef<boolean>;
  position: ComputedRef<Position>;
  size: ComputedRef<Size>;

  update: (updates: Partial<GridItemData<T>>) => void;
  move: (x: number, y: number) => void;
  resize: (w: number, h: number) => void;
  remove: () => void;
}

// ==================== 注入Key ====================

export const GRID_KEY: InjectionKey<Ref<Grid | null>> = Symbol('ldesign-grid');
export const GRID_OPTIONS_KEY: InjectionKey<Ref<GridOptions>> = Symbol('ldesign-grid-options');
