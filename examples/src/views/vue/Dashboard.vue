<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Grid } from '../../utils/grid';
import { LayoutGrid, TrendingUp, Users, DollarSign, Activity, Code } from 'lucide-vue-next';

const containerRef = ref<HTMLElement | null>(null);
let grid: Grid | null = null;
const showCode = ref(false);

const code = `// 仪表盘示例
const grid = new Grid(container, {
  column: 12,
  cellHeight: 80,
});

// 添加统计卡片
grid.addWidget({ x: 0, y: 0, w: 3, h: 1, content: statCard });

// 添加图表
grid.addWidget({ x: 0, y: 1, w: 6, h: 3, content: chartWidget });

// 添加活动列表
grid.addWidget({ x: 6, y: 1, w: 6, h: 3, content: activityList });`;

onMounted(() => {
  if (!containerRef.value) return;
  grid = new Grid(containerRef.value, { column: 12, cellHeight: 80, gap: 10, margin: 10 });
  
  grid.addWidget({ x: 0, y: 0, w: 3, h: 1, content: '<div class="stat-card"><div class="stat-icon" style="background:#3b82f6"><svg width="20" height="20" fill="white"><rect width="20" height="20" rx="2"/></svg></div><div class="stat-info"><div class="stat-value">2,543</div><div class="stat-label">总用户</div></div></div>' });
  grid.addWidget({ x: 3, y: 0, w: 3, h: 1, content: '<div class="stat-card"><div class="stat-icon" style="background:#10b981"><svg width="20" height="20" fill="white"><circle cx="10" cy="10" r="8"/></svg></div><div class="stat-info"><div class="stat-value">$12,345</div><div class="stat-label">总收入</div></div></div>' });
  grid.addWidget({ x: 6, y: 0, w: 3, h: 1, content: '<div class="stat-card"><div class="stat-icon" style="background:#f59e0b"><svg width="20" height="20" fill="white"><polygon points="10,2 2,18 18,18"/></svg></div><div class="stat-info"><div class="stat-value">89%</div><div class="stat-label">活跃度</div></div></div>' });
  grid.addWidget({ x: 9, y: 0, w: 3, h: 1, content: '<div class="stat-card"><div class="stat-icon" style="background:#ef4444"><svg width="20" height="20" fill="white"><path d="M10 2 L18 10 L10 18 L2 10 Z"/></svg></div><div class="stat-info"><div class="stat-value">156</div><div class="stat-label">新订单</div></div></div>' });
  
  grid.addWidget({ x: 0, y: 1, w: 8, h: 3, content: '<div class="chart-widget"><div class="widget-title">销售趋势</div><div class="chart-placeholder"><svg viewBox="0 0 400 150" style="width:100%;height:100%"><polyline points="10,140 50,120 90,100 130,110 170,80 210,90 250,60 290,70 330,40 370,50" fill="none" stroke="#3b82f6" stroke-width="2"/><polyline points="10,140 50,120 90,100 130,110 170,80 210,90 250,60 290,70 330,40 370,50 370,150 10,150" fill="rgba(59,130,246,0.1)"/></svg></div></div>' });
  
  grid.addWidget({ x: 8, y: 1, w: 4, h: 3, content: '<div class="activity-widget"><div class="widget-title">最近活动</div><div class="activity-list"><div class="activity-item"><div class="activity-dot" style="background:#3b82f6"></div><div class="activity-content"><div class="activity-text">新用户注册</div><div class="activity-time">2分钟前</div></div></div><div class="activity-item"><div class="activity-dot" style="background:#10b981"></div><div class="activity-content"><div class="activity-text">订单完成</div><div class="activity-time">15分钟前</div></div></div><div class="activity-item"><div class="activity-dot" style="background:#f59e0b"></div><div class="activity-content"><div class="activity-text">系统更新</div><div class="activity-time">1小时前</div></div></div><div class="activity-item"><div class="activity-dot" style="background:#8b5cf6"></div><div class="activity-content"><div class="activity-text">数据备份</div><div class="activity-time">3小时前</div></div></div></div></div>' });
  
  grid.addWidget({ x: 0, y: 4, w: 6, h: 2, content: '<div class="table-widget"><div class="widget-title">热门产品</div><table class="mini-table"><tr><th>产品</th><th>销量</th><th>趋势</th></tr><tr><td>产品 A</td><td>1,234</td><td style="color:#10b981">↑ 12%</td></tr><tr><td>产品 B</td><td>987</td><td style="color:#10b981">↑ 8%</td></tr><tr><td>产品 C</td><td>756</td><td style="color:#ef4444">↓ 3%</td></tr></table></div>' });
  
  grid.addWidget({ x: 6, y: 4, w: 6, h: 2, content: '<div class="progress-widget"><div class="widget-title">目标进度</div><div class="progress-items"><div class="progress-item"><div class="progress-header"><span>月度目标</span><span>75%</span></div><div class="progress-bar"><div class="progress-fill" style="width:75%;background:#3b82f6"></div></div></div><div class="progress-item"><div class="progress-header"><span>季度目标</span><span>60%</span></div><div class="progress-bar"><div class="progress-fill" style="width:60%;background:#10b981"></div></div></div><div class="progress-item"><div class="progress-header"><span>年度目标</span><span>45%</span></div><div class="progress-bar"><div class="progress-fill" style="width:45%;background:#f59e0b"></div></div></div></div></div>' });
});

onUnmounted(() => grid?.destroy());
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">仪表盘</h1>
      <p class="page-description">完整的仪表盘示例，包含统计卡片、图表、活动列表等。</p>
    </div>
    <div class="toolbar">
      <button class="btn btn-secondary btn-sm" @click="showCode = !showCode"><Code :size="14" /> {{ showCode ? '隐藏' : '查看' }}代码</button>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title"><LayoutGrid :size="16" /> 仪表盘</span></div>
      <div class="card-body card-body-flush"><div ref="containerRef" style="min-height: 500px;"></div></div>
    </div>
    <div v-if="showCode" class="card">
      <div class="card-header"><span class="card-title"><Code :size="16" /> 代码示例</span></div>
      <div class="card-body"><div class="code-block"><pre>{{ code }}</pre></div></div>
    </div>
  </div>
</template>

<style scoped>
:deep(.stat-card) { display: flex; align-items: center; gap: 12px; height: 100%; padding: 12px; background: white; border-radius: 8px; }
:deep(.stat-icon) { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
:deep(.stat-info) { flex: 1; min-width: 0; }
:deep(.stat-value) { font-size: 20px; font-weight: 700; color: var(--color-text); line-height: 1.2; }
:deep(.stat-label) { font-size: 12px; color: var(--color-text-muted); margin-top: 2px; }
:deep(.chart-widget), :deep(.activity-widget), :deep(.table-widget), :deep(.progress-widget) { height: 100%; padding: 16px; background: white; border-radius: 8px; display: flex; flex-direction: column; }
:deep(.widget-title) { font-size: 14px; font-weight: 600; color: var(--color-text); margin-bottom: 12px; }
:deep(.chart-placeholder) { flex: 1; display: flex; align-items: center; justify-content: center; background: #f9fafb; border-radius: 6px; }
:deep(.activity-list) { flex: 1; overflow-y: auto; }
:deep(.activity-item) { display: flex; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--color-border); }
:deep(.activity-item:last-child) { border-bottom: none; }
:deep(.activity-dot) { width: 8px; height: 8px; border-radius: 50%; margin-top: 6px; flex-shrink: 0; }
:deep(.activity-content) { flex: 1; }
:deep(.activity-text) { font-size: 13px; color: var(--color-text-secondary); }
:deep(.activity-time) { font-size: 11px; color: var(--color-text-muted); margin-top: 2px; }
:deep(.mini-table) { width: 100%; font-size: 13px; }
:deep(.mini-table th) { text-align: left; padding: 8px 4px; color: var(--color-text-muted); font-weight: 500; border-bottom: 1px solid var(--color-border); }
:deep(.mini-table td) { padding: 8px 4px; color: var(--color-text-secondary); border-bottom: 1px solid var(--color-border); }
:deep(.progress-items) { flex: 1; display: flex; flex-direction: column; gap: 16px; }
:deep(.progress-item) { }
:deep(.progress-header) { display: flex; justify-content: space-between; font-size: 13px; color: var(--color-text-secondary); margin-bottom: 6px; }
:deep(.progress-bar) { height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
:deep(.progress-fill) { height: 100%; border-radius: 4px; transition: width 0.3s ease; }
</style>
