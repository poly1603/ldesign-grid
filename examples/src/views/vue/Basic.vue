<script setup lang="ts">
import { ref } from 'vue';
import { Grid, GridItem } from '@ldesign/grid-vue';
import { Plus, Trash2, Package, Code, BarChart3, Table, PieChart } from 'lucide-vue-next';

const gridRef = ref<InstanceType<typeof Grid> | null>(null);
const showCode = ref(false);

// 动态组件列表（通过v-for渲染GridItem）
const dynamicItems = ref<Array<{ id: string; w: number; h: number }>>([]);

// 添加动态组件
const handleAddWidget = () => {
  const w = 2 + Math.floor(Math.random() * 3);
  const h = 1 + Math.floor(Math.random() * 2);
  const id = `dynamic-${Date.now()}`;
  dynamicItems.value.push({ id, w, h });
};

// 移除动态组件
const removeItem = (id: string) => {
  const index = dynamicItems.value.findIndex(item => item.id === id);
  if (index > -1) dynamicItems.value.splice(index, 1);
};

// 清空所有
const clearAll = () => {
  dynamicItems.value = [];
  gridRef.value?.removeAll();
};

const code = `<script setup>
import { Grid, GridItem } from '@ldesign/grid-vue';
import MyChart from './MyChart.vue';
<\/script>

<template>
  <!-- 组件式用法：GridItem 内可放任意 Vue 组件 -->
  <Grid :column="12" :cell-height="80" :gap="10">
    <!-- 静态定义 -->
    <GridItem id="chart" :x="0" :y="0" :w="4" :h="2">
      <MyChart title="销售趋势" />
    </GridItem>
    
    <!-- 动态渲染 -->
    <GridItem 
      v-for="item in items" 
      :key="item.id"
      :id="item.id"
      :w="item.w" 
      :h="item.h"
    >
      <MyComponent :data="item.data" />
    </GridItem>
  </Grid>
</template>`;
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">基础网格</h1>
      <p class="page-description">使用 <code>&lt;Grid&gt;</code> + <code>&lt;GridItem&gt;</code> 组件，在 GridItem 内放置任意 Vue 组件。</p>
    </div>
    
    <div class="toolbar">
      <button class="btn btn-primary btn-sm" @click="handleAddWidget"><Plus :size="14" /> 添加组件</button>
      <button class="btn btn-danger btn-sm" @click="clearAll"><Trash2 :size="14" /> 清空</button>
      <div class="toolbar-divider"></div>
      <button class="btn btn-secondary btn-sm" @click="showCode = !showCode"><Code :size="14" /> {{ showCode ? '隐藏' : '查看' }}代码</button>
    </div>
    
    <div class="card">
      <div class="card-header"><span class="card-title"><Package :size="16" /> 网格布局</span></div>
      <div class="card-body card-body-flush">
        <!-- 组件式用法 -->
        <Grid ref="gridRef" :column="12" :cell-height="80" :gap="10" :margin="10" style="min-height: 400px;">
          <!-- 静态定义的 GridItem -->
          <GridItem id="chart" :x="0" :y="0" :w="4" :h="2">
            <div class="demo-widget demo-widget-blue">
              <BarChart3 :size="24" />
              <span>图表组件</span>
              <small>4×2</small>
            </div>
          </GridItem>
          
          <GridItem id="table" :x="4" :y="0" :w="4" :h="1">
            <div class="demo-widget demo-widget-green">
              <Table :size="24" />
              <span>表格组件</span>
              <small>4×1</small>
            </div>
          </GridItem>
          
          <GridItem id="pie" :x="8" :y="0" :w="4" :h="2">
            <div class="demo-widget demo-widget-orange">
              <PieChart :size="24" />
              <span>饼图组件</span>
              <small>4×2</small>
            </div>
          </GridItem>
          
          <!-- 动态 GridItem（autoPosition会自动找位置） -->
          <GridItem 
            v-for="item in dynamicItems" 
            :key="item.id"
            :id="item.id"
            :w="item.w" 
            :h="item.h"
          >
            <div class="demo-widget demo-widget-purple">
              <span>动态组件</span>
              <small>{{ item.w }}×{{ item.h }}</small>
              <button class="demo-close" @click.stop="removeItem(item.id)">×</button>
            </div>
          </GridItem>
        </Grid>
      </div>
    </div>
    
    <div v-if="showCode" class="card">
      <div class="card-header"><span class="card-title"><Code :size="16" /> 代码示例</span></div>
      <div class="card-body"><div class="code-block"><pre>{{ code }}</pre></div></div>
    </div>
  </div>
</template>

<style scoped>
.demo-widget {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  position: relative;
}
.demo-widget small { opacity: 0.8; font-size: 12px; }
.demo-widget-blue { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
.demo-widget-green { background: linear-gradient(135deg, #10b981, #059669); }
.demo-widget-orange { background: linear-gradient(135deg, #f59e0b, #d97706); }
.demo-widget-purple { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
.demo-close {
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
.demo-close:hover { background: rgba(255,255,255,0.5); }
</style>
