<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  Bell,
  History,
  LayoutDashboard,
  Leaf,
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
const isDark = ref(false)

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

function applyTheme(dark: boolean) {
  isDark.value = dark
  document.documentElement.classList.toggle('dark', dark)
  localStorage.setItem('hydropix.theme', dark ? 'dark' : 'light')
}

function toggleTheme() {
  applyTheme(!isDark.value)
}

function logout() {
  auth.logout()
  open.value = false
  router.push({ name: 'login' })
}

onMounted(() => {
  const saved = localStorage.getItem('hydropix.theme')
  applyTheme(saved === 'dark')
})

watch(
  () => route.fullPath,
  () => {
    open.value = false
    document.title = route.meta.title
      ? `${route.meta.title} · Hydropix`
      : 'Hydropix'
  },
  { immediate: true },
)
</script>

<template>
  <div class="min-h-screen lg:flex">
    <!-- Backdrop (mobile) -->
    <div
      v-if="open"
      class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
      @click="open = false"
    />

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 flex w-72 transform flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 lg:static lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <div class="flex items-center gap-2.5 border-b border-sidebar-border px-5 py-4">
        <div
          class="flex size-9 items-center justify-center rounded-xl bg-gradient-brand text-white"
        >
          <Leaf class="size-5" />
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

      <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p class="px-3 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Navegación
        </p>
        <RouterLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          active-class="bg-gradient-brand-soft text-primary"
        >
          <component :is="item.icon" class="size-5" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="border-t border-sidebar-border p-3">
        <div class="flex items-center gap-3 rounded-lg px-2 py-2">
          <div
            class="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-sm font-semibold text-white"
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
    <div class="flex min-h-screen flex-1 flex-col">
      <header
        class="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur lg:hidden"
      >
        <button
          class="rounded-md p-2 text-muted-foreground hover:bg-muted"
          aria-label="Abrir menú"
          @click="open = true"
        >
          <Menu class="size-5" />
        </button>
        <div class="flex items-center gap-2">
          <div
            class="flex size-7 items-center justify-center rounded-lg bg-gradient-brand text-white"
          >
            <Leaf class="size-4" />
          </div>
          <span class="font-semibold tracking-tight">Hydropix</span>
        </div>
        <div class="ml-auto flex items-center gap-1">
          <button
            class="relative rounded-md p-2 text-muted-foreground hover:bg-muted"
            aria-label="Notificaciones"
          >
            <Bell class="size-5" />
            <span
              class="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive ring-2 ring-background"
            />
          </button>
          <div
            class="flex size-8 items-center justify-center rounded-full bg-gradient-brand text-xs font-semibold text-white"
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
