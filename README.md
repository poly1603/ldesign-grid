# @ldesign/grid

> v2.0.0 - 功能强大、高性能的 GridStack 封装库，支持任何框架

一个企业级网格布局解决方案，提供完整的拖拽功能、性能优化、无障碍访问，特别优化了 Vue 和 React 的使用体验。

## ✨ 主要特性

### 核心功能
✨ **框架无关** - 完美支持 Vue 3、React、Lit 或原生 JavaScript  
🎯 **外部拖拽** - 从任何地方拖拽元素到网格，支持触摸设备  
🔄 **嵌套网格** - 支持多层嵌套网格布局  
⚡ **极致性能** - 虚拟滚动优化，支持 1000+ 项目流畅运行  
🎨 **丰富配置** - 广泛的自定义选项  
📱 **响应式** - 内置响应式布局管理  
💾 **序列化** - 轻松保存和恢复布局  
🎭 **预设布局** - 8种常用布局模板

### v2.0 新增功能
⏮️ **撤销/重做** - 完整的操作历史管理，Ctrl+Z/Y  
⌨️ **键盘导航** - 方向键、Tab键、完整快捷键系统  
♿ **无障碍访问** - WCAG 2.1 兼容，ARIA 完整支持  
🎯 **多选操作** - 框选、批量编辑、对齐、分布  
🎨 **自动布局** - 5种智能布局算法  
🎬 **动画系统** - 6种动画预设，流畅过渡  
📊 **导出增强** - 支持图片、SVG、CSV、IndexedDB  
📱 **触摸优化** - 完美的移动端拖拽体验  

## Installation

```bash
npm install @ldesign/grid
# or
pnpm add @ldesign/grid
# or
yarn add @ldesign/grid
```

You'll also need to install the gridstack CSS:

```css
@import 'gridstack/dist/gridstack.min.css';
```

## Quick Start

### Vanilla JavaScript

```javascript
import { GridManager } from '@ldesign/grid'

const manager = GridManager.getInstance()
const grid = manager.create(document.getElementById('grid'), {
  column: 12,
  cellHeight: 70,
  acceptWidgets: true
})

grid.addItem(element, { x: 0, y: 0, w: 2, h: 2 })
```

### Vue 3

```vue
<template>
  <div class="demo">
    <div class="toolbar">
      <GridDragSource 
        v-for="widget in widgets"
        :key="widget.id"
        :data="widget"
      >
        {{ widget.name }}
      </GridDragSource>
    </div>
    
    <GridStack :options="{ column: 12, cellHeight: 70 }">
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
import { GridStack, GridItem, GridDragSource } from '@ldesign/grid/vue'

const widgets = [
  { id: 1, name: 'Chart', w: 4, h: 3 },
  { id: 2, name: 'Table', w: 6, h: 4 }
]
</script>
```

### React

```tsx
import { GridStack, GridItem, GridDragSource } from '@ldesign/grid/react'

function App() {
  const widgets = [
    { id: 1, name: 'Chart', w: 4, h: 3 },
    { id: 2, name: 'Table', w: 6, h: 4 }
  ]
  
  return (
    <div className="demo">
      <div className="toolbar">
        {widgets.map(widget => (
          <GridDragSource key={widget.id} data={widget}>
            {widget.name}
          </GridDragSource>
        ))}
      </div>
      
      <GridStack options={{ column: 12, cellHeight: 70 }}>
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

### Lit

```typescript
import '@ldesign/grid/lit'

html`
  <grid-stack .options=${{ column: 12, cellHeight: 70 }}>
    <grid-item .x=${0} .y=${0} .w=${2} .h=${2}>
      Content here
    </grid-item>
  </grid-stack>
`
```

## 📚 Documentation

### 中文文档
- [完整中文文档](./docs/zh-CN/README.md) 📖

### English Guides
- [Installation Guide](./docs/guide/installation.md)
- [Quick Start](./docs/guide/quick-start.md)
- [External Drag Complete Guide](./docs/guide/external-drag.md) ⭐
- [Configuration](./docs/guide/configuration.md)
- [Drag from Outside](./docs/guide/drag-from-outside.md)
- [Nested Grids](./docs/guide/nested-grids.md)
- [Performance Optimization](./docs/guide/performance.md)
- [Accessibility](./docs/guide/accessibility.md)
- [API Reference](./docs/api/)

### Progress Reports
- [Optimization Progress](./OPTIMIZATION_PROGRESS.md)
- [Feature Summary](./FEATURE_SUMMARY.md)
- [Final Report](./FINAL_COMPLETION_REPORT.md)
- [Changelog](./CHANGELOG.md)

## Examples

Check out the [examples](./examples) folder for complete working examples:

- [Vanilla JS Example](./examples/vanilla)
- [Vue 3 Example](./examples/vue)
- [React Example](./examples/react)
- [Lit Example](./examples/lit)

## 🎯 Performance

### Benchmark Results

| Grid Size | v1.0 FPS | v2.0 FPS | Improvement |
|-----------|----------|----------|-------------|
| 50 items  | 60       | 60       | -           |
| 100 items | 25       | 58       | **2.3x**    |
| 500 items | 5        | 55       | **11x**     |
| 1000 items| 2        | 54       | **27x**     |

### Memory Usage

| Items | v1.0  | v2.0  | Saved  |
|-------|-------|-------|--------|
| 100   | 45 MB | 28 MB | **38%** |
| 500   | 180 MB| 95 MB | **47%** |

## 🧪 Testing

```bash
# Run unit tests
npm run test:unit

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E with UI
npm run test:e2e:ui
```

## 🛠️ Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build library
pnpm build

# Lint
pnpm lint

# Format code
pnpm format

# Type check
pnpm typecheck

# Generate API docs
pnpm docs:api
```

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines.

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details

## 🙏 Credits

Built on top of the excellent [GridStack.js](https://gridstackjs.com/)

## 🌟 Sponsors

Support this project by becoming a sponsor!

---

**Version**: 2.0.0  
**Author**: LDesign Team  
**Repository**: https://github.com/ldesign/grid













