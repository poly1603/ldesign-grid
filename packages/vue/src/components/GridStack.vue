<script setup lang="ts">
import { computed, watch, useSlots } from 'vue';
import { useGrid } from '../composables/useGrid';
import type { GridProps } from '../types';
import type { GridItemData } from '@ldesign/grid-core';

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

const gridOptions = computed(() => ({
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

const {
  containerRef,
  items,
  isReady,
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
  on,
  off,
} = useGrid(gridOptions.value);

// 同步modelValue
watch(() => props.modelValue, (newItems) => {
  if (newItems && isReady.value) {
    load(newItems);
  }
}, { deep: true });

// 监听变更
on('change', () => {
  const savedItems = save();
  emit('update:modelValue', savedItems);
  emit('change', savedItems);
});

on('dragstart', (data) => emit('dragstart', data.item));
on('dragend', (data) => emit('dragend', data.item));
on('resizestart', (data) => emit('resizestart', data.item));
on('resizeend', (data) => emit('resizeend', data.item));

// 暴露API
defineExpose({
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
  on,
  off,
  items,
  isReady,
});
</script>

<template>
  <div ref="containerRef" class="grid-stack-container">
    <slot :items="items" :add-widget="addWidget" :remove-widget="removeWidget" />
  </div>
</template>

<style scoped>
.grid-stack-container {
  position: relative;
  width: 100%;
}
</style>
