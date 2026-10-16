<script setup lang="ts">
import { computed } from 'vue'
import type { ReadingStatus } from '@/types/api'

const props = defineProps<{ status: ReadingStatus }>()

const meta = computed(() => {
  switch (props.status) {
    case 'alert':
      return {
        label: 'Alerta',
        classes: 'bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/30',
        dot: 'bg-rose-500',
      }
    case 'warning':
      return {
        label: 'Atención',
        classes: 'bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30',
        dot: 'bg-amber-500',
      }
    default:
      return {
        label: 'Normal',
        classes: 'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30',
        dot: 'bg-emerald-500',
      }
  }
})
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
      meta.classes,
    ]"
  >
    <span class="size-1.5 rounded-full" :class="meta.dot" />
    {{ meta.label }}
  </span>
</template>
