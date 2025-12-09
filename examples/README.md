# Grid 示例项目

这是一个完整的网格布局示例项目，展示了如何使用 Grid 组件。

## 项目结构

```
examples/
├── src/
│   ├── assets/
│   │   └── styles.css          # 全局样式
│   ├── utils/
│   │   └── grid.ts             # Grid 核心实现（示例用）
│   ├── views/
│   │   ├── js/                 # 原生 JS 示例
│   │   │   ├── Basic.vue       # 基础网格
│   │   │   ├── Resize.vue      # 调整大小
│   │   │   ├── External.vue    # 外部拖入
│   │   │   ├── TwoGrids.vue    # 多个网格
│   │   │   ├── Float.vue       # 浮动模式
│   │   │   ├── Static.vue      # 静态网格
│   │   │   ├── Serialization.vue # 序列化
│   │   │   ├── Events.vue      # 事件系统
│   │   │   ├── Api.vue         # API 操作
│   │   │   └── Dashboard.vue   # 仪表盘
│   │   └── vue/                # Vue 组件示例（与 JS 版本相同）
│   ├── App.vue                 # 主应用
│   └── main.ts                 # 入口文件
└── package.json
```

## 运行项目

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 示例说明

### 1. 基础网格 (Basic)
- 拖拽移动组件
- 拖拽右下角调整大小
- 自动紧凑排列
- 避免组件重叠

### 2. 调整大小 (Resize)
- 支持 min/max 尺寸约束
- 实时调整其他组件位置
- 多方向调整

### 3. 外部拖入 (External)
- 从组件库拖入新组件
- 自动计算放置位置
- 拖拽辅助提示

### 4. 多个网格 (TwoGrids)
- 同一页面多个独立网格
- 各自独立配置
- 互不干扰

### 5. 浮动模式 (Float)
- 允许组件间存在空隙
- 动态切换浮动/紧凑模式
- 保持组件位置

### 6. 静态网格 (Static)
- 锁定整个网格
- 锁定单个组件
- 动态启用/禁用

### 7. 序列化 (Serialization)
- 保存布局到 JSON
- 从 JSON 加载布局
- localStorage 持久化

### 8. 事件系统 (Events)
- 监听拖拽事件
- 监听布局变化
- 事件日志展示

### 9. API 操作 (Api)
- 动态修改列数
- 动态修改行高
- 紧凑布局
- 添加/删除组件

### 10. 仪表盘 (Dashboard)
- 完整仪表盘示例
- 统计卡片
- 图表组件
- 活动列表
- 数据表格
- 进度条

## 核心功能

### Grid 类

```typescript
import { Grid } from './utils/grid';

// 创建网格
const grid = new Grid(container, {
  column: 12,        // 列数
  cellHeight: 80,    // 行高
  gap: 10,           // 间距
  margin: 10,        // 边距
  float: false,      // 浮动模式
  animate: true,     // 动画
  staticGrid: false, // 静态网格
});

// 添加组件
grid.addWidget({
  x: 0, y: 0,        // 位置
  w: 4, h: 2,        // 尺寸
  minW: 2, maxW: 6,  // 约束
  minH: 1, maxH: 4,
  static: false,     // 是否静态
  content: '<div>内容</div>',
});

// 配置方法
grid.setColumn(8);
grid.setCellHeight(100);
grid.setFloat(true);
grid.setStatic(true);

// 数据方法
const items = grid.getItems();
const layout = grid.save();
grid.load(savedLayout);
grid.compact();

// 事件监听
grid.onChange((items) => {
  console.log('布局变化:', items);
});

grid.on('dragstart', (data) => {
  console.log('开始拖拽:', data.item);
});

grid.on('dragend', (data) => {
  console.log('结束拖拽:', data.item);
});

// 销毁
grid.destroy();
```

## 交互特性

- ✅ 平滑的拖拽和调整大小
- ✅ 实时布局调整（拖拽/调整大小时其他组件实时移动）
- ✅ 智能碰撞检测和组件推动
- ✅ 自动紧凑布局
- ✅ ESC 键取消操作
- ✅ 触摸屏支持
- ✅ 响应式设计
- ✅ 性能优化（requestAnimationFrame）

## 注意事项

1. **示例代码说明**：
   - `examples/src/utils/grid.ts` 是为示例项目编写的简化版实现
   - 实际项目应该从 `@ldesign/grid-core` 和 `@ldesign/grid-vue` 包中引入
   - 示例项目不应包含功能实现，只负责演示如何使用

2. **包引用**：
   ```typescript
   // 正确的引用方式（实际项目）
   import { Grid } from '@ldesign/grid-core';
   import { GridStack, useGrid } from '@ldesign/grid-vue';
   
   // 示例项目的引用方式（仅用于演示）
   import { Grid } from '../../utils/grid';
   ```

3. **样式**：
   - 全局样式在 `src/assets/styles.css`
   - Grid 相关样式已包含在全局样式中
   - 组件可以使用 scoped 样式进行定制

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 技术栈

- Vue 3
- TypeScript
- Vite
- Vue Router
- Lucide Icons
