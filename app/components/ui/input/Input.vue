<script setup lang="ts">
import { cn } from '~/lib/utils'

const props = defineProps<{ modelValue?: string | number; class?: string; placeholder?: string; type?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()
</script>

<template>
  <input
    :type="type ?? 'text'"
    :value="modelValue"
    :placeholder="placeholder"
    :class="cn('flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50', props.class)"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  >
</template>
