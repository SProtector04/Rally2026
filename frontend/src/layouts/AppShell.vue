<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  History,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  MessagesSquare,
  Moon,
  ShieldCheck,
  Sun,
  User,
  X,
} from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import { isDark, toggleTheme } from '@/composables/useTheme'
import type { Role } from '@/types/domain'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Monitoreo', icon: LayoutDashboard },
  { to: '/registro', label: 'Registro histórico', icon: History },
  { to: '/reservorio', label: 'Reservorio', icon: Map },
  { to: '/foro', label: 'Foro', icon: MessagesSquare },
  { to: '/perfil', label: 'Mi perfil', icon: User },
  { to: '/permisos', label: 'Permisos', icon: ShieldCheck, adminOnly: true },
]

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const open = ref(false)

const items = computed(() => NAV_ITEMS.filter((i) => !i.adminOnly || auth.isAdmin))

const roleLabel: Record<Role, string> = {
  admin: 'Administrador',
  volunteer: 'Voluntario',
}

const initials = computed(() => {
  const name = auth.currentUser?.name ?? ''
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
})

function logout() {
  auth.logout()
  open.value = false
  router.push({ name: 'login' })
}

watch(
  () => route.fullPath,
  () => {
    open.value = false
    document.title = route.meta.title ? `${route.meta.title} · Hydropix` : 'Hydropix'
  },
  { immediate: true },
)
</script>

<template>
  <div class="min-h-svh lg:flex">
    <!-- Backdrop (mobile) -->
    <div
      v-if="open"
      class="fixed inset-0 z-40 bg-black/40 lg:hidden"
      @click="open = false"
    />

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar transition-transform duration-300 lg:static lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <!-- Brand -->
      <div class="flex items-center gap-2.5 px-5 py-5">
        <div class="flex size-25 items-center justify-center text-white">
          <img
            src="/HIDROPIX.svg"
            alt="Hydropix"
            class="size-25 object-contain brightness-0 transition-[filter] duration-200 dark:brightness-100"
          />
        </div>
        <div class="flex-1">
          <p class="text-base font-semibold leading-tight tracking-tight">Hydropix</p>
          <p class="text-xs text-muted-foreground">Monitoreo del reservorio</p>
        </div>
        <button
          class="rounded-md p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
          aria-label="Cerrar menú"
          @click="open = false"
        >
          <X class="size-5" />
        </button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 space-y-1 overflow-y-auto px-3 pb-3">
        <RouterLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          active-class="bg-brand-soft text-primary"
        >
          <component :is="item.icon" class="size-5" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <!-- User + actions -->
      <div class="bg-muted/40 p-3">
        <div class="flex items-center gap-3 rounded-lg px-2 py-2">
          <div
            class="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white"
          >
            {{ initials }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{{ auth.currentUser?.name }}</p>
            <p class="truncate text-xs text-muted-foreground">
              {{ roleLabel[auth.currentUser?.role ?? 'volunteer'] }}
            </p>
          </div>
        </div>
        <div class="mt-1 flex items-center gap-1">
          <button
            class="flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            @click="toggleTheme"
          >
            <Sun v-if="isDark" class="size-4" />
            <Moon v-else class="size-4" />
            {{ isDark ? 'Modo claro' : 'Modo oscuro' }}
          </button>
          <button
            class="flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            @click="logout"
          >
            <LogOut class="size-4" />
            Salir
          </button>
        </div>
      </div>
    </aside>

    <!-- Main column -->
    <div class="flex min-h-svh flex-1 flex-col">
      <header
        class="sticky top-0 z-30 mx-3 mt-3 flex items-center gap-3 rounded-2xl bg-background px-4 py-3 lg:hidden"
      >
        <button
          class="rounded-md p-2 text-muted-foreground hover:bg-muted"
          aria-label="Abrir menú"
          @click="open = true"
        >
          <Menu class="size-5" />
        </button>
        <div class="flex items-center gap-2">
          <div class="flex size-25 items-center justify-center text-white">
            <img
              src="/HIDROPIX.svg"
              alt="Hydropix"
              class="size-15 object-contain brightness-0 transition-[filter] duration-200 dark:brightness-100"
            />
          </div>
          <span class="font-semibold tracking-tight">Hydropix</span>
        </div>
        <div class="ml-auto flex items-center gap-1">
          <div
            class="flex size-8 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white"
          >
            {{ initials }}
          </div>
        </div>
      </header>

      <main class="flex-1 p-4 md:p-6 lg:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>
