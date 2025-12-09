<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';
import { LayoutGrid, Code, Component, Move, Maximize2, Download, ArrowRightLeft, Layers, Lock, Save, Zap, Settings } from 'lucide-vue-next';

const route = useRoute();
const currentMode = computed(() => route.path.startsWith('/vue') ? 'vue' : 'js');

const demos = [
  { path: 'basic', name: '基础网格', icon: Move, desc: '拖拽移动和调整大小' },
  { path: 'resize', name: '调整大小', icon: Maximize2, desc: '多方向调整和约束' },
  { path: 'external', name: '外部拖入', icon: Download, desc: '从外部拖入组件' },
  { path: 'two-grids', name: '多个网格', icon: ArrowRightLeft, desc: '多个独立网格' },
  { path: 'float', name: '浮动模式', icon: Layers, desc: '允许空隙的布局' },
  { path: 'static', name: '静态网格', icon: Lock, desc: '锁定网格或组件' },
  { path: 'serialization', name: '序列化', icon: Save, desc: '保存和加载布局' },
  { path: 'events', name: '事件系统', icon: Zap, desc: '监听网格事件' },
  { path: 'api', name: 'API 操作', icon: Settings, desc: '动态配置和方法' },
  { path: 'dashboard', name: '仪表盘', icon: LayoutGrid, desc: '完整仪表盘示例' },
];
</script>

<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <RouterLink to="/" class="sidebar-logo">
          <div class="sidebar-logo-icon">
            <LayoutGrid :size="20" />
          </div>
          <div>
            <div class="sidebar-logo-text">LDesign Grid</div>
            <div class="sidebar-logo-version">v0.1.0</div>
          </div>
        </RouterLink>
      </div>
      
      <!-- 一级菜单：原生JS / Vue组件 -->
      <div class="mode-tabs">
        <RouterLink 
          :to="`/js/${route.path.split('/')[2] || 'basic'}`" 
          class="mode-tab" 
          :class="{ active: currentMode === 'js' }"
        >
          <Code :size="16" />
          原生 JS
        </RouterLink>
        <RouterLink 
          :to="`/vue/${route.path.split('/')[2] || 'basic'}`" 
          class="mode-tab"
          :class="{ active: currentMode === 'vue' }"
        >
          <Component :size="16" />
          Vue 组件
        </RouterLink>
      </div>
      
      <nav class="sidebar-nav">
        <div class="nav-group">
          <div class="nav-group-title">示例列表</div>
          <RouterLink 
            v-for="demo in demos" 
            :key="demo.path"
            :to="`/${currentMode}/${demo.path}`" 
            class="nav-item"
          >
            <component :is="demo.icon" class="nav-item-icon" :size="18" />
            <div class="nav-item-content">
              <div class="nav-item-name">{{ demo.name }}</div>
              <div class="nav-item-desc">{{ demo.desc }}</div>
            </div>
          </RouterLink>
        </div>
      </nav>
    </aside>
    
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style>
.mode-tabs {
  display: flex;
  gap: 4px;
  padding: 12px;
  border-bottom: 1px solid var(--color-border);
}

.mode-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 12px;
  border-radius: var(--radius);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: var(--color-bg-muted);
  transition: all var(--transition);
}

.mode-tab:hover {
  color: var(--color-text);
  background: var(--color-border);
}

.mode-tab.active {
  color: white;
  background: var(--color-primary);
}

.nav-item-content {
  flex: 1;
  min-width: 0;
}

.nav-item-name {
  font-weight: 500;
}

.nav-item-desc {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.nav-item.router-link-active .nav-item-desc {
  color: inherit;
  opacity: 0.8;
}
</style>
