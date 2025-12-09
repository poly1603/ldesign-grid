<script setup lang="ts">
import { ref, watch } from 'vue';
import { useGrid } from '@ldesign/grid-vue';
import { Lock, Unlock, Code, Info } from 'lucide-vue-next';

const staticMode = ref(false);
const showCode = ref(false);

const { containerRef, enable, disable } = useGrid({
  column: 12,
  cellHeight: 80,
  gap: 10,
  margin: 10,
  items: [
    { id: '1', x: 0, y: 0, w: 4, h: 2, content: '<div class="widget-content">可拖拽</div>' },
    { id: '2', x: 4, y: 0, w: 4, h: 2, static: true, content: '<div class="widget-content static-item">静态组件<br><small>不可拖拽</small></div>' },
    { id: '3', x: 8, y: 0, w: 4, h: 2, content: '<div class="widget-content">可拖拽</div>' },
    { id: '4', x: 0, y: 2, w: 4, h: 1, content: '<div class="widget-content">可拖拽</div>' },
  ],
});

watch(staticMode, (val) => val ? disable() : enable());

const code = `import { useGrid } from '@ldesign/grid-vue';

const { enable, disable } = useGrid({ /* options */ });

// 添加静态组件（不可拖拽）
addWidget({
  x: 4, y: 0, w: 4, h: 2,
  static: true,
});

// 禁用/启用整个网格
disable();  // 禁用所有交互
enable();   // 启用交互`;
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">静态网格</h1>
      <p class="page-description">锁定整个网格或单个组件，使其不可拖拽。</p>
    </div>
    <div class="info-box" style="margin-bottom: 16px;">
      <Info :size="18" class="info-box-icon" />
      <div>中间的组件被标记为静态，无法移动。切换"禁用网格"可以锁定所有组件。</div>
    </div>
    <div class="toolbar">
      <label class="form-checkbox">
        <input type="checkbox" v-model="staticMode" />
        <component :is="staticMode ? Lock : Unlock" :size="14" style="margin-left:4px" />
        禁用网格 {{ staticMode ? '是' : '否' }}
      </label>
      <div class="toolbar-divider"></div>
      <button class="btn btn-secondary btn-sm" @click="showCode = !showCode"><Code :size="14" /> {{ showCode ? '隐藏' : '查看' }}代码</button>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title"><Lock :size="16" /> 网格</span></div>
      <div class="card-body card-body-flush"><div ref="containerRef" style="min-height: 400px;"></div></div>
    </div>
    <div v-if="showCode" class="card">
      <div class="card-header"><span class="card-title"><Code :size="16" /> 代码示例</span></div>
      <div class="card-body"><div class="code-block"><pre>{{ code }}</pre></div></div>
    </div>
  </div>
</template>

<style scoped>
:deep(.static-item) { background: linear-gradient(135deg, #fef3c7, #fde68a); color: #92400e; }
</style>
