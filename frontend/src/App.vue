<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppShell from '@/layouts/AppShell.vue'

const route = useRoute()
const isBlank = computed(() => route.meta.layout === 'blank')
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <AppShell v-if="!isBlank">
      <RouterView />
    </AppShell>
    <RouterView v-else />
  </div>
</template>
