/**
 * ESLint configuration for @ldesign/grid
 */

export default [
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.vue'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin')
    },
    rules: {
      // TypeScript
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // General
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'warn',
      'no-alert': 'warn',
      'prefer-const': 'warn',
      'no-var': 'error',

      // Code quality
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'brace-style': ['error', '1tbs'],
      'comma-dangle': ['error', 'never'],
      'semi': ['error', 'never'],
      'quotes': ['error', 'single', { avoidEscape: true }],

      // Best practices
      'no-unused-expressions': 'error',
      'no-duplicate-imports': 'error',
      'no-return-await': 'error',
      'require-await': 'warn'
    }
  },
  {
    files: ['**/*.vue'],
    plugins: {
      'vue': require('eslint-plugin-vue')
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'off'
    }
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off'
    }
  }
]

