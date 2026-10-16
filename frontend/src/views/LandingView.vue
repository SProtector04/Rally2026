<script setup lang="ts">
import { RouterLink } from 'vue-router'
import {
  Activity,
  ArrowRight,
  History,
  Leaf,
  Map,
  MessagesSquare,
  ShieldCheck,
  User,
} from '@lucide/vue'

const features = [
  {
    icon: Activity,
    title: 'Monitoreo en tiempo real',
    description: 'Gráficas y porcentajes del estado de sensores y actuadores del reservorio.',
  },
  {
    icon: History,
    title: 'Registro histórico',
    description: 'Acceso a la data conservada con exportación de reportes en PDF.',
  },
  {
    icon: ShieldCheck,
    title: 'Gestión de permisos',
    description: 'Roles de administrador y voluntario con accesos diferenciados.',
  },
  {
    icon: User,
    title: 'Horarios y alertas',
    description: 'Organizá tus turnos de trabajo y recibí avisos configurables.',
  },
  {
    icon: MessagesSquare,
    title: 'Foro colaborativo',
    description: 'Propuestas, preguntas y votaciones para la gestión del trabajo.',
  },
  {
    icon: Map,
    title: 'Reservorio interactivo',
    description: 'Mapa con la ubicación de sensores y actuadores e indicativos visuales.',
  },
]
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <header class="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <div class="flex items-center gap-2.5">
          <div
            class="flex size-9 items-center justify-center rounded-xl bg-gradient-brand text-white"
          >
            <Leaf class="size-5" />
          </div>
          <span class="text-lg font-semibold tracking-tight">Rally2026</span>
        </div>
        <nav class="flex items-center gap-2">
          <RouterLink
            to="/login"
            class="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Iniciar sesión
          </RouterLink>
          <RouterLink
            to="/login"
            class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Ingresar
          </RouterLink>
        </nav>
      </div>
    </header>

    <main class="flex-1">
      <section
        class="relative overflow-hidden bg-gradient-hero"
      >
        <div class="mx-auto max-w-6xl px-4 py-20 text-white md:px-6 md:py-28">
          <div class="max-w-2xl">
            <span
              class="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-medium backdrop-blur"
            >
              <span class="size-2 animate-pulse rounded-full bg-emerald-200" />
              Plataforma de monitoreo ambiental
            </span>
            <h1 class="mt-5 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Cuidamos el reservorio, juntos y en tiempo real.
            </h1>
            <p class="mt-4 text-lg text-sky-50/90">
              Rally2026 integra sensores y actuadores para monitorear, colaborar y tomar
              decisiones con datos confiables.
            </p>
            <div class="mt-8 flex flex-wrap gap-3">
              <RouterLink
                to="/login"
                class="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-sky-700 shadow-sm hover:bg-sky-50"
              >
                Comenzar ahora
                <ArrowRight class="size-4" />
              </RouterLink>
              <a
                href="#features"
                class="inline-flex items-center gap-2 rounded-xl border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Conocer más
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="features" class="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <div class="text-center">
          <h2 class="text-3xl font-bold tracking-tight">Todo lo que necesitás en un solo lugar</h2>
          <p class="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Seis módulos pensados para administradores y voluntarios del reservorio.
          </p>
        </div>
        <div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="group rounded-2xl border bg-card p-6 ring-1 ring-border transition-shadow hover:shadow-md"
          >
            <div
              class="flex size-11 items-center justify-center rounded-xl bg-gradient-brand-soft text-primary"
            >
              <component :is="feature.icon" class="size-6" />
            </div>
            <h3 class="mt-4 text-lg font-semibold">{{ feature.title }}</h3>
            <p class="mt-2 text-sm text-muted-foreground">{{ feature.description }}</p>
          </div>
        </div>
      </section>

      <section class="border-t bg-card">
        <div class="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <div class="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 class="text-3xl font-bold tracking-tight">
                De la lectura del sensor a la decisión informada
              </h2>
              <p class="mt-4 text-muted-foreground">
                Los microcontroladores publican lecturas por MQTT; el backend las clasifica
                según umbrales, las persiste y las transmite por WebSocket al navegador.
              </p>
              <ul class="mt-6 space-y-3 text-sm">
                <li class="flex items-center gap-3">
                  <span class="size-2 rounded-full bg-emerald-500" />
                  Clasificación automática: normal, atención o alerta.
                </li>
                <li class="flex items-center gap-3">
                  <span class="size-2 rounded-full bg-sky-500" />
                  Visualización en vivo sobre mapa interactivo.
                </li>
                <li class="flex items-center gap-3">
                  <span class="size-2 rounded-full bg-amber-500" />
                  Historial persistente y descargable.
                </li>
              </ul>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div class="rounded-2xl border bg-background p-5 text-center">
                <p class="text-3xl font-bold text-primary">6</p>
                <p class="mt-1 text-xs text-muted-foreground">Sensores</p>
              </div>
              <div class="rounded-2xl border bg-background p-5 text-center">
                <p class="text-3xl font-bold text-emerald-500">4</p>
                <p class="mt-1 text-xs text-muted-foreground">Actuadores</p>
              </div>
              <div class="rounded-2xl border bg-background p-5 text-center">
                <p class="text-3xl font-bold text-sky-500">24/7</p>
                <p class="mt-1 text-xs text-muted-foreground">Monitoreo</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer class="border-t bg-card">
      <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground md:flex-row md:px-6">
        <div class="flex items-center gap-2">
          <Leaf class="size-4 text-emerald-500" />
          <span>Rally2026</span>
        </div>
        <p>Plataforma de monitoreo ambiental · 2026</p>
      </div>
    </footer>
  </div>
</template>
