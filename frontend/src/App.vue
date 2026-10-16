<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <header class="border-b">
      <nav class="mx-auto flex max-w-7xl items-center gap-6 p-4">
        <RouterLink to="/" class="text-sm font-medium">Home</RouterLink>
        <RouterLink to="/about" class="text-sm text-muted-foreground">About</RouterLink>
      </nav>
    </header>

    <RouterView />
  </div>
</template>
