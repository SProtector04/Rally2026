<script setup lang="ts">
import { Moon, Sun } from '@lucide/vue'
import { isDark, toggleTheme } from '@/composables/useTheme'
</script>

<template>
  <button
    type="button"
    class="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    :aria-label="isDark ? 'Activar modo claro' : 'Activar modo oscuro'"
    @click="toggleTheme"
  >
    <Sun v-if="isDark" class="size-5" />
    <Moon v-else class="size-5" />
  </button>
</template>
