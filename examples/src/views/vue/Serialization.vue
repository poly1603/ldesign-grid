<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { Grid } from '../../utils/grid';
import { Save, Upload, RotateCcw, Code } from 'lucide-vue-next';

const containerRef = ref<HTMLElement | null>(null);
let grid: Grid | null = null;
const savedLayout = ref<any[]>([]);
const showCode = ref(false);

const jsonOutput = computed(() => JSON.stringify(savedLayout.value, null, 2));

const code = `// 保存布局
const layout = grid.save();
localStorage.setItem('layout', JSON.stringify(layout));

// 加载布局
const saved = localStorage.getItem('layout');
if (saved) {
  grid.load(JSON.parse(saved));
}

// 监听变化自动保存
grid.onChange((items) => {
  localStorage.setItem('layout', JSON.stringify(items));
});`;

const updateSaved = () => { savedLayout.value = grid?.save() || []; };
const saveToStorage = () => { localStorage.setItem('grid-demo-layout', JSON.stringify(grid?.save())); updateSaved(); alert('已保存到 localStorage！'); };
const loadFromStorage = () => {
  const data = localStorage.getItem('grid-demo-layout');
  if (data && grid) { grid.load(JSON.parse(data)); updateSaved(); alert('已加载！'); }
  else alert('没有保存的布局');
};
const resetLayout = () => {
  grid?.removeAll();
  grid?.addWidget({ x: 0, y: 0, w: 4, h: 2, content: '<div class="widget-content">组件 1</div>' });
  grid?.addWidget({ x: 4, y: 0, w: 4, h: 1, content: '<div class="widget-content">组件 2</div>' });
  grid?.addWidget({ x: 8, y: 0, w: 4, h: 2, content: '<div class="widget-content">组件 3</div>' });
  updateSaved();
};

onMounted(() => {
  if (!containerRef.value) return;
  grid = new Grid(containerRef.value, { column: 12, cellHeight: 80, gap: 10, margin: 10 });
  grid.addWidget({ x: 0, y: 0, w: 4, h: 2, content: '<div class="widget-content">组件 1</div>' });
  grid.addWidget({ x: 4, y: 0, w: 4, h: 1, content: '<div class="widget-content">组件 2</div>' });
  grid.addWidget({ x: 8, y: 0, w: 4, h: 2, content: '<div class="widget-content">组件 3</div>' });
  grid.onChange(updateSaved);
  updateSaved();
});

onUnmounted(() => grid?.destroy());
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">序列化</h1>
      <p class="page-description">保存和加载网格布局数据。</p>
    </div>
    <div class="toolbar">
      <button class="btn btn-primary btn-sm" @click="saveToStorage"><Save :size="14" /> 保存到存储</button>
      <button class="btn btn-secondary btn-sm" @click="loadFromStorage"><Upload :size="14" /> 从存储加载</button>
      <button class="btn btn-secondary btn-sm" @click="resetLayout"><RotateCcw :size="14" /> 重置</button>
      <div class="toolbar-divider"></div>
      <button class="btn btn-secondary btn-sm" @click="showCode = !showCode"><Code :size="14" /> {{ showCode ? '隐藏' : '查看' }}代码</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
      <div class="card">
        <div class="card-header"><span class="card-title"><Save :size="16" /> 网格</span></div>
        <div class="card-body card-body-flush"><div ref="containerRef" style="min-height:300px"></div></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">JSON 数据 (实时)</span></div>
        <div class="card-body"><div class="code-block" style="max-height:350px;overflow:auto"><pre>{{ jsonOutput }}</pre></div></div>
      </div>
    </div>
    <div v-if="showCode" class="card">
      <div class="card-header"><span class="card-title"><Code :size="16" /> 代码示例</span></div>
      <div class="card-body"><div class="code-block"><pre>{{ code }}</pre></div></div>
    </div>
  </div>
</template>
