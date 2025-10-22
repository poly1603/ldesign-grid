# 外部拖拽完整指南

本指南详细介绍如何使用 `@ldesign/grid` 的外部拖拽功能，构建强大的拖放界面。

## 概述

外部拖拽允许你从 GridStack 外部的任何位置拖拽元素到网格中。这对于构建以下场景非常有用：

- 📊 Dashboard 构建器
- 🎨 可视化设计工具
- 📝 页面编辑器
- 🧩 组件库面板

## Vue 3 实现

### 基础示例

```vue
<template>
  <div class="container">
    <!-- 左侧工具箱 -->
    <div class="toolbox">
      <h3>组件库</h3>
      <GridDragSource
        v-for="widget in widgets"
        :key="widget.id"
        :data="widget"
        :item-options="{ w: widget.w, h: widget.h }"
      >
        {{ widget.name }}
      </GridDragSource>
    </div>

    <!-- 右侧网格 -->
    <GridStack 
      :options="gridOptions"
      @dropped="handleDropped"
    >
      <GridItem
        v-for="item in items"
        :key="item.id"
        v-bind="item"
      >
        {{ item.content }}
      </GridItem>
    </GridStack>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { GridStack, GridItem, GridDragSource } from '@ldesign/grid/vue'

const widgets = ref([
  { id: 1, name: '图表', w: 4, h: 3 },
  { id: 2, name: '表格', w: 6, h: 4 },
  { id: 3, name: 'KPI卡片', w: 3, h: 2 }
])

const gridOptions = {
  column: 12,
  cellHeight: 70,
  acceptWidgets: true  // 重要：启用接受外部拖拽
}

const items = ref([])

function handleDropped(event) {
  const { item, data } = event.detail
  
  items.value.push({
    id: item.id,
    x: item.x,
    y: item.y,
    w: item.w,
    h: item.h,
    content: data.data.name
  })
}
</script>
```

### 高级功能

#### 1. 自定义拖拽预览

```vue
<GridDragSource
  :data="widget"
  :item-options="{ w: 4, h: 3 }"
  :preview="createPreview(widget)"
>
  {{ widget.name }}
</GridDragSource>

<script setup>
function createPreview(widget) {
  return `
    <div style="padding: 10px; background: #fff; border: 2px solid #4285f4;">
      ${widget.name}
    </div>
  `
}
</script>
```

#### 2. 禁用拖拽

```vue
<GridDragSource
  :data="widget"
  :disabled="!canDrag"
>
  {{ widget.name }}
</GridDragSource>
```

#### 3. 拖拽事件监听

```vue
<GridDragSource
  :data="widget"
  @dragstart="handleDragStart"
  @dragend="handleDragEnd"
  @dropped="handleWidgetDropped"
>
  {{ widget.name }}
</GridDragSource>

<script setup>
function handleDragStart(data) {
  console.log('开始拖拽:', data)
}

function handleDragEnd(data) {
  console.log('拖拽结束:', data)
}

function handleWidgetDropped(target, data) {
  console.log('成功放置到:', target)
}
</script>
```

#### 4. 作用域插槽

```vue
<GridDragSource :data="widget">
  <template #default="{ isDragging, isTouchDragging }">
    <div :class="{ dragging: isDragging }">
      {{ widget.name }}
      <span v-if="isDragging">拖拽中...</span>
    </div>
  </template>
</GridDragSource>
```

### 完整示例：Dashboard 构建器

```vue
<template>
  <div class="dashboard-builder">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <button @click="saveLayout">💾 保存</button>
      <button @click="loadLayout">📂 加载</button>
      <button @click="clearAll">🗑️ 清空</button>
    </div>

    <div class="builder-content">
      <!-- 左侧组件面板 -->
      <aside class="widget-panel">
        <h3>📦 组件库</h3>
        
        <div class="widget-category">
          <h4>📊 图表</h4>
          <GridDragSource
            v-for="chart in chartWidgets"
            :key="chart.id"
            :data="chart"
            :item-options="chart.gridOptions"
            class="widget-item"
          >
            <div class="widget-icon">{{ chart.icon }}</div>
            <div class="widget-name">{{ chart.name }}</div>
          </GridDragSource>
        </div>

        <div class="widget-category">
          <h4>📋 数据</h4>
          <GridDragSource
            v-for="data in dataWidgets"
            :key="data.id"
            :data="data"
            :item-options="data.gridOptions"
            class="widget-item"
          >
            <div class="widget-icon">{{ data.icon }}</div>
            <div class="widget-name">{{ data.name }}</div>
          </GridDragSource>
        </div>
      </aside>

      <!-- 主画布 -->
      <main class="canvas">
        <GridStack
          ref="gridRef"
          :options="gridOptions"
          @dropped="handleDropped"
          @change="handleChange"
        >
          <GridItem
            v-for="item in gridItems"
            :key="item.id"
            v-bind="item"
          >
            <div class="grid-item-wrapper">
              <div class="grid-item-header">
                <span>{{ item.data.icon }}</span>
                <span>{{ item.data.name }}</span>
                <button @click="removeItem(item.id)">×</button>
              </div>
              <div class="grid-item-body">
                <!-- 渲染实际组件 -->
                <component :is="item.data.component" v-bind="item.data.props" />
              </div>
            </div>
          </GridItem>
        </GridStack>

        <div v-if="gridItems.length === 0" class="empty-state">
          <div class="empty-icon">📦</div>
          <p>从左侧拖拽组件开始构建 Dashboard</p>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { GridStack, GridItem, GridDragSource } from '@ldesign/grid/vue'

// 图表组件
const chartWidgets = [
  { 
    id: 'line-chart',
    name: '折线图',
    icon: '📈',
    gridOptions: { w: 4, h: 3 },
    component: 'LineChart'
  },
  { 
    id: 'bar-chart',
    name: '柱状图',
    icon: '📊',
    gridOptions: { w: 4, h: 3 },
    component: 'BarChart'
  },
  { 
    id: 'pie-chart',
    name: '饼图',
    icon: '🥧',
    gridOptions: { w: 3, h: 3 },
    component: 'PieChart'
  }
]

// 数据组件
const dataWidgets = [
  { 
    id: 'table',
    name: '数据表格',
    icon: '📋',
    gridOptions: { w: 6, h: 4 },
    component: 'DataTable'
  },
  { 
    id: 'kpi',
    name: 'KPI卡片',
    icon: '💯',
    gridOptions: { w: 3, h: 2 },
    component: 'KPICard'
  }
]

const gridOptions = {
  column: 12,
  cellHeight: 80,
  acceptWidgets: true,
  animate: true,
  float: true
}

const gridItems = ref([])
const gridRef = ref()

function handleDropped(event) {
  const { item, data } = event.detail
  
  gridItems.value.push({
    id: item.id,
    x: item.x,
    y: item.y,
    w: item.w,
    h: item.h,
    data: data.data
  })
}

function handleChange(items) {
  // 同步网格变化
  gridItems.value = items.map(item => ({
    ...item,
    data: gridItems.value.find(gi => gi.id === item.id)?.data
  }))
}

function removeItem(id) {
  const index = gridItems.value.findIndex(item => item.id === id)
  if (index !== -1) {
    gridItems.value.splice(index, 1)
    gridRef.value.gridInstance.removeItem(id)
  }
}

function saveLayout() {
  const layout = gridRef.value.gridInstance.save()
  localStorage.setItem('dashboard-layout', JSON.stringify(layout))
  alert('布局已保存')
}

function loadLayout() {
  const saved = localStorage.getItem('dashboard-layout')
  if (saved) {
    const layout = JSON.parse(saved)
    gridRef.value.gridInstance.load(layout)
    gridItems.value = layout.items
    alert('布局已加载')
  }
}

function clearAll() {
  if (confirm('确定清空所有组件吗？')) {
    gridItems.value = []
    gridRef.value.gridInstance.clear()
  }
}
</script>

<style scoped>
.dashboard-builder {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.toolbar {
  padding: 15px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  gap: 10px;
}

.builder-content {
  flex: 1;
  display: grid;
  grid-template-columns: 280px 1fr;
  overflow: hidden;
}

.widget-panel {
  background: #f5f5f5;
  padding: 20px;
  overflow-y: auto;
}

.widget-category {
  margin-bottom: 24px;
}

.widget-category h4 {
  margin: 0 0 12px;
  font-size: 14px;
  color: #666;
}

.widget-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: white;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: grab;
}

.widget-item:active {
  cursor: grabbing;
}

.widget-icon {
  font-size: 20px;
}

.widget-name {
  font-size: 14px;
  color: #333;
}

.canvas {
  background: #fafafa;
  padding: 20px;
  overflow: auto;
  position: relative;
}

.grid-item-wrapper {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.grid-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
}

.grid-item-header button {
  margin-left: auto;
  border: none;
  background: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
}

.grid-item-header button:hover {
  color: #d32f2f;
}

.grid-item-body {
  flex: 1;
  padding: 16px;
  overflow: auto;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #999;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}
</style>
```

## React 实现

### 基础示例

```tsx
import { useState } from 'react'
import { GridStack, GridItem, GridDragSource } from '@ldesign/grid/react'

function App() {
  const widgets = [
    { id: 1, name: '图表', w: 4, h: 3 },
    { id: 2, name: '表格', w: 6, h: 4 }
  ]

  const [items, setItems] = useState([])

  const handleDropped = (event) => {
    const { item, data } = event.detail
    setItems([...items, {
      id: item.id,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      content: data.data.name
    }])
  }

  return (
    <div className="container">
      {/* 工具箱 */}
      <div className="toolbox">
        {widgets.map(widget => (
          <GridDragSource
            key={widget.id}
            data={widget}
            itemOptions={{ w: widget.w, h: widget.h }}
          >
            {widget.name}
          </GridDragSource>
        ))}
      </div>

      {/* Grid */}
      <GridStack 
        options={{ column: 12, cellHeight: 70, acceptWidgets: true }}
        onDropped={handleDropped}
      >
        {items.map(item => (
          <GridItem key={item.id} {...item}>
            {item.content}
          </GridItem>
        ))}
      </GridStack>
    </div>
  )
}
```

### 函数式 Children

```tsx
<GridDragSource data={widget}>
  {({ isDragging, isTouchDragging, isInsideGrid }) => (
    <div className={isDragging ? 'dragging' : ''}>
      {widget.name}
      {isTouchDragging && <span>触摸拖拽中...</span>}
    </div>
  )}
</GridDragSource>
```

## 最佳实践

### 1. 性能优化

```vue
<!-- 使用 v-memo 优化大型列表 -->
<GridDragSource
  v-for="widget in widgets"
  v-memo="[widget.id]"
  :key="widget.id"
  :data="widget"
>
  {{ widget.name }}
</GridDragSource>
```

### 2. 数据持久化

```javascript
// 保存布局
function saveLayout() {
  const layout = grid.save()
  // 保存到后端
  await api.saveLayout(layout)
  // 或保存到本地
  localStorage.setItem('layout', JSON.stringify(layout))
}

// 加载布局
async function loadLayout() {
  const layout = await api.loadLayout()
  grid.load(layout)
}
```

### 3. 拖拽验证

```javascript
// 验证是否可以放置
function handleDropped(event) {
  const { item, data } = event.detail
  
  // 验证逻辑
  if (!canPlaceWidget(data.data)) {
    // 移除刚添加的项目
    grid.removeItem(item.id)
    showError('无法放置此组件')
    return
  }
  
  // 继续处理...
}
```

### 4. 触摸设备优化

```css
/* 增加触摸目标大小 */
.grid-drag-source {
  min-height: 44px;  /* iOS 推荐的最小触摸目标 */
  padding: 12px;
}

/* 触摸反馈 */
@media (hover: none) and (pointer: coarse) {
  .grid-drag-source:active {
    background-color: rgba(0, 0, 0, 0.1);
  }
}
```

## 故障排除

### 问题：拖拽不工作

**解决方案**:
1. 确保 `acceptWidgets: true`
2. 检查 CSS 是否正确引入
3. 验证数据格式正确

### 问题：触摸设备拖拽不响应

**解决方案**:
1. 确保使用最新版本
2. 检查是否有 `touch-action` CSS 冲突
3. 验证是否有其他事件监听器阻止

### 问题：拖拽后位置不正确

**解决方案**:
1. 检查 `autoPosition` 设置
2. 验证 `column` 配置
3. 确认 `cellHeight` 正确

## 相关资源

- [API 参考](../api/core.md)
- [性能优化](./performance.md)
- [示例代码](../../examples/)

