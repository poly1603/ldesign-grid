import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import './assets/styles.css';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/js/basic' },
    // 原生 JS 示例
    { path: '/js/basic', name: 'js-basic', component: () => import('./views/js/Basic.vue') },
    { path: '/js/resize', name: 'js-resize', component: () => import('./views/js/Resize.vue') },
    { path: '/js/external', name: 'js-external', component: () => import('./views/js/External.vue') },
    { path: '/js/two-grids', name: 'js-two-grids', component: () => import('./views/js/TwoGrids.vue') },
    { path: '/js/float', name: 'js-float', component: () => import('./views/js/Float.vue') },
    { path: '/js/static', name: 'js-static', component: () => import('./views/js/Static.vue') },
    { path: '/js/serialization', name: 'js-serialization', component: () => import('./views/js/Serialization.vue') },
    { path: '/js/events', name: 'js-events', component: () => import('./views/js/Events.vue') },
    { path: '/js/api', name: 'js-api', component: () => import('./views/js/Api.vue') },
    { path: '/js/dashboard', name: 'js-dashboard', component: () => import('./views/js/Dashboard.vue') },
    // Vue 组件示例
    { path: '/vue/basic', name: 'vue-basic', component: () => import('./views/vue/Basic.vue') },
    { path: '/vue/resize', name: 'vue-resize', component: () => import('./views/vue/Resize.vue') },
    { path: '/vue/external', name: 'vue-external', component: () => import('./views/vue/External.vue') },
    { path: '/vue/two-grids', name: 'vue-two-grids', component: () => import('./views/vue/TwoGrids.vue') },
    { path: '/vue/float', name: 'vue-float', component: () => import('./views/vue/Float.vue') },
    { path: '/vue/static', name: 'vue-static', component: () => import('./views/vue/Static.vue') },
    { path: '/vue/serialization', name: 'vue-serialization', component: () => import('./views/vue/Serialization.vue') },
    { path: '/vue/events', name: 'vue-events', component: () => import('./views/vue/Events.vue') },
    { path: '/vue/api', name: 'vue-api', component: () => import('./views/vue/Api.vue') },
    { path: '/vue/dashboard', name: 'vue-dashboard', component: () => import('./views/vue/Dashboard.vue') },
  ],
});

createApp(App).use(router).mount('#app');
