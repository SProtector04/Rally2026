<script setup lang="ts">
import { computed } from 'vue'
import type { ReadingStatus } from '@/types/api'
import { STATUS_META } from '@/lib/status'

const props = defineProps<{ status: ReadingStatus }>()

const meta = computed(() => STATUS_META[props.status])
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
      meta.badge,
    ]"
  >
    <span class="size-1.5 rounded-full" :class="meta.dot" />
    {{ meta.label }}
  </span>
</template>
