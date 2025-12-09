<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { Grid } from '../../utils/grid';
import { Layers, Code, Info } from 'lucide-vue-next';

const containerRef = ref<HTMLElement | null>(null);
let grid: Grid | null = null;
const floatMode = ref(false);
const showCode = ref(false);

const code = `// 浮动模式
const grid = new Grid(container, {
  float: true, // 启用浮动模式
});

// 动态切换
grid.setFloat(true);  // 启用
grid.setFloat(false); // 禁用，组件会自动紧凑`;

watch(floatMode, (val) => grid?.setFloat(val));

onMounted(() => {
  if (!containerRef.value) return;
  grid = new Grid(containerRef.value, { column: 12, cellHeight: 80, gap: 10, margin: 10, float: false });
  grid.addWidget({ x: 0, y: 0, w: 4, h: 2, content: '<div class="widget-content">组件 1<br><small>y=0</small></div>' });
  grid.addWidget({ x: 4, y: 2, w: 4, h: 2, content: '<div class="widget-content">组件 2<br><small>y=2</small></div>' });
  grid.addWidget({ x: 8, y: 1, w: 4, h: 2, content: '<div class="widget-content">组件 3<br><small>y=1</small></div>' });
});

onUnmounted(() => grid?.destroy());
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">浮动模式</h1>
      <p class="page-description">切换浮动模式，允许组件之间存在空隙。</p>
    </div>
    <div class="info-box" style="margin-bottom: 16px;">
      <Info :size="18" class="info-box-icon" />
      <div>关闭浮动模式时，组件会自动向上紧凑排列。开启后，组件会保持在放置的位置。</div>
    </div>
    <div class="toolbar">
      <label class="form-checkbox"><input type="checkbox" v-model="floatMode" /> 浮动模式 {{ floatMode ? '开启' : '关闭' }}</label>
      <div class="toolbar-divider"></div>
      <button class="btn btn-secondary btn-sm" @click="showCode = !showCode"><Code :size="14" /> {{ showCode ? '隐藏' : '查看' }}代码</button>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title"><Layers :size="16" /> 网格 (浮动: {{ floatMode ? '开' : '关' }})</span></div>
      <div class="card-body card-body-flush"><div ref="containerRef" style="min-height: 400px;"></div></div>
    </div>
    <div v-if="showCode" class="card">
      <div class="card-header"><span class="card-title"><Code :size="16" /> 代码示例</span></div>
      <div class="card-body"><div class="code-block"><pre>{{ code }}</pre></div></div>
    </div>
  </div>
</template>
