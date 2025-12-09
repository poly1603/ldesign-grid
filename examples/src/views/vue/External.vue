<script setup lang="ts">
import { ref, markRaw } from 'vue';
import { Grid, GridItem } from '@ldesign/grid-vue';
import { Download, BarChart3, Table, FileText, PieChart, Activity, Code } from 'lucide-vue-next';

const gridRef = ref<HTMLElement | null>(null);
const dragHelper = ref<HTMLElement | null>(null);
const dragData = ref<any>(null);
const showCode = ref(false);

// 动态添加的组件列表
const droppedItems = ref<Array<{ id: string; x: number; y: number; w: number; h: number; type: string; icon: any }>>([]);

// 组件库
const widgets = [
  { id: 'chart', name: '图表', icon: markRaw(BarChart3), w: 3, h: 2, color: '#3b82f6' },
  { id: 'table', name: '表格', icon: markRaw(Table), w: 4, h: 2, color: '#10b981' },
  { id: 'stat', name: '统计', icon: markRaw(Activity), w: 2, h: 1, color: '#f59e0b' },
  { id: 'list', name: '列表', icon: markRaw(FileText), w: 2, h: 2, color: '#8b5cf6' },
  { id: 'pie', name: '饼图', icon: markRaw(PieChart), w: 2, h: 2, color: '#ef4444' },
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
  if (gridRef.value) {
    const rect = gridRef.value.getBoundingClientRect();
    gridRef.value.classList.toggle('drop-target', e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom);
  }
};

const endDrag = (e: MouseEvent) => {
  if (gridRef.value && dragData.value) {
    const rect = gridRef.value.getBoundingClientRect();
    if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
      // 外部拖入：动态添加 GridItem
      droppedItems.value.push({
        id: `drop-${Date.now()}`,
        x: 0, y: 0,
        w: dragData.value.w,
        h: dragData.value.h,
        type: dragData.value.name,
        icon: dragData.value.icon,
      });
    }
    gridRef.value.classList.remove('drop-target');
  }
  dragData.value = null;
  if (dragHelper.value) dragHelper.value.style.display = 'none';
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', endDrag);
};

const removeItem = (id: string) => {
  const index = droppedItems.value.findIndex(item => item.id === id);
  if (index > -1) droppedItems.value.splice(index, 1);
};

const code = `<script setup>
import { ref } from 'vue';
import { Grid, GridItem } from '@ldesign/grid-vue';

const droppedItems = ref([]);

// 外部拖入后，动态添加 GridItem
const onDrop = (widget) => {
  droppedItems.value.push({
    id: \`drop-\${Date.now()}\`,
    w: widget.w,
    h: widget.h,
    component: widget.component, // 要渲染的Vue组件
  });
};
<\/script>

<template>
  <Grid :column="12">
    <GridItem v-for="item in droppedItems" :key="item.id" v-bind="item">
      <component :is="item.component" />
    </GridItem>
  </Grid>
</template>`;
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
      <div class="card-header"><span class="card-title">网格 (拖入组件后自动创建 GridItem)</span></div>
      <div class="card-body card-body-flush">
        <div ref="gridRef" class="drop-grid">
          <Grid :column="12" :cell-height="80" :gap="10" :margin="10" style="min-height: 350px;">
            <!-- 拖入的动态组件 -->
            <GridItem 
              v-for="item in droppedItems" 
              :key="item.id"
              :id="item.id"
              :w="item.w" 
              :h="item.h"
            >
              <div class="dropped-widget" :style="{ background: widgets.find(w => w.name === item.type)?.color }">
                <component :is="item.icon" :size="24" />
                <span>{{ item.type }}</span>
                <small>{{ item.w }}×{{ item.h }}</small>
                <button class="remove-btn" @click.stop="removeItem(item.id)">×</button>
              </div>
            </GridItem>
          </Grid>
        </div>
      </div>
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
.drop-grid { position: relative; }
.drop-target { outline: 2px dashed var(--color-primary); outline-offset: -2px; background: rgba(59, 130, 246, 0.05); }
.drag-helper { position: fixed; z-index: 10000; padding: 10px 16px; background: var(--color-primary); color: white; border-radius: 6px; box-shadow: var(--shadow-lg); pointer-events: none; display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; }
.dropped-widget {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 100%;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  position: relative;
}
.dropped-widget small { opacity: 0.8; font-size: 12px; }
.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border: none;
  background: rgba(255,255,255,0.3);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}
.remove-btn:hover { background: rgba(255,255,255,0.5); }
</style>
