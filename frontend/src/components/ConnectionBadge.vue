<script setup lang="ts">
defineProps<{ connected: boolean }>()
</script>

<template>
  <span
    class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium"
    :class="
      connected
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
        : 'bg-muted text-muted-foreground'
    "
  >
    <span class="relative flex size-2">
      <span
        v-if="connected"
        class="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75"
      />
      <span
        class="relative inline-flex size-2 rounded-full"
        :class="connected ? 'bg-emerald-500' : 'bg-muted-foreground'"
      />
    </span>
    {{ connected ? 'En línea' : 'Sin conexión en vivo' }}
  </span>
</template>
