# @ldesign/grid 中文文档

> 功能强大、高性能的 GridStack 封装库，支持 Vue 3、React、Lit 和原生 JavaScript

## 🌟 特性

- ✨ **框架无关** - 支持 Vue 3、React、Lit 或原生 JavaScript
- 🎯 **外部拖拽** - 完美支持从外部拖拽组件到网格
- 🔄 **嵌套网格** - 支持多层嵌套网格布局
- ⚡ **高性能** - 虚拟滚动优化，支持 100+ 项目
- 🎨 **丰富配置** - 广泛的自定义选项
- 📱 **响应式** - 内置响应式布局管理
- 💾 **序列化** - 轻松保存和恢复布局
- 🎭 **预设布局** - 包含常用布局模板
- ♿ **无障碍** - WCAG 2.1 兼容，完整 ARIA 支持
- ⌨️ **键盘导航** - 完整的键盘操作支持
- 📱 **触摸支持** - 移动设备拖拽优化

## 📦 安装

```bash
npm install @ldesign/grid
# 或
pnpm add @ldesign/grid
# 或
yarn add @ldesign/grid
```

还需要安装 GridStack CSS：

```css
@import 'gridstack/dist/gridstack.min.css';
```

## 🚀 快速开始

### Vue 3

#### 基础使用

```vue
<template>
  <GridStack :options="{ column: 12, cellHeight: 70 }">
    <GridItem 
      v-for="item in items"
      :key="item.id"
      v-bind="item"
    >
      {{ item.content }}
    </GridItem>
  </GridStack>
</template>

<script setup>
import { GridStack, GridItem } from '@ldesign/grid/vue'
import '@ldesign/grid/style.css'

const items = ref([
  { id: '1', x: 0, y: 0, w: 2, h: 2, content: '项目 1' },
  { id: '2', x: 2, y: 0, w: 4, h: 3, content: '项目 2' }
])
</script>
```

#### 外部拖拽 (重点功能)

```vue
<template>
  <div class="app">
    <!-- 外部组件工具箱 -->
    <div class="toolbox">
      <GridDragSource
        v-for="widget in widgets"
        :key="widget.id"
        :data="widget"
        :item-options="{ w: widget.w, h: widget.h }"
        @dragstart="handleDragStart"
        @dropped="handleDropped"
      >
        <div class="widget">
          {{ widget.icon }} {{ widget.name }}
        </div>
      </GridDragSource>
    </div>

    <!-- Grid 网格 -->
    <GridStack 
      :options="gridOptions"
      @dropped="handleItemDropped"
    >
      <GridItem
        v-for="item in gridItems"
        :key="item.id"
        v-bind="item"
      >
        {{ item.data.name }}
      </GridItem>
    </GridStack>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { GridStack, GridItem, GridDragSource } from '@ldesign/grid/vue'

// 可拖拽的组件
const widgets = ref([
  { id: 'chart', name: '图表', icon: '📊', w: 4, h: 3 },
  { id: 'table', name: '表格', icon: '📋', w: 6, h: 4 },
  { id: 'kpi', name: 'KPI', icon: '📈', w: 3, h: 2 }
])

// 网格配置
const gridOptions = {
  column: 12,
  cellHeight: 80,
  acceptWidgets: true,
  animate: true
}

// 网格项目
const gridItems = ref([])

// 处理拖拽到网格
function handleItemDropped(event) {
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
</script>

<style scoped>
.app {
  display: flex;
  gap: 20px;
}

.toolbox {
  width: 250px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.widget {
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
  cursor: grab;
  transition: all 0.2s;
}

.widget:hover {
  background: #e3f2fd;
  transform: translateY(-2px);
}
</style>
```

### React

#### 基础使用

```tsx
import { GridStack, GridItem } from '@ldesign/grid/react'
import '@ldesign/grid/style.css'

function App() {
  const items = [
    { id: '1', x: 0, y: 0, w: 2, h: 2, content: '项目 1' },
    { id: '2', x: 2, y: 0, w: 4, h: 3, content: '项目 2' }
  ]

  return (
    <GridStack options={{ column: 12, cellHeight: 70 }}>
      {items.map(item => (
        <GridItem key={item.id} {...item}>
          {item.content}
        </GridItem>
      ))}
    </GridStack>
  )
}
```

#### 外部拖拽

```tsx
import { useState } from 'react'
import { GridStack, GridItem, GridDragSource } from '@ldesign/grid/react'

function App() {
  const widgets = [
    { id: 'chart', name: '图表', icon: '📊', w: 4, h: 3 },
    { id: 'table', name: '表格', icon: '📋', w: 6, h: 4 }
  ]

  const [gridItems, setGridItems] = useState([])

  const handleDropped = (event) => {
    const { item, data } = event.detail
    setGridItems([...gridItems, {
      id: item.id,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      data: data.data
    }])
  }

  return (
    <div className="app">
      {/* 工具箱 */}
      <div className="toolbox">
        {widgets.map(widget => (
          <GridDragSource
            key={widget.id}
            data={widget}
            itemOptions={{ w: widget.w, h: widget.h }}
          >
            {widget.icon} {widget.name}
          </GridDragSource>
        ))}
      </div>

      {/* Grid */}
      <GridStack 
        options={{ column: 12, cellHeight: 80 }}
        onDropped={handleDropped}
      >
        {gridItems.map(item => (
          <GridItem key={item.id} {...item}>
            {item.data.name}
          </GridItem>
        ))}
      </GridStack>
    </div>
  )
}
```

### 原生 JavaScript

```javascript
import { GridManager } from '@ldesign/grid'

const manager = GridManager.getInstance()
const grid = manager.create(document.getElementById('grid'), {
  column: 12,
  cellHeight: 70,
  acceptWidgets: true
})

// 添加项目
const element = document.createElement('div')
element.textContent = '项目内容'
grid.addItem(element, { x: 0, y: 0, w: 2, h: 2 })
```

## 📚 核心功能

### 1. 撤销/重做

```javascript
// 启用历史管理
const grid = manager.create(container, {
  history: { enabled: true, maxSize: 50 }
})

// 使用快捷键
// Ctrl+Z: 撤销
// Ctrl+Y 或 Ctrl+Shift+Z: 重做

// 或编程方式
const historyManager = grid.getHistoryManager()
historyManager.undo()
historyManager.redo()
```

### 2. 键盘导航

```javascript
// 自动启用，支持以下按键：
// - 方向键: 移动焦点
// - Tab: 下一项
// - Shift+Tab: 上一项
// - Delete: 删除
// - Ctrl+C: 复制
// - Ctrl+V: 粘贴
// - Ctrl+A: 全选
```

### 3. 多选操作

```javascript
const selectionManager = grid.getSelectionManager()

// 选择项目
selectionManager.select(item)

// 获取选中项
const selected = selectionManager.getSelectedItems()

// 批量删除
selectionManager.removeSelected()

// 对齐
selectionManager.alignSelected('left')
selectionManager.distributeSelected('horizontal')
```

### 4. 自动布局

```javascript
const layoutEngine = grid.getLayoutEngine()

// 应用自动布局
layoutEngine.autoLayout('compact')  // 紧凑布局
layoutEngine.autoLayout('flow')     // 流式布局
layoutEngine.autoLayout('grid')     // 网格布局
layoutEngine.autoLayout('masonry')  // 瀑布流
layoutEngine.autoLayout('columns')  // 列布局
```

### 5. 动画效果

```javascript
const animationManager = grid.getAnimationManager()

// 添加项目时的动画
await animationManager.animateAdd(item, 'fade')
await animationManager.animateAdd(item, 'slide')
await animationManager.animateAdd(item, 'scale')

// 移除项目时的动画
await animationManager.animateRemove(item, 'fade')

// Pulse 动画
await animationManager.pulse(item, 3) // 脉动 3 次
```

### 6. 无障碍访问

```javascript
// 自动启用 ARIA 支持
const a11yManager = grid.getAccessibilityManager()

// 启用高对比度
a11yManager.enableHighContrast()

// 手动公告
a11yManager.announce('项目已添加', 'polite')
```

### 7. 虚拟滚动

```javascript
// 大型网格自动启用
const grid = manager.create(container, {
  performance: {
    virtualScroll: true,    // 启用虚拟滚动
    overscan: 2,            // 视口外渲染项数
    itemThreshold: 50       // 启用阈值
  }
})
```

## 🎨 配置选项

### GridOptions

```typescript
interface GridOptions {
  // 基础配置
  column?: number                // 列数 (默认: 12)
  cellHeight?: number            // 单元格高度 (默认: 70)
  acceptWidgets?: boolean        // 接受外部拖拽 (默认: true)
  float?: boolean                // 浮动模式 (默认: true)
  animate?: boolean              // 动画效果 (默认: true)
  
  // 嵌套网格
  nested?: {
    enabled: boolean
    maxDepth?: number            // 最大深度 (默认: 3)
  }
  
  // 性能优化
  performance?: {
    virtualScroll?: boolean      // 虚拟滚动
    batchUpdate?: boolean        // 批量更新
    lazyRender?: boolean         // 延迟渲染
  }
  
  // 拖拽选项
  dragOptions?: {
    handle?: string              // 拖拽手柄选择器
    cancel?: string              // 禁止拖拽选择器
  }
}
```

### GridItemOptions

```typescript
interface GridItemOptions {
  id?: string                    // 唯一标识
  x?: number                     // X 位置
  y?: number                     // Y 位置
  w?: number                     // 宽度
  h?: number                     // 高度
  minW?: number                  // 最小宽度
  maxW?: number                  // 最大宽度
  minH?: number                  // 最小高度
  maxH?: number                  // 最大高度
  locked?: boolean               // 锁定
  noResize?: boolean             // 禁止调整大小
  noMove?: boolean               // 禁止移动
  content?: string | HTMLElement // 内容
  data?: any                     // 自定义数据
}
```

## 🎯 高级用法

### 保存和加载布局

```javascript
// 保存布局
const layout = grid.save()
localStorage.setItem('my-layout', JSON.stringify(layout))

// 加载布局
const savedLayout = JSON.parse(localStorage.getItem('my-layout'))
grid.load(savedLayout)
```

### 响应式布局

```javascript
const grid = manager.create(container, {
  column: 12,
  cellHeight: 70,
  responsive: {
    breakpoints: [
      { name: 'mobile', minWidth: 0, columns: 1 },
      { name: 'tablet', minWidth: 768, columns: 4 },
      { name: 'desktop', minWidth: 1200, columns: 12 }
    ]
  }
})
```

### 事件监听

```vue
<GridStack
  @added="handleAdded"
  @removed="handleRemoved"
  @change="handleChange"
  @dragstart="handleDragStart"
  @dragstop="handleDragStop"
  @dropped="handleDropped"
>
</GridStack>
```

## 📖 API 文档

详细 API 文档请参阅：
- [核心 API](./api/core.md)
- [Vue 适配器](./api/vue.md)
- [React 适配器](./api/react.md)
- [Lit 适配器](./api/lit.md)

## 🎓 指南

- [撤销/重做](../guide/undo-redo.md)
- [键盘导航](../guide/keyboard-navigation.md)
- [无障碍访问](../guide/accessibility.md)
- [高级布局](../guide/advanced-layouts.md)
- [性能优化](../guide/performance.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可

MIT License

## 🙏 致谢

基于 [GridStack.js](https://gridstackjs.com/) 构建

