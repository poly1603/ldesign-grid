# @ldesign/grid

高性能、功能丰富的网格布局插件，类似 gridstack.js 但具有更好的架构和用户体验。

## ✨ 特性

- 🚀 **高性能** - 优化的布局算法和DOM操作
- 📦 **框架无关** - 核心包可独立使用
- 🎯 **Vue 3 支持** - 提供完整的Vue适配器
- 🖱️ **拖拽 & 调整大小** - 流畅的交互体验
- 📥 **外部拖入** - 支持从网格外部拖入元素
- 📱 **触摸支持** - 完整的移动端支持
- 🎨 **可定制** - 丰富的配置选项和样式
- 💪 **TypeScript** - 完整的类型定义

## 📦 安装

```bash
# 核心包
pnpm add @ldesign/grid-core

# Vue 3 适配器
pnpm add @ldesign/grid-vue
```

## 🚀 快速开始

### 原生 JavaScript

```typescript
import { Grid } from '@ldesign/grid-core';
import '@ldesign/grid-core/css';

const grid = new Grid('#container', {
  column: 12,
  cellHeight: 80,
  gap: 10,
  draggable: true,
  resizable: true,
});

// 添加项目
grid.addWidget({ x: 0, y: 0, w: 2, h: 2, content: '<h3>Widget 1</h3>' });
grid.addWidget({ w: 3, h: 1, autoPosition: true });

// 保存/加载布局
const layout = grid.save();
grid.load(layout);
```

### Vue 3

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { GridStack, useGrid } from '@ldesign/grid-vue';

const items = ref([
  { id: '1', x: 0, y: 0, w: 2, h: 2, content: 'Widget 1' },
  { id: '2', x: 2, y: 0, w: 3, h: 1, content: 'Widget 2' },
]);

// 或使用 composable
const { containerRef, addWidget, removeWidget, save, load } = useGrid({
  column: 12,
  cellHeight: 80,
  items: items.value,
});
</script>

<template>
  <GridStack v-model="items" :column="12" :cell-height="80">
    <template #default="{ items }">
      <div v-for="item in items" :key="item.id">
        {{ item.content }}
      </div>
    </template>
  </GridStack>
</template>
```

## 📖 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `column` | `number` | `12` | 列数 |
| `cellHeight` | `number \| 'auto'` | `80` | 单元格高度 |
| `gap` | `number` | `10` | 项目间距 |
| `margin` | `number \| Margin` | `10` | 网格边距 |
| `draggable` | `boolean` | `true` | 启用拖拽 |
| `resizable` | `boolean` | `true` | 启用调整大小 |
| `animate` | `boolean \| AnimationConfig` | `true` | 启用动画 |
| `float` | `boolean` | `false` | 浮动模式 |
| `compact` | `boolean` | `true` | 自动压缩 |
| `collision` | `'push' \| 'swap' \| 'none'` | `'push'` | 碰撞处理模式 |
| `acceptWidgets` | `boolean \| string` | `false` | 接受外部拖入 |
| `touch` | `boolean` | `true` | 触摸支持 |

## 🔧 API

### Grid 方法

```typescript
// 添加项目
grid.addWidget(data: Partial<GridItemData>): GridItem;
grid.addWidgets(items: Partial<GridItemData>[]): GridItem[];

// 移除项目
grid.removeWidget(id: ItemId): boolean;
grid.removeAll(): void;

// 更新项目
grid.updateWidget(id: ItemId, updates: Partial<GridItemData>): boolean;
grid.moveWidget(id: ItemId, x: number, y: number): boolean;
grid.resizeWidget(id: ItemId, w: number, h: number): boolean;

// 布局操作
grid.compact(): void;
grid.save(): GridItemData[];
grid.load(items: GridItemData[]): void;

// 状态控制
grid.enable(): void;
grid.disable(): void;
grid.setOptions(options: Partial<GridOptions>): void;

// 事件
grid.on(event: string, handler: Function): () => void;
grid.off(event: string, handler: Function): void;
```

### 事件

| 事件 | 说明 |
|------|------|
| `change` | 布局变更 |
| `dragstart` | 开始拖拽 |
| `drag` | 拖拽中 |
| `dragend` | 结束拖拽 |
| `resizestart` | 开始调整大小 |
| `resize` | 调整大小中 |
| `resizeend` | 结束调整大小 |
| `added` | 添加项目 |
| `removed` | 移除项目 |
| `dropped` | 外部拖入 |

## 🎨 样式定制

```css
/* 自定义项目样式 */
.grid-item-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  padding: 16px;
}

/* 自定义占位符 */
.grid-placeholder {
  background: rgba(0, 120, 255, 0.1);
  border: 2px dashed rgba(0, 120, 255, 0.4);
}

/* 暗色主题 */
.grid-container.dark .grid-item-content {
  background: #1e1e1e;
  color: #fff;
}
```

## 📁 项目结构

```
packages/
├── core/                 # 核心包 (框架无关)
│   └── src/
│       ├── types/        # 类型定义
│       ├── utils/        # 工具函数
│       ├── engine/       # 布局引擎
│       ├── handlers/     # 拖拽/调整大小处理器
│       ├── core/         # Grid主类
│       └── styles/       # CSS样式
│
└── vue/                  # Vue 3 适配器
    └── src/
        ├── components/   # Vue组件
        ├── composables/  # Vue composables
        └── types.ts      # 类型定义
```

## 📄 License

MIT
