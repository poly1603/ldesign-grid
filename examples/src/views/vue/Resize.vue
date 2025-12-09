<script setup lang="ts">
import { ref } from 'vue';
import { Grid, GridItem } from '@ldesign/grid-vue';
import { Maximize2, Code, Info } from 'lucide-vue-next';

const showCode = ref(false);

const code = `<Grid :column="12" :cell-height="80">
  <!-- 无约束 -->
  <GridItem id="1" :x="0" :y="0" :w="4" :h="2">
    <MyWidget />
  </GridItem>
  
  <!-- 宽度约束 -->
  <GridItem id="2" :x="4" :y="0" :w="4" :h="2" :min-w="2" :max-w="6">
    <MyWidget />
  </GridItem>
  
  <!-- 高度约束 -->
  <GridItem id="3" :x="8" :y="0" :w="4" :h="2" :min-h="2" :max-h="4">
    <MyWidget />
  </GridItem>
</Grid>`;
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">调整大小</h1>
      <p class="page-description">组件支持最小/最大尺寸约束。调整大小时其他组件会实时移动。</p>
    </div>
    <div class="info-box" style="margin-bottom: 16px;">
      <Info :size="18" class="info-box-icon" />
      <div>部分组件设置了尺寸约束，尝试调整它们的大小来查看限制效果。</div>
    </div>
    <div class="toolbar">
      <button class="btn btn-secondary btn-sm" @click="showCode = !showCode"><Code :size="14" /> {{ showCode ? '隐藏' : '查看' }}代码</button>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title"><Maximize2 :size="16" /> 可调整大小的组件</span></div>
      <div class="card-body card-body-flush">
        <Grid :column="12" :cell-height="80" :gap="10" :margin="10" style="min-height: 400px;">
          <GridItem id="resize-1" :x="0" :y="0" :w="4" :h="2">
            <div class="resize-widget">无约束</div>
          </GridItem>
          
          <GridItem id="resize-2" :x="4" :y="0" :w="4" :h="2" :min-w="2" :max-w="6">
            <div class="resize-widget resize-widget-blue">minW:2 maxW:6</div>
          </GridItem>
          
          <GridItem id="resize-3" :x="8" :y="0" :w="4" :h="2" :min-h="2" :max-h="4">
            <div class="resize-widget resize-widget-green">minH:2 maxH:4</div>
          </GridItem>
          
          <GridItem id="resize-4" :x="0" :y="2" :w="6" :h="2" :min-w="3" :max-w="8" :min-h="1" :max-h="3">
            <div class="resize-widget resize-widget-orange">minW:3 maxW:8<br>minH:1 maxH:3</div>
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
.resize-widget {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #e0f2fe;
  border: 2px dashed #0ea5e9;
  border-radius: 8px;
  color: #0369a1;
  font-weight: 500;
  text-align: center;
}
.resize-widget-blue { background: #dbeafe; border-color: #3b82f6; color: #1d4ed8; }
.resize-widget-green { background: #d1fae5; border-color: #10b981; color: #047857; }
.resize-widget-orange { background: #fef3c7; border-color: #f59e0b; color: #b45309; }
</style>
