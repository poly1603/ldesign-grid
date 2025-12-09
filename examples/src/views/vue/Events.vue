<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Grid } from '../../utils/grid';
import { Zap, Code, Plus, Trash2 } from 'lucide-vue-next';

const containerRef = ref<HTMLElement | null>(null);
let grid: Grid | null = null;
const eventLog = ref<string[]>([]);
const showCode = ref(false);

const code = `// 监听变化事件
grid.onChange((items) => {
  console.log('布局变化:', items);
});

// 监听自定义事件
grid.on('dragstart', (data) => {
  console.log('开始拖拽:', data.item);
});

grid.on('dragend', (data) => {
  console.log('结束拖拽:', data.item);
});`;

const addLog = (msg: string) => {
  const time = new Date().toLocaleTimeString();
  eventLog.value.unshift(`[${time}] ${msg}`);
  if (eventLog.value.length > 20) eventLog.value.pop();
};

const addWidget = () => {
  if (!grid) return;
  const w = 2 + Math.floor(Math.random() * 2);
  const h = 1 + Math.floor(Math.random() * 2);
  grid.addWidget({ w, h, content: `<div class="widget-content">${w}×${h}</div>` });
  addLog(`添加组件 (${w}×${h})`);
};

const clearLog = () => { eventLog.value = []; };

onMounted(() => {
  if (!containerRef.value) return;
  grid = new Grid(containerRef.value, { column: 12, cellHeight: 80, gap: 10, margin: 10 });
  grid.addWidget({ x: 0, y: 0, w: 4, h: 2, content: '<div class="widget-content">组件 1</div>' });
  grid.addWidget({ x: 4, y: 0, w: 4, h: 1, content: '<div class="widget-content">组件 2</div>' });
  grid.addWidget({ x: 8, y: 0, w: 4, h: 2, content: '<div class="widget-content">组件 3</div>' });
  grid.onChange((items) => addLog(`布局变化: ${items.length}个组件`));
  grid.on('dragstart', (data) => addLog(`开始拖拽: ${data.item.id}`));
  grid.on('dragend', (data) => addLog(`结束拖拽: ${data.item.id} -> (${data.item.x}, ${data.item.y})`));
  addLog('网格初始化完成');
});

onUnmounted(() => grid?.destroy());
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">事件系统</h1>
      <p class="page-description">监听网格的各种事件，如拖拽开始/结束、布局变化等。</p>
    </div>
    <div class="toolbar">
      <button class="btn btn-primary btn-sm" @click="addWidget"><Plus :size="14" /> 添加组件</button>
      <button class="btn btn-secondary btn-sm" @click="clearLog"><Trash2 :size="14" /> 清空日志</button>
      <div class="toolbar-divider"></div>
      <button class="btn btn-secondary btn-sm" @click="showCode = !showCode"><Code :size="14" /> {{ showCode ? '隐藏' : '查看' }}代码</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
      <div class="card">
        <div class="card-header"><span class="card-title"><Zap :size="16" /> 网格</span></div>
        <div class="card-body card-body-flush"><div ref="containerRef" style="min-height:300px"></div></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">事件日志</span></div>
        <div class="card-body">
          <div class="event-log">
            <div v-for="(log, i) in eventLog" :key="i" class="event-log-item">{{ log }}</div>
            <div v-if="eventLog.length === 0" class="text-muted">暂无事件</div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showCode" class="card">
      <div class="card-header"><span class="card-title"><Code :size="16" /> 代码示例</span></div>
      <div class="card-body"><div class="code-block"><pre>{{ code }}</pre></div></div>
    </div>
  </div>
</template>

<style scoped>
.event-log { max-height: 300px; overflow-y: auto; font-family: monospace; font-size: 12px; }
.event-log-item { padding: 6px 0; border-bottom: 1px solid var(--color-border); color: var(--color-text-secondary); }
.event-log-item:last-child { border-bottom: none; }
.text-muted { color: var(--color-text-muted); }
</style>
