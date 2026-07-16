<script setup lang="ts">
import { cn } from '~/lib/utils'
import { buttonVariants, type ButtonVariants } from '.'

interface Props {
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  as?: string
  class?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), { as: 'button' })
</script>

<template>
  <component
    :is="as"
    :disabled="disabled"
    :class="cn(buttonVariants({ variant, size }), props.class)"
  >
    <slot />
  </component>
</template>
