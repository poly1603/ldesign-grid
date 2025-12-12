<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { createGrid, type Grid } from '@ldesign/grid-core';
import { Plus, Trash2, Package, Code } from 'lucide-vue-next';

const containerRef = ref<HTMLElement | null>(null);
let grid: Grid | null = null;
const showCode = ref(false);

const code = `import { Grid } from '@ldesign/grid-core';

// 创建网格
const grid = new Grid(container, {
  column: 12,
  cellHeight: 80,
  gap: 10,
  margin: 10,
});

// 添加组件
grid.addWidget({ x: 0, y: 0, w: 4, h: 2, content: '<div>内容</div>' });

// 监听变化
grid.onChange((items) => {
  console.log('布局变化:', items);
});

// 删除组件
grid.removeWidget('widget-id');

// 清空
grid.removeAll();`;

const addWidget = () => {
  if (!grid) return;
  const w = 2 + Math.floor(Math.random() * 3);
  const h = 1 + Math.floor(Math.random() * 2);
  grid.addWidget({ w, h, content: `<div class="widget-content">${w}×${h}</div>` });
};

const clearAll = () => grid?.removeAll();

onMounted(() => {
  if (!containerRef.value) return;
  grid = createGrid(containerRef.value, { column: 12, cellHeight: 80, gap: 10, margin: 10 });
  grid.addWidget({ x: 0, y: 0, w: 4, h: 2, content: '<div class="widget-content">组件 1<br><small>4×2</small></div>' });
  grid.addWidget({ x: 4, y: 0, w: 4, h: 1, content: '<div class="widget-content">组件 2<br><small>4×1</small></div>' });
  grid.addWidget({ x: 8, y: 0, w: 4, h: 2, content: '<div class="widget-content">组件 3<br><small>4×2</small></div>' });
  grid.addWidget({ x: 4, y: 1, w: 4, h: 2, content: '<div class="widget-content">组件 4<br><small>4×2</small></div>' });
  grid.addWidget({ x: 0, y: 2, w: 4, h: 1, content: '<div class="widget-content">组件 5<br><small>4×1</small></div>' });
});

onUnmounted(() => grid?.destroy());
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">基础网格</h1>
      <p class="page-description">拖拽组件移动位置，拖拽右下角调整大小。组件会自动紧凑排列，避免重叠。</p>
    </div>

    <div class="toolbar">
      <button class="btn btn-primary btn-sm" @click="addWidget">
        <Plus :size="14" /> 添加组件
      </button>
      <button class="btn btn-danger btn-sm" @click="clearAll">
        <Trash2 :size="14" /> 清空
      </button>
      <div class="toolbar-divider"></div>
      <button class="btn btn-secondary btn-sm" @click="showCode = !showCode"><Code :size="14" /> {{ showCode ? '隐藏' :
        '查看' }}代码</button>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">
          <Package :size="16" /> 网格布局
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
