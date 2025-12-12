<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { createGrid, type Grid } from '@ldesign/grid-core';
import { Maximize2, Code, Info } from 'lucide-vue-next';

const containerRef = ref<HTMLElement | null>(null);
let grid: Grid | null = null;
const showCode = ref(false);

const code = `// 添加带约束的组件
grid.addWidget({
  x: 0, y: 0, w: 4, h: 2,
  minW: 2,  // 最小宽度
  maxW: 6,  // 最大宽度
  minH: 1,  // 最小高度
  maxH: 4,  // 最大高度
  content: '<div>有约束的组件</div>',
});`;

onMounted(() => {
  if (!containerRef.value) return;
  grid = createGrid(containerRef.value, { column: 12, cellHeight: 80, gap: 10, margin: 10 });
  grid.addWidget({ x: 0, y: 0, w: 4, h: 2, content: '<div class="widget-content">无约束</div>' });
  grid.addWidget({ x: 4, y: 0, w: 4, h: 2, minW: 2, maxW: 6, content: '<div class="widget-content">minW:2 maxW:6</div>' });
  grid.addWidget({ x: 8, y: 0, w: 4, h: 2, minH: 2, maxH: 4, content: '<div class="widget-content">minH:2 maxH:4</div>' });
  grid.addWidget({ x: 0, y: 2, w: 6, h: 2, minW: 3, maxW: 8, minH: 1, maxH: 3, content: '<div class="widget-content">minW:3 maxW:8<br>minH:1 maxH:3</div>' });
});

onUnmounted(() => grid?.destroy());
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">调整大小</h1>
      <p class="page-description">组件支持最小/最大尺寸约束。调整大小时其他组件会实时移动。</p>
    </div>
    <div class="info-box" style="margin-bottom: 16px;">
      <Info :size="18" class="info-box-icon" />
      <div>部分组件设置了尺寸约束，尝试调整它们的大小来查看限制效果。</div>
    </div>
    <div class="toolbar">
      <button class="btn btn-secondary btn-sm" @click="showCode = !showCode"><Code :size="14" /> {{ showCode ? '隐藏' :
        '查看' }}代码</button>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">
          <Maximize2 :size="16" /> 可调整大小的组件
        </span></div>
      <div class="card-body card-body-flush">
        <div ref="containerRef" style="min-height: 400px;"></div>
      </div>
    </div>
    <div v-if="showCode" class="card">
      <div class="card-header"><span class="card-title"><Code :size="16" /> 代码示例</span></div>
      <div class="card-body">
        <div class="code-block">
          <pre>{{ code }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>
