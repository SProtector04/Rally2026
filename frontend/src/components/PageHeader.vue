<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

defineProps<{
  title: string
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div class="flex flex-wrap items-end justify-between gap-3" :class="$props.class">
    <div class="min-w-0">
      <h1 class="text-2xl font-semibold tracking-tight">{{ title }}</h1>
      <div v-if="$slots.description" class="mt-1 text-sm text-muted-foreground">
        <slot name="description" />
      </div>
    </div>
    <div v-if="$slots.default" class="flex items-center gap-3">
      <slot />
    </div>
  </div>
</template>
