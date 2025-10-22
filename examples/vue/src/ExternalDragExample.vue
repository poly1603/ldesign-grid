<template>
  <div class="external-drag-demo">
    <h1>Vue Grid - 外部拖拽示例</h1>
    
    <div class="demo-container">
      <!-- 左侧：组件工具箱 -->
      <div class="component-toolbox">
        <h2>组件工具箱</h2>
        <p class="hint">拖拽组件到右侧网格</p>
        
        <div class="components-list">
          <GridDragSource
            v-for="widget in widgets"
            :key="widget.id"
            :data="widget"
            :item-options="{ w: widget.w, h: widget.h }"
            class="widget-item"
          >
            <div class="widget-content">
              <div class="widget-icon">{{ widget.icon }}</div>
              <div class="widget-info">
                <div class="widget-name">{{ widget.name }}</div>
                <div class="widget-desc">{{ widget.description }}</div>
              </div>
            </div>
          </GridDragSource>
        </div>
      </div>

      <!-- 右侧：Grid 网格 -->
      <div class="grid-container">
        <div class="grid-header">
          <h2>Dashboard</h2>
          <div class="grid-controls">
            <button @click="clearGrid" class="btn btn-secondary">
              🗑️ 清空
            </button>
            <button @click="saveLayout" class="btn btn-primary">
              💾 保存布局
            </button>
            <button @click="loadLayout" class="btn btn-primary">
              📂 加载布局
            </button>
          </div>
        </div>

        <GridStack
          ref="gridRef"
          :options="gridOptions"
          @dropped="handleItemDropped"
          @change="handleLayoutChange"
        >
          <GridItem
            v-for="item in gridItems"
            :key="item.id"
            v-bind="item"
          >
            <div class="grid-item-content">
              <div class="grid-item-header">
                <span class="grid-item-icon">{{ item.data?.icon }}</span>
                <span class="grid-item-title">{{ item.data?.name }}</span>
                <button 
                  @click="removeItem(item.id)"
                  class="grid-item-remove"
                  title="删除"
                >
                  ×
                </button>
              </div>
              <div class="grid-item-body">
                {{ item.data?.description }}
              </div>
            </div>
          </GridItem>
        </GridStack>

        <div v-if="gridItems.length === 0" class="empty-state">
          <div class="empty-icon">📦</div>
          <p>拖拽左侧组件到这里开始构建你的 Dashboard</p>
        </div>
      </div>
    </div>

    <!-- Toast 通知 -->
    <Transition name="toast">
      <div v-if="toast.show" class="toast" :class="`toast-${toast.type}`">
        {{ toast.message }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { GridStack, GridItem, GridDragSource } from '@ldesign/grid/vue'
import type { GridOptions, GridItemOptions } from '@ldesign/grid'

// 可用的组件
const widgets = ref([
  {
    id: 'chart',
    name: '图表',
    description: '数据可视化图表',
    icon: '📊',
    w: 4,
    h: 3
  },
  {
    id: 'table',
    name: '表格',
    description: '数据表格展示',
    icon: '📋',
    w: 6,
    h: 4
  },
  {
    id: 'kpi',
    name: 'KPI 指标',
    description: '关键性能指标',
    icon: '📈',
    w: 3,
    h: 2
  },
  {
    id: 'calendar',
    name: '日历',
    description: '日程安排',
    icon: '📅',
    w: 4,
    h: 3
  },
  {
    id: 'todo',
    name: '待办事项',
    description: '任务管理',
    icon: '✅',
    w: 3,
    h: 4
  },
  {
    id: 'weather',
    name: '天气',
    description: '天气预报',
    icon: '🌤️',
    w: 3,
    h: 2
  },
  {
    id: 'news',
    name: '新闻',
    description: '最新资讯',
    icon: '📰',
    w: 4,
    h: 3
  },
  {
    id: 'map',
    name: '地图',
    description: '地理位置',
    icon: '🗺️',
    w: 6,
    h: 4
  }
])

// Grid 配置
const gridOptions: GridOptions = {
  column: 12,
  cellHeight: 80,
  acceptWidgets: true,
  float: true,
  animate: true
}

// Grid 项目
const gridItems = ref<GridItemOptions[]>([])

// Grid 引用
const gridRef = ref()

// Toast 通知
const toast = reactive({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error' | 'info'
})

/**
 * 处理组件拖拽到 Grid
 */
function handleItemDropped(event: CustomEvent) {
  const { item, data } = event.detail
  
  // 更新 item 的数据
  const widget = data.data
  item.data = widget

  // 添加到 gridItems
  gridItems.value.push({
    id: item.id,
    x: item.x,
    y: item.y,
    w: item.w,
    h: item.h,
    data: widget
  })

  showToast(`已添加 "${widget.name}"`, 'success')
}

/**
 * 布局变化
 */
function handleLayoutChange(items: GridItemOptions[]) {
  // 更新 gridItems
  gridItems.value = items.map(item => ({
    ...item,
    data: gridItems.value.find(gi => gi.id === item.id)?.data
  }))
}

/**
 * 删除项目
 */
function removeItem(id: string) {
  const index = gridItems.value.findIndex(item => item.id === id)
  if (index !== -1) {
    const item = gridItems.value[index]
    gridItems.value.splice(index, 1)
    
    // 从 Grid 中移除
    if (gridRef.value?.gridInstance) {
      gridRef.value.gridInstance.removeItem(id)
    }
    
    showToast(`已删除 "${item.data?.name}"`, 'info')
  }
}

/**
 * 清空网格
 */
function clearGrid() {
  if (confirm('确定要清空所有项目吗？')) {
    gridItems.value = []
    if (gridRef.value?.gridInstance) {
      gridRef.value.gridInstance.clear()
    }
    showToast('已清空网格', 'info')
  }
}

/**
 * 保存布局
 */
function saveLayout() {
  if (gridRef.value?.gridInstance) {
    const layout = gridRef.value.gridInstance.save()
    localStorage.setItem('grid-layout', JSON.stringify(layout))
    showToast('布局已保存', 'success')
  }
}

/**
 * 加载布局
 */
function loadLayout() {
  const saved = localStorage.getItem('grid-layout')
  if (saved) {
    try {
      const layout = JSON.parse(saved)
      if (gridRef.value?.gridInstance) {
        gridRef.value.gridInstance.load(layout)
        gridItems.value = layout.items
        showToast('布局已加载', 'success')
      }
    } catch (e) {
      showToast('加载布局失败', 'error')
    }
  } else {
    showToast('没有保存的布局', 'info')
  }
}

/**
 * 显示 Toast
 */
function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  toast.message = message
  toast.type = type
  toast.show = true
  
  setTimeout(() => {
    toast.show = false
  }, 3000)
}
</script>

<style scoped>
.external-drag-demo {
  padding: 20px;
  min-height: 100vh;
  background: #f5f5f5;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.demo-container {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 组件工具箱 */
.component-toolbox {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: fit-content;
  position: sticky;
  top: 20px;
}

.component-toolbox h2 {
  margin: 0 0 10px;
  font-size: 18px;
  color: #333;
}

.hint {
  margin: 0 0 15px;
  font-size: 13px;
  color: #666;
}

.components-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.widget-item {
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: grab;
}

.widget-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.widget-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.widget-info {
  flex: 1;
  min-width: 0;
}

.widget-name {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.widget-desc {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

/* Grid 容器 */
.grid-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 600px;
  position: relative;
}

.grid-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.grid-header h2 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.grid-controls {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #4285f4;
  color: white;
}

.btn-primary:hover {
  background: #3367d6;
}

.btn-secondary {
  background: #f1f3f4;
  color: #333;
}

.btn-secondary:hover {
  background: #e8eaed;
}

/* Grid 项目 */
.grid-item-content {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.grid-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f9f9f9;
  border-bottom: 1px solid #e0e0e0;
}

.grid-item-icon {
  font-size: 20px;
}

.grid-item-title {
  flex: 1;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.grid-item-remove {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: #999;
  font-size: 20px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.grid-item-remove:hover {
  background: #fee;
  color: #d32f2f;
}

.grid-item-body {
  padding: 16px;
  color: #666;
  font-size: 13px;
  flex: 1;
}

/* 空状态 */
.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #999;
  pointer-events: none;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 14px;
}

/* Toast */
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 4px;
  color: white;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10000;
}

.toast-success {
  background: #4caf50;
}

.toast-error {
  background: #f44336;
}

.toast-info {
  background: #2196f3;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

/* 响应式 */
@media (max-width: 1024px) {
  .demo-container {
    grid-template-columns: 1fr;
  }

  .component-toolbox {
    position: static;
  }

  .components-list {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .widget-item {
    flex: 1;
    min-width: 150px;
  }
}
</style>

