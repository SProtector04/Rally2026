<script setup lang="ts">
import type { Component } from 'vue'
import { Card, CardContent } from '@/components/ui/card'

defineProps<{
  label: string
  value: string | number
  icon: Component
  tone: string
}>()
</script>

<template>
  <Card>
    <CardContent class="flex items-center gap-4">
      <div class="flex size-11 shrink-0 items-center justify-center rounded-xl" :class="tone">
        <component :is="icon" class="size-5" />
      </div>
      <div class="min-w-0">
        <p class="text-2xl font-semibold leading-none">{{ value }}</p>
        <p class="mt-1 truncate text-sm text-muted-foreground">{{ label }}</p>
      </div>
    </CardContent>
  </Card>
</template>
