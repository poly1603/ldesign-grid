<script setup lang="ts">
import { ref, watch } from 'vue';
import { useGrid } from '@ldesign/grid-vue';
import { Settings, Code, Plus, Trash2, RefreshCw } from 'lucide-vue-next';

const columnValue = ref(12);
const cellHeightValue = ref(80);
const showCode = ref(false);

// 使用 useGrid composable
const { containerRef, items, addWidget, removeAll, compact, setColumn, setOptions } = useGrid({
  column: columnValue.value,
  cellHeight: cellHeightValue.value,
  gap: 10,
  margin: 10,
  items: [
    { id: '1', x: 0, y: 0, w: 4, h: 2, content: '<div class="widget-content">组件 1</div>' },
    { id: '2', x: 4, y: 0, w: 4, h: 1, content: '<div class="widget-content">组件 2</div>' },
    { id: '3', x: 8, y: 0, w: 4, h: 2, content: '<div class="widget-content">组件 3</div>' },
    { id: '4', x: 4, y: 1, w: 4, h: 2, content: '<div class="widget-content">组件 4</div>' },
  ],
});

const handleAddWidget = () => {
  const w = 2 + Math.floor(Math.random() * 3);
  const h = 1 + Math.floor(Math.random() * 2);
  addWidget({ w, h, content: `<div class="widget-content">${w}×${h}</div>` });
};

const updateColumn = () => setColumn(columnValue.value);
const updateCellHeight = () => setOptions({ cellHeight: cellHeightValue.value });

const code = `import { useGrid } from '@ldesign/grid-vue';

const { addWidget, removeAll, compact, setColumn, setOptions, save, load } = useGrid({
  column: 12,
  cellHeight: 80,
});

// 添加/删除组件
addWidget({ x: 0, y: 0, w: 4, h: 2 });
removeAll();

// 动态配置
setColumn(8);
setOptions({ cellHeight: 100 });

// 保存/加载布局
const layout = save();
load(savedLayout);

// 紧凑布局
compact();`;
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">API 操作</h1>
      <p class="page-description">演示 Grid 的各种 API 方法和动态配置。</p>
    </div>
    <div class="toolbar">
      <button class="btn btn-primary btn-sm" @click="handleAddWidget"><Plus :size="14" /> 添加</button>
      <button class="btn btn-secondary btn-sm" @click="compact"><RefreshCw :size="14" /> 紧凑</button>
      <button class="btn btn-danger btn-sm" @click="removeAll"><Trash2 :size="14" /> 清空</button>
      <div class="toolbar-divider"></div>
      <div class="form-group"><label class="form-label">列数:</label>
        <select v-model.number="columnValue" class="form-select" @change="updateColumn">
          <option :value="6">6</option><option :value="8">8</option><option :value="10">10</option><option :value="12">12</option>
        </select>
      </div>
      <div class="form-group"><label class="form-label">行高:</label>
        <input type="range" v-model.number="cellHeightValue" min="50" max="120" @input="updateCellHeight" style="width:80px" />
        <span style="min-width:40px">{{ cellHeightValue }}px</span>
      </div>
      <div class="toolbar-divider"></div>
      <button class="btn btn-secondary btn-sm" @click="showCode = !showCode"><Code :size="14" /> {{ showCode ? '隐藏' : '查看' }}代码</button>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title"><Settings :size="16" /> 网格 ({{ columnValue }}列, {{ cellHeightValue }}px)</span></div>
      <div class="card-body card-body-flush"><div ref="containerRef" style="min-height: 400px;"></div></div>
    </div>
    <div v-if="showCode" class="card">
      <div class="card-header"><span class="card-title"><Code :size="16" /> 代码示例</span></div>
      <div class="card-body"><div class="code-block"><pre>{{ code }}</pre></div></div>
    </div>
  </div>
</template>
