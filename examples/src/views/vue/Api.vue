<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Grid } from '../../utils/grid';
import { Settings, Code, Plus, Trash2, RefreshCw } from 'lucide-vue-next';

const containerRef = ref<HTMLElement | null>(null);
let grid: Grid | null = null;
const column = ref(12);
const cellHeight = ref(80);
const showCode = ref(false);

const code = `// API 方法
grid.addWidget({ x: 0, y: 0, w: 4, h: 2 });
grid.removeWidget('widget-id');
grid.removeAll();

// 配置方法
grid.setColumn(8);
grid.setCellHeight(100);
grid.setFloat(true);
grid.setStatic(true);

// 数据方法
const items = grid.getItems();
const layout = grid.save();
grid.load(savedLayout);

// 紧凑布局
grid.compact();`;

const addWidget = () => {
  const w = 2 + Math.floor(Math.random() * 3);
  const h = 1 + Math.floor(Math.random() * 2);
  grid?.addWidget({ w, h, content: `<div class="widget-content">${w}×${h}</div>` });
};
const clearAll = () => grid?.removeAll();
const compactGrid = () => grid?.compact();
const updateColumn = () => grid?.setColumn(column.value);
const updateCellHeight = () => grid?.setCellHeight(cellHeight.value);

onMounted(() => {
  if (!containerRef.value) return;
  grid = new Grid(containerRef.value, { column: column.value, cellHeight: cellHeight.value, gap: 10, margin: 10 });
  grid.addWidget({ x: 0, y: 0, w: 4, h: 2, content: '<div class="widget-content">组件 1</div>' });
  grid.addWidget({ x: 4, y: 0, w: 4, h: 1, content: '<div class="widget-content">组件 2</div>' });
  grid.addWidget({ x: 8, y: 0, w: 4, h: 2, content: '<div class="widget-content">组件 3</div>' });
  grid.addWidget({ x: 4, y: 1, w: 4, h: 2, content: '<div class="widget-content">组件 4</div>' });
});

onUnmounted(() => grid?.destroy());
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">API 操作</h1>
      <p class="page-description">演示 Grid 的各种 API 方法和动态配置。</p>
    </div>
    <div class="toolbar">
      <button class="btn btn-primary btn-sm" @click="addWidget"><Plus :size="14" /> 添加</button>
      <button class="btn btn-secondary btn-sm" @click="compactGrid"><RefreshCw :size="14" /> 紧凑</button>
      <button class="btn btn-danger btn-sm" @click="clearAll"><Trash2 :size="14" /> 清空</button>
      <div class="toolbar-divider"></div>
      <div class="form-group"><label class="form-label">列数:</label>
        <select v-model.number="column" class="form-select" @change="updateColumn">
          <option :value="6">6</option><option :value="8">8</option><option :value="10">10</option><option :value="12">12</option>
        </select>
      </div>
      <div class="form-group"><label class="form-label">行高:</label>
        <input type="range" v-model.number="cellHeight" min="50" max="120" @input="updateCellHeight" style="width:80px" />
        <span style="min-width:40px">{{ cellHeight }}px</span>
      </div>
      <div class="toolbar-divider"></div>
      <button class="btn btn-secondary btn-sm" @click="showCode = !showCode"><Code :size="14" /> {{ showCode ? '隐藏' : '查看' }}代码</button>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title"><Settings :size="16" /> 网格 ({{ column }}列, {{ cellHeight }}px)</span></div>
      <div class="card-body card-body-flush"><div ref="containerRef" style="min-height: 400px;"></div></div>
    </div>
    <div v-if="showCode" class="card">
      <div class="card-header"><span class="card-title"><Code :size="16" /> 代码示例</span></div>
      <div class="card-body"><div class="code-block"><pre>{{ code }}</pre></div></div>
    </div>
  </div>
</template>
