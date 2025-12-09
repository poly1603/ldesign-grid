/**
 * useGrid - Vue 3 Composable
 */

import { ref, computed, onMounted, onUnmounted, provide, shallowRef, triggerRef } from 'vue';
import { Grid, createGrid, GridEventMap } from '@ldesign/grid-core';
import type { GridItem, GridItemData, GridOptions, DeepPartial, ExternalDragConfig, ItemId } from '@ldesign/grid-core';
import type { UseGridOptions, UseGridReturn } from '../types';
import { GRID_KEY, GRID_OPTIONS_KEY } from '../types';

export function useGrid<T = unknown>(options: UseGridOptions<T> = {}): UseGridReturn<T> {
  const containerRef = ref<HTMLElement | null>(null);
  const gridRef = shallowRef<Grid<T> | null>(null);
  const items = ref<GridItem<T>[]>([]) as unknown as ReturnType<typeof ref<GridItem<T>[]>>;
  const isReady = ref(false);
  const isEnabled = ref(true);

  const height = computed(() => gridRef.value?.getHeight() ?? 0);
  const column = computed(() => gridRef.value?.getColumn() ?? 12);

  // 刷新items
  const refreshItems = () => {
    if (gridRef.value) {
      items.value = gridRef.value.getWidgets();
      triggerRef(items as ReturnType<typeof shallowRef>);
    }
  };

  // 初始化
  onMounted(() => {
    if (!containerRef.value) return;

    const { items: initialItems, autoInit = true, ...gridOptions } = options;

    if (autoInit) {
      gridRef.value = createGrid<T>(containerRef.value, gridOptions);

      // 添加初始项目
      if (initialItems?.length) {
        gridRef.value.addWidgets(initialItems);
      }

      // 监听变更事件
      gridRef.value.on('change', refreshItems);
      gridRef.value.on('added', refreshItems);
      gridRef.value.on('removed', refreshItems);

      refreshItems();
      isReady.value = true;
    }
  });

  onUnmounted(() => {
    gridRef.value?.destroy();
    gridRef.value = null;
  });

  // 提供给子组件
  provide(GRID_KEY, gridRef);
  provide(GRID_OPTIONS_KEY, computed(() => gridRef.value?.getOptions()));

  // API方法
  const addWidget = (data: Partial<GridItemData<T>>) => {
    const item = gridRef.value?.addWidget(data);
    refreshItems();
    return item;
  };

  const addWidgets = (widgetItems: Partial<GridItemData<T>>[]) => {
    const added = gridRef.value?.addWidgets(widgetItems) ?? [];
    refreshItems();
    return added;
  };

  const removeWidget = (id: ItemId) => {
    const result = gridRef.value?.removeWidget(id) ?? false;
    refreshItems();
    return result;
  };

  const removeAll = () => {
    gridRef.value?.removeAll();
    refreshItems();
  };

  const getWidget = (id: ItemId) => gridRef.value?.getWidget(id);

  const updateWidget = (id: ItemId, updates: Partial<GridItemData<T>>) => {
    const result = gridRef.value?.updateWidget(id, updates) ?? false;
    refreshItems();
    return result;
  };

  const moveWidget = (id: ItemId, x: number, y: number) => {
    const result = gridRef.value?.moveWidget(id, x, y) ?? false;
    refreshItems();
    return result;
  };

  const resizeWidget = (id: ItemId, w: number, h: number) => {
    const result = gridRef.value?.resizeWidget(id, w, h) ?? false;
    refreshItems();
    return result;
  };

  const load = (loadItems: Partial<GridItemData<T>>[]) => {
    gridRef.value?.load(loadItems);
    refreshItems();
  };

  const save = () => gridRef.value?.save() ?? [];

  const compact = () => {
    gridRef.value?.compact();
    refreshItems();
  };

  const enable = () => {
    gridRef.value?.enable();
    isEnabled.value = true;
  };

  const disable = () => {
    gridRef.value?.disable();
    isEnabled.value = false;
  };

  const setOptions = (opts: DeepPartial<GridOptions>) => {
    gridRef.value?.setOptions(opts);
    refreshItems();
  };

  const setColumn = (col: number) => {
    gridRef.value?.setColumn(col);
    refreshItems();
  };

  const setupExternalDrag = (config: ExternalDragConfig) => {
    // TODO: 实现外部拖拽
    console.warn('setupExternalDrag not yet implemented');
  };

  const on = <K extends keyof GridEventMap>(
    event: K,
    handler: (data: GridEventMap<T>[K]) => void
  ) => {
    return gridRef.value?.on(event, handler) ?? (() => { });
  };

  const off = <K extends keyof GridEventMap>(
    event: K,
    handler: (data: GridEventMap<T>[K]) => void
  ) => {
    gridRef.value?.off(event, handler);
  };

  return {
    containerRef,
    items,
    isReady,
    isEnabled,
    height,
    column,
    addWidget,
    addWidgets,
    removeWidget,
    removeAll,
    getWidget,
    updateWidget,
    moveWidget,
    resizeWidget,
    load,
    save,
    compact,
    enable,
    disable,
    setOptions,
    setColumn,
    setupExternalDrag,
    on,
    off,
  };
}
