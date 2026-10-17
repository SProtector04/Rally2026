<script setup lang="ts" generic="T extends string | number = string">
import type { HTMLAttributes } from 'vue'
import { cn } from 'cn'

defineProps<{
  modelValue?: T
  class?: HTMLAttributes['class']
}>()

const emit = defineEmits<{ 'update:modelValue': [T] }>()

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value as T)
}
</script>

<template>
  <input
    :value="modelValue"
    :class="
      cn(
        'flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
        $props.class,
      )
    "
    @input="onInput"
  />
</template>
