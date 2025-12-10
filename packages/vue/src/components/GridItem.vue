<script setup lang="ts">
/**
 * GridItem - 网格项组件
 * 
 * 职责：
 * 1. 注册到 Core Grid
 * 2. 使用 Teleport 将 slot 内容渲染到 Core 创建的 DOM 元素中
 * 3. 卸载时注销
 * 
 * 注意：位置和大小由 Core 完全管理，不监听 props 变化
 * 如需动态更新，请使用 Grid 组件的 API
 */
import { ref, computed, watch, onMounted, onUnmounted, inject, Teleport } from 'vue';
import type { Ref } from 'vue';
import type { GridItemProps } from '../types';
import type { GridItemData } from '@ldesign/grid-core';

const props = withDefaults(defineProps<GridItemProps>(), {
  w: 2,
  h: 2,
  minW: 1,
  minH: 1,
  draggable: true,
  resizable: true,
  autoPosition: true,
});

// 注入 Grid 提供的方法
const registerFn = inject<(id: string, data: Partial<GridItemData>) => HTMLElement | null>('grid-register');
const unregisterFn = inject<(id: string) => void>('grid-unregister');
const gridIsReady = inject<Ref<boolean>>('grid-is-ready');

const teleportTarget = ref<HTMLElement | null>(null);
const isRegistered = ref(false);

// 生成唯一ID
const itemId = computed(() => {
  if (props.id !== undefined) return String(props.id);
  return `item-${Math.random().toString(36).slice(2, 9)}`;
});

// 只在首次注册时使用 props
const register = () => {
  if (!registerFn || isRegistered.value) return;
  
  const itemData: Partial<GridItemData> = {
    x: props.x,
    y: props.y,
    w: props.w,
    h: props.h,
    minW: props.minW,
    maxW: props.maxW,
    minH: props.minH,
    maxH: props.maxH,
    static: props.static,
    draggable: props.draggable,
    resizable: props.resizable,
    locked: props.locked,
    autoPosition: props.autoPosition,
  };
  
  const contentEl = registerFn(itemId.value, itemData);
  if (contentEl) {
    teleportTarget.value = contentEl;
    isRegistered.value = true;
  }
};

// 等 Grid 就绪后注册
onMounted(() => {
  if (gridIsReady?.value) {
    register();
  } else if (gridIsReady) {
    const stopWatch = watch(gridIsReady, (ready) => {
      if (ready) {
        register();
        stopWatch();
      }
    });
  }
});

onUnmounted(() => {
  if (unregisterFn && isRegistered.value) {
    unregisterFn(itemId.value);
  }
});

defineExpose({ id: itemId });
</script>

<template>
  <!-- 使用Teleport将内容渲染到core创建的grid-item-content元素 -->
  <Teleport v-if="teleportTarget" :to="teleportTarget">
    <slot />
  </Teleport>
</template>
