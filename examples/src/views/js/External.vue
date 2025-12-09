<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Grid } from '../../utils/grid';
import { Download, BarChart3, Table, FileText, PieChart, Activity, Code } from 'lucide-vue-next';

const containerRef = ref<HTMLElement | null>(null);
const dragHelper = ref<HTMLElement | null>(null);
let grid: Grid | null = null;
const dragData = ref<any>(null);
const showCode = ref(false);

const code = `// 外部拖入实现
const externalWidget = document.querySelector('.external-widget');

externalWidget.addEventListener('mousedown', (e) => {
  // 开始拖拽，创建辅助元素...
});

document.addEventListener('mouseup', (e) => {
  const rect = gridContainer.getBoundingClientRect();
  if (isInsideGrid(e, rect)) {
    // 计算放置位置
    const pos = grid.pixelToGrid(e.clientX - rect.left, e.clientY - rect.top);
    // 添加组件
    grid.addWidget({ x: pos.x, y: pos.y, w: 3, h: 2 });
  }
});`;

const widgets = [
  { id: 'chart', name: '图表', icon: BarChart3, w: 3, h: 2 },
  { id: 'table', name: '表格', icon: Table, w: 4, h: 2 },
  { id: 'stat', name: '统计', icon: Activity, w: 2, h: 1 },
  { id: 'list', name: '列表', icon: FileText, w: 2, h: 2 },
  { id: 'pie', name: '饼图', icon: PieChart, w: 2, h: 2 },
];

const startDrag = (widget: any, e: MouseEvent) => {
  dragData.value = widget;
  if (dragHelper.value) {
    dragHelper.value.style.display = 'flex';
    dragHelper.value.style.left = `${e.clientX - 50}px`;
    dragHelper.value.style.top = `${e.clientY - 20}px`;
  }
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', endDrag);
};

const onDrag = (e: MouseEvent) => {
  if (dragHelper.value) {
    dragHelper.value.style.left = `${e.clientX - 50}px`;
    dragHelper.value.style.top = `${e.clientY - 20}px`;
  }
  if (containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect();
    containerRef.value.classList.toggle('drop-target', e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom);
  }
};

const endDrag = (e: MouseEvent) => {
  if (containerRef.value && grid && dragData.value) {
    const rect = containerRef.value.getBoundingClientRect();
    if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
      const pos = grid.pixelToGrid(e.clientX - rect.left, e.clientY - rect.top);
      grid.addWidget({ x: pos.x, y: pos.y, w: dragData.value.w, h: dragData.value.h, content: `<div class="widget-content">${dragData.value.name}</div>` });
    }
    containerRef.value.classList.remove('drop-target');
  }
  dragData.value = null;
  if (dragHelper.value) dragHelper.value.style.display = 'none';
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', endDrag);
};

onMounted(() => {
  if (!containerRef.value) return;
  grid = new Grid(containerRef.value, { column: 12, cellHeight: 80, gap: 10, margin: 10 });
  grid.addWidget({ x: 0, y: 0, w: 4, h: 2, content: '<div class="widget-content">已有组件</div>' });
});

onUnmounted(() => grid?.destroy());
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">外部拖入</h1>
      <p class="page-description">从组件库中拖拽组件到网格中。</p>
    </div>
    <div class="toolbar">
      <button class="btn btn-secondary btn-sm" @click="showCode = !showCode"><Code :size="14" /> {{ showCode ? '隐藏' : '查看' }}代码</button>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title"><Download :size="16" /> 组件库 (拖拽到下方网格)</span></div>
      <div class="card-body">
        <div class="external-widgets">
          <div v-for="w in widgets" :key="w.id" class="external-widget" @mousedown="startDrag(w, $event)">
            <component :is="w.icon" :size="18" />
            <span>{{ w.name }}</span>
            <span class="external-widget-size">{{ w.w }}×{{ w.h }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">网格</span></div>
      <div class="card-body card-body-flush"><div ref="containerRef" style="min-height: 350px;"></div></div>
    </div>
    <div v-if="showCode" class="card">
      <div class="card-header"><span class="card-title"><Code :size="16" /> 代码示例</span></div>
      <div class="card-body"><div class="code-block"><pre>{{ code }}</pre></div></div>
    </div>
    <Teleport to="body">
      <div ref="dragHelper" class="drag-helper" style="display:none">
        <component v-if="dragData" :is="dragData.icon" :size="16" />
        {{ dragData?.name }}
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.drop-target { outline: 2px dashed var(--color-primary); outline-offset: -2px; background: rgba(59, 130, 246, 0.05); }
.drag-helper { position: fixed; z-index: 10000; padding: 10px 16px; background: var(--color-primary); color: white; border-radius: 6px; box-shadow: var(--shadow-lg); pointer-events: none; display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; }
</style>
