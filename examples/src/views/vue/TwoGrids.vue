<script setup lang="ts">
import { ref } from 'vue';
import { Grid, GridItem } from '@ldesign/grid-vue';
import { ArrowRightLeft, Code, Info } from 'lucide-vue-next';

const showCode = ref(false);

const code = `<!-- 页面可以有多个独立的Grid -->
<Grid :column="6" :cell-height="70">
  <GridItem id="1a" :x="0" :y="0" :w="3" :h="2">
    <WidgetA />
  </GridItem>
</Grid>

<Grid :column="6" :cell-height="70">
  <GridItem id="2a" :x="0" :y="0" :w="2" :h="2">
    <WidgetB />
  </GridItem>
</Grid>`;
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">多个网格</h1>
      <p class="page-description">同一页面可以有多个独立的网格实例。</p>
    </div>
    <div class="info-box" style="margin-bottom: 16px;">
      <Info :size="18" class="info-box-icon" />
      <div>每个网格独立运作，组件只能在自己的网格内拖拽和调整大小。</div>
    </div>
    <div class="toolbar">
      <button class="btn btn-secondary btn-sm" @click="showCode = !showCode"><Code :size="14" /> {{ showCode ? '隐藏' : '查看' }}代码</button>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div class="card">
        <div class="card-header"><span class="card-title"><ArrowRightLeft :size="16" /> 网格 1 (6列)</span></div>
        <div class="card-body card-body-flush">
          <Grid :column="6" :cell-height="70" :gap="8" :margin="8" style="min-height: 280px;">
            <GridItem id="1a" :x="0" :y="0" :w="3" :h="2">
              <div class="two-grid-widget">网格1 - A</div>
            </GridItem>
            <GridItem id="1b" :x="3" :y="0" :w="3" :h="1">
              <div class="two-grid-widget">网格1 - B</div>
            </GridItem>
            <GridItem id="1c" :x="0" :y="2" :w="2" :h="1">
              <div class="two-grid-widget">网格1 - C</div>
            </GridItem>
          </Grid>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><ArrowRightLeft :size="16" /> 网格 2 (6列)</span></div>
        <div class="card-body card-body-flush">
          <Grid :column="6" :cell-height="70" :gap="8" :margin="8" style="min-height: 280px;">
            <GridItem id="2a" :x="0" :y="0" :w="2" :h="2">
              <div class="two-grid-widget two-grid-widget-alt">网格2 - A</div>
            </GridItem>
            <GridItem id="2b" :x="2" :y="0" :w="4" :h="1">
              <div class="two-grid-widget two-grid-widget-alt">网格2 - B</div>
            </GridItem>
            <GridItem id="2c" :x="2" :y="1" :w="2" :h="2">
              <div class="two-grid-widget two-grid-widget-alt">网格2 - C</div>
            </GridItem>
          </Grid>
        </div>
      </div>
    </div>
    <div v-if="showCode" class="card" style="margin-top:20px">
      <div class="card-header"><span class="card-title"><Code :size="16" /> 代码示例</span></div>
      <div class="card-body"><div class="code-block"><pre>{{ code }}</pre></div></div>
    </div>
  </div>
</template>

<style scoped>
.two-grid-widget {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #e0f2fe;
  border: 2px dashed #0ea5e9;
  border-radius: 8px;
  color: #0369a1;
  font-weight: 500;
}
.two-grid-widget-alt {
  background: #fce7f3;
  border-color: #ec4899;
  color: #be185d;
}
</style>
