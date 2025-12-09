<script setup lang="ts">
/**
 * Grid - 网格容器组件
 * 
 * 三种使用方式：
 * 1. 组件式：<Grid><GridItem :id="1" :w="4" :h="2"><MyComponent/></GridItem></Grid>
 * 2. 配置式：<Grid v-model="items" />
 * 3. 混合式：组件式 + v-model 配合使用
 */
import { ref, computed, watch, provide, onMounted, onUnmounted, nextTick } from 'vue';
import { createGrid } from '@ldesign/grid-core';
import type { Grid as GridType, GridItem as GridItemType, GridItemData, GridOptions, DeepPartial } from '@ldesign/grid-core';
import type { GridProps } from '../types';
import { GRID_KEY, GRID_OPTIONS_KEY } from '../types';

const props = withDefaults(defineProps<GridProps>(), {
  column: 12,
  cellHeight: 80,
  gap: 10,
  margin: 10,
  draggable: true,
  resizable: true,
  animate: true,
  float: false,
  compact: true,
  collision: 'push',
  autoHeight: true,
  touch: true,
});

const emit = defineEmits<{
  'update:modelValue': [items: GridItemData[]];
  'change': [items: GridItemData[]];
  'dragstart': [item: GridItemData];
  'dragend': [item: GridItemData];
  'resizestart': [item: GridItemData];
  'resizeend': [item: GridItemData];
}>();

const containerRef = ref<HTMLElement | null>(null);
const gridInstance = ref<GridType | null>(null);
const isReady = ref(false);
const itemsData = ref<GridItemData[]>([]);

// 存储每个item的content元素，用于Teleport
const itemContentElements = ref<Map<string, HTMLElement>>(new Map());

const gridOptions = computed<DeepPartial<GridOptions>>(() => ({
  column: props.column,
  cellHeight: props.cellHeight,
  gap: props.gap,
  margin: props.margin,
  draggable: props.draggable && !props.static,
  resizable: props.resizable && !props.static,
  animate: props.animate,
  float: props.float,
  compact: props.compact,
  collision: props.collision,
  minRow: props.minRow,
  maxRow: props.maxRow,
  rtl: props.rtl,
  autoHeight: props.autoHeight,
  touch: props.touch,
  acceptWidgets: props.acceptWidgets,
  handle: props.handle,
  ...props.options,
}));

// 提供给子组件
provide(GRID_KEY, gridInstance);
provide(GRID_OPTIONS_KEY, gridOptions);

// 注册GridItem - 返回content元素用于Teleport
const registerItem = (id: string, data: Partial<GridItemData>): HTMLElement | null => {
  if (!gridInstance.value) return null;
  
  // 检查是否已存在
  const existing = gridInstance.value.getWidget(id);
  if (existing?.el) {
    const contentEl = existing.el.querySelector('.grid-item-content') as HTMLElement;
    if (contentEl) {
      itemContentElements.value.set(id, contentEl);
      return contentEl;
    }
  }
  
  // 创建新widget（content必须非空才会创建.grid-item-content元素）
  const item = gridInstance.value.addWidget({ ...data, id, content: ' ' });
  if (item?.el) {
    const contentEl = item.el.querySelector('.grid-item-content') as HTMLElement;
    if (contentEl) {
      itemContentElements.value.set(id, contentEl);
      refreshItems();
      return contentEl;
    }
  }
  return null;
};

const unregisterItem = (id: string) => {
  itemContentElements.value.delete(id);
  gridInstance.value?.removeWidget(id);
  refreshItems();
};

// 获取item的content元素
const getItemContentEl = (id: string): HTMLElement | null => {
  return itemContentElements.value.get(id) || null;
};

provide('grid-register', registerItem);
provide('grid-unregister', unregisterItem);
provide('grid-get-content-el', getItemContentEl);
provide('grid-is-ready', isReady);

const refreshItems = () => {
  if (gridInstance.value) {
    itemsData.value = gridInstance.value.getWidgets().map(w => ({
      id: w.id, x: w.x, y: w.y, w: w.w, h: w.h,
      minW: w.minW, maxW: w.maxW, minH: w.minH, maxH: w.maxH, static: w.static,
    }));
  }
};

onMounted(async () => {
  if (!containerRef.value) return;
  
  gridInstance.value = createGrid(containerRef.value, gridOptions.value);
  
  // 如果通过v-model传入了items（配置式）
  if (props.modelValue?.length) {
    gridInstance.value.addWidgets(props.modelValue);
  }
  
  // 监听事件
  gridInstance.value.on('change', () => {
    refreshItems();
    emit('update:modelValue', itemsData.value);
    emit('change', itemsData.value);
  });
  gridInstance.value.on('added', refreshItems);
  gridInstance.value.on('removed', refreshItems);
  gridInstance.value.on('dragstart', (data) => emit('dragstart', data.item));
  gridInstance.value.on('dragend', (data) => emit('dragend', data.item));
  gridInstance.value.on('resizestart', (data) => emit('resizestart', data.item));
  gridInstance.value.on('resizeend', (data) => emit('resizeend', data.item));
  
  await nextTick();
  refreshItems();
  isReady.value = true;
});

onUnmounted(() => {
  gridInstance.value?.destroy();
  gridInstance.value = null;
});

// 监听v-model变化
watch(() => props.modelValue, (newItems) => {
  if (newItems && isReady.value && gridInstance.value) {
    gridInstance.value.load(newItems);
    refreshItems();
  }
}, { deep: true });

// 监听配置变化
watch(gridOptions, (newOptions) => {
  if (gridInstance.value && isReady.value) {
    gridInstance.value.setOptions(newOptions);
  }
}, { deep: true });

// 公共API
const addWidget = (data: Partial<GridItemData>) => {
  const item = gridInstance.value?.addWidget(data);
  refreshItems();
  return item;
};

const removeWidget = (id: string | number) => {
  const result = gridInstance.value?.removeWidget(id) ?? false;
  refreshItems();
  return result;
};

const removeAll = () => {
  gridInstance.value?.removeAll();
  refreshItems();
};

const save = () => gridInstance.value?.save() ?? [];
const load = (loadItems: Partial<GridItemData>[]) => {
  gridInstance.value?.load(loadItems);
  refreshItems();
};

const compact = () => {
  gridInstance.value?.compact();
  refreshItems();
};

defineExpose({
  addWidget, removeWidget, removeAll, save, load, compact,
  items: itemsData, isReady, grid: gridInstance,
});
</script>

<template>
  <div ref="containerRef" class="l-grid">
    <!-- slot用于放置GridItem子组件 -->
    <slot 
      :items="itemsData" 
      :add-widget="addWidget" 
      :remove-widget="removeWidget" 
      :is-ready="isReady" 
    />
  </div>
</template>

<style scoped>
.l-grid { position: relative; width: 100%; }
</style>
