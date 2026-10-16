<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Leaf, LogIn, ShieldCheck, UserRound } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')

function submit() {
  error.value = ''
  const user = auth.login(email.value)
  if (!user) {
    error.value = 'Credenciales inválidas o usuario deshabilitado.'
    return
  }
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
  router.push(redirect)
}

function quickLogin(demoEmail: string) {
  email.value = demoEmail
  password.value = 'demo'
  submit()
}
</script>

<template>
  <div class="flex min-h-screen flex-col lg:flex-row">
    <div
      class="relative hidden flex-1 flex-col justify-between overflow-hidden bg-gradient-hero p-10 text-white lg:flex"
    >
      <div class="flex items-center gap-2.5">
        <div class="flex size-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
          <Leaf class="size-5" />
        </div>
        <span class="text-xl font-semibold tracking-tight">Rally2026</span>
      </div>
      <div class="max-w-md">
        <h1 class="text-4xl font-bold leading-tight tracking-tight">
          Bienvenido de vuelta al reservorio.
        </h1>
        <p class="mt-4 text-lg text-sky-50/90">
          Iniciá sesión para acceder al monitoreo, el foro y tus horarios de trabajo.
        </p>
      </div>
      <p class="text-sm text-sky-50/70">Plataforma de monitoreo ambiental · 2026</p>
    </div>

    <div class="flex flex-1 items-center justify-center px-4 py-10">
      <div class="w-full max-w-sm">
        <div class="mb-8 flex items-center gap-2.5 lg:hidden">
          <div
            class="flex size-10 items-center justify-center rounded-xl bg-gradient-brand text-white"
          >
            <Leaf class="size-5" />
          </div>
          <span class="text-xl font-semibold tracking-tight">Rally2026</span>
        </div>

        <h2 class="text-2xl font-bold tracking-tight">Iniciar sesión</h2>
        <p class="mt-1 text-sm text-muted-foreground">
          Ingresá con tu correo para continuar.
        </p>

        <form class="mt-6 space-y-4" @submit.prevent="submit">
          <div class="space-y-1.5">
            <label for="email" class="text-sm font-medium">Correo electrónico</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              placeholder="tu@correo.com"
              class="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring/50 placeholder:text-muted-foreground focus-visible:ring-3"
            />
          </div>
          <div class="space-y-1.5">
            <label for="password" class="text-sm font-medium">Contraseña</label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              placeholder="••••••••"
              class="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring/50 placeholder:text-muted-foreground focus-visible:ring-3"
            />
          </div>

          <p v-if="error" class="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
            {{ error }}
          </p>

          <button
            type="submit"
            class="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <LogIn class="size-4" />
            Ingresar
          </button>
        </form>

        <div class="mt-8">
          <p class="mb-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Cuentas de demostración
          </p>
          <div class="grid grid-cols-2 gap-3">
            <button
              class="flex flex-col items-center gap-1 rounded-xl border bg-card px-3 py-4 text-sm ring-1 ring-border transition-shadow hover:shadow-sm"
              @click="quickLogin('admin@rally.ar')"
            >
              <ShieldCheck class="size-5 text-primary" />
              <span class="font-medium">Administrador</span>
              <span class="text-xs text-muted-foreground">admin@rally.ar</span>
            </button>
            <button
              class="flex flex-col items-center gap-1 rounded-xl border bg-card px-3 py-4 text-sm ring-1 ring-border transition-shadow hover:shadow-sm"
              @click="quickLogin('voluntario@rally.ar')"
            >
              <UserRound class="size-5 text-emerald-500" />
              <span class="font-medium">Voluntario</span>
              <span class="text-xs text-muted-foreground">voluntario@rally.ar</span>
            </button>
          </div>
        </div>

        <p class="mt-8 text-center text-sm text-muted-foreground">
          <RouterLink to="/" class="text-primary hover:underline">Volver al inicio</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
