// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // shadcn-vue UI-компоненты: варианты пропсов задаются через cva defaultVariants,
    // явные Vue-дефолты не требуются.
    files: ['app/components/ui/**'],
    rules: {
      'vue/require-default-prop': 'off',
    },
  },
)
