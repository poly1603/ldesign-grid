<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Grid } from '../../utils/grid';
import { ArrowRightLeft, Code, Info } from 'lucide-vue-next';

const grid1Ref = ref<HTMLElement | null>(null);
const grid2Ref = ref<HTMLElement | null>(null);
let grid1: Grid | null = null;
let grid2: Grid | null = null;
const showCode = ref(false);

const code = `// 创建多个独立网格
const grid1 = new Grid('#grid1', { column: 6, cellHeight: 70 });
const grid2 = new Grid('#grid2', { column: 6, cellHeight: 70 });

// 各自独立操作
grid1.addWidget({ x: 0, y: 0, w: 3, h: 2 });
grid2.addWidget({ x: 0, y: 0, w: 2, h: 2 });`;

onMounted(() => {
  if (grid1Ref.value && grid2Ref.value) {
    grid1 = new Grid(grid1Ref.value, { column: 6, cellHeight: 70, gap: 8, margin: 8 });
    grid2 = new Grid(grid2Ref.value, { column: 6, cellHeight: 70, gap: 8, margin: 8 });
    grid1.addWidget({ x: 0, y: 0, w: 3, h: 2, content: '<div class="widget-content">网格1 - A</div>' });
    grid1.addWidget({ x: 3, y: 0, w: 3, h: 1, content: '<div class="widget-content">网格1 - B</div>' });
    grid1.addWidget({ x: 0, y: 2, w: 2, h: 1, content: '<div class="widget-content">网格1 - C</div>' });
    grid2.addWidget({ x: 0, y: 0, w: 2, h: 2, content: '<div class="widget-content">网格2 - A</div>' });
    grid2.addWidget({ x: 2, y: 0, w: 4, h: 1, content: '<div class="widget-content">网格2 - B</div>' });
    grid2.addWidget({ x: 2, y: 1, w: 2, h: 2, content: '<div class="widget-content">网格2 - C</div>' });
  }
});

onUnmounted(() => { grid1?.destroy(); grid2?.destroy(); });
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">多个网格</h1>
      <p class="page-description">同一页面可以有多个独立的网格实例。</p>
    </div>
    <div class="info-box" style="margin-bottom: 16px;">
      <Info :size="18" class="info-box-icon" />
      <div>每个网格独立运作，组件只能在自己的网格内拖拽和调整大小。</div>
    </div>
    <div class="toolbar">
      <button class="btn btn-secondary btn-sm" @click="showCode = !showCode"><Code :size="14" /> {{ showCode ? '隐藏' : '查看' }}代码</button>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div class="card">
        <div class="card-header"><span class="card-title"><ArrowRightLeft :size="16" /> 网格 1 (6列)</span></div>
        <div class="card-body card-body-flush"><div ref="grid1Ref" style="min-height: 280px;"></div></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><ArrowRightLeft :size="16" /> 网格 2 (6列)</span></div>
        <div class="card-body card-body-flush"><div ref="grid2Ref" style="min-height: 280px;"></div></div>
      </div>
    </div>
    <div v-if="showCode" class="card" style="margin-top:20px">
      <div class="card-header"><span class="card-title"><Code :size="16" /> 代码示例</span></div>
      <div class="card-body"><div class="code-block"><pre>{{ code }}</pre></div></div>
    </div>
  </div>
</template>
