<script setup lang="ts">
/**
 * GridItem - 网格项组件
 * 
 * 使用Teleport将slot内容渲染到core创建的grid-item-content元素中
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

// 注入Grid提供的方法
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

const register = () => {
  if (!registerFn || isRegistered.value) return;
  
  const itemData: Partial<GridItemData> = {
    id: itemId.value,
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

// 等Grid就绪后注册
onMounted(() => {
  const tryRegister = () => {
    if (gridIsReady?.value && !isRegistered.value) {
      register();
    }
  };
  
  // 立即尝试
  tryRegister();
  
  // 如果Grid还没准备好，监听变化
  if (!isRegistered.value && gridIsReady) {
    const stopWatch = watch(
      gridIsReady,
      (ready) => {
        if (ready) {
          tryRegister();
          stopWatch();
        }
      }
    );
  }
});

onUnmounted(() => {
  if (unregisterFn && isRegistered.value) {
    unregisterFn(itemId.value);
    isRegistered.value = false;
    teleportTarget.value = null;
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
