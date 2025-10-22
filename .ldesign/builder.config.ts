/**
 * @ldesign/builder configuration for Grid library
 */

export default {
  name: 'LDesignGrid',

  // 入口文件
  entry: 'src/index.ts',

  // 输出格式
  formats: {
    esm: {
      enabled: true,
      outDir: 'dist'
    },
    cjs: {
      enabled: true,
      outDir: 'dist'
    },
    umd: {
      enabled: false  // Grid 库主要用于模块系统，不需要 UMD
    }
  },

  // 外部依赖
  external: ['gridstack', 'vue', 'react', 'react-dom', 'lit'],

  // 类型声明
  dts: {
    enabled: true,
    outDir: 'dist'
  },

  // 优化选项
  optimization: {
    minify: false,  // 开发阶段不压缩，方便调试
    treeshake: true,
    sourcemap: true
  }
}

