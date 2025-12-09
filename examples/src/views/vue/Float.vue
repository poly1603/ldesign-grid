<script setup lang="ts">
import { ref } from 'vue';
import { Grid, GridItem } from '@ldesign/grid-vue';
import { Layers, Code, Info } from 'lucide-vue-next';

const gridRef = ref<InstanceType<typeof Grid> | null>(null);
const floatMode = ref(false);
const showCode = ref(false);

// 切换浮动模式
const toggleFloat = () => {
  floatMode.value = !floatMode.value;
  // 通过ref访问Grid实例的方法
  gridRef.value?.grid?.setOptions({ float: floatMode.value });
};

const code = `<script setup>
import { ref } from 'vue';
import { Grid, GridItem } from '@ldesign/grid-vue';

const gridRef = ref();
const floatMode = ref(false);

const toggleFloat = () => {
  floatMode.value = !floatMode.value;
  gridRef.value?.grid?.setOptions({ float: floatMode.value });
};
<\/script>

<template>
  <Grid ref="gridRef" :float="floatMode">
    <GridItem id="1" :x="0" :y="0" :w="4" :h="2">组件1 y=0</GridItem>
    <GridItem id="2" :x="4" :y="2" :w="4" :h="2">组件2 y=2</GridItem>
  </Grid>
</template>`;
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">浮动模式</h1>
      <p class="page-description">切换浮动模式，允许组件之间存在空隙。</p>
    </div>
    <div class="info-box" style="margin-bottom: 16px;">
      <Info :size="18" class="info-box-icon" />
      <div>关闭浮动模式时，组件会自动向上紧凑排列。开启后，组件会保持在放置的位置。</div>
    </div>
    <div class="toolbar">
      <label class="form-checkbox"><input type="checkbox" v-model="floatMode" @change="toggleFloat" /> 浮动模式 {{ floatMode ? '开启' : '关闭' }}</label>
      <div class="toolbar-divider"></div>
      <button class="btn btn-secondary btn-sm" @click="showCode = !showCode"><Code :size="14" /> {{ showCode ? '隐藏' : '查看' }}代码</button>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title"><Layers :size="16" /> 网格 (浮动: {{ floatMode ? '开' : '关' }})</span></div>
      <div class="card-body card-body-flush">
        <Grid ref="gridRef" :column="12" :cell-height="80" :gap="10" :margin="10" :float="floatMode" style="min-height: 400px;">
          <GridItem id="float-1" :x="0" :y="0" :w="4" :h="2">
            <div class="float-widget">组件 1<br><small>y=0</small></div>
          </GridItem>
          <GridItem id="float-2" :x="4" :y="2" :w="4" :h="2">
            <div class="float-widget float-widget-alt">组件 2<br><small>y=2</small></div>
          </GridItem>
          <GridItem id="float-3" :x="8" :y="1" :w="4" :h="2">
            <div class="float-widget float-widget-green">组件 3<br><small>y=1</small></div>
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
.float-widget {
  display: flex;
  flex-direction: column;
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
.float-widget small { opacity: 0.7; }
.float-widget-alt { background: #fef3c7; border-color: #f59e0b; color: #b45309; }
.float-widget-green { background: #d1fae5; border-color: #10b981; color: #047857; }
</style>
