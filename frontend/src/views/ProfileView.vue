<script setup lang="ts">
import { ref } from 'vue'
import { Bell, CalendarDays, Clock, MapPin, Plus, Trash2 } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DAY_LABELS } from '@/data/mock'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'

const auth = useAuthStore()
const profile = useProfileStore()

const roleLabel = auth.currentUser?.role === 'admin' ? 'Administrador' : 'Voluntario'
const initials =
  auth.currentUser?.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? ''

const day = ref(1)
const start = ref('09:00')
const end = ref('12:00')
const task = ref('')
const location = ref('')

function addEntry() {
  if (!task.value.trim()) return
  profile.addScheduleEntry({
    day: day.value,
    start: start.value,
    end: end.value,
    task: task.value.trim(),
    location: location.value.trim() || 'Central',
  })
  task.value = ''
  location.value = ''
}

function entriesForDay(d: number) {
  return profile.schedule.filter((e) => e.day === d)
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Mi perfil</h1>
      <p class="text-sm text-muted-foreground">
        Horarios de trabajo y preferencias de alertas.
      </p>
    </div>

    <Card>
      <CardContent class="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div
          class="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-brand text-xl font-semibold text-white"
        >
          {{ initials }}
        </div>
        <div class="flex-1">
          <h2 class="text-lg font-semibold">{{ auth.currentUser?.name }}</h2>
          <p class="text-sm text-muted-foreground">{{ auth.currentUser?.email }}</p>
        </div>
        <div class="flex flex-col items-start gap-1 sm:items-end">
          <span
            class="rounded-full bg-gradient-brand-soft px-3 py-1 text-xs font-medium text-primary"
          >
            {{ roleLabel }}
          </span>
          <p class="text-xs text-muted-foreground">
            En el equipo desde {{ auth.currentUser?.joinedAt }}
          </p>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader class="flex-row items-center justify-between">
        <CardTitle class="flex items-center gap-2">
          <CalendarDays class="size-4 text-primary" />
          Horarios de trabajo
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="(label, d) in DAY_LABELS"
            :key="label"
            class="rounded-lg border p-3"
            :class="entriesForDay(d).length ? 'bg-muted/30' : ''"
          >
            <p class="mb-2 text-sm font-semibold">{{ label }}</p>
            <div v-if="entriesForDay(d).length === 0" class="text-xs text-muted-foreground">
              Sin turnos
            </div>
            <div v-for="entry in entriesForDay(d)" :key="entry.id" class="mb-2 rounded-md border bg-card p-2">
              <div class="flex items-start justify-between gap-2">
                <p class="text-sm font-medium leading-tight">{{ entry.task }}</p>
                <button
                  class="text-muted-foreground hover:text-destructive"
                  aria-label="Eliminar turno"
                  @click="profile.removeScheduleEntry(entry.id)"
                >
                  <Trash2 class="size-3.5" />
                </button>
              </div>
              <p class="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock class="size-3" />
                {{ entry.start }} – {{ entry.end }}
              </p>
              <p class="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin class="size-3" />
                {{ entry.location }}
              </p>
            </div>
          </div>
        </div>

        <div class="rounded-lg border p-4">
          <p class="mb-3 text-sm font-medium">Agregar turno</p>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <select
              v-model="day"
              class="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring/50 focus-visible:ring-3"
            >
              <option v-for="(label, d) in DAY_LABELS" :key="label" :value="d">{{ label }}</option>
            </select>
            <input v-model="start" type="time" class="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring/50 focus-visible:ring-3" />
            <input v-model="end" type="time" class="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring/50 focus-visible:ring-3" />
            <input v-model="task" type="text" placeholder="Tarea" class="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring/50 focus-visible:ring-3" />
            <input v-model="location" type="text" placeholder="Ubicación" class="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring/50 focus-visible:ring-3" />
            <Button @click="addEntry">
              <Plus class="size-4" />
              Agregar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Bell class="size-4 text-primary" />
          Preferencias de alertas
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-2">
        <div
          v-for="pref in profile.alerts"
          :key="pref.id"
          class="flex items-center justify-between gap-4 rounded-lg border p-4"
        >
          <div>
            <p class="text-sm font-medium">{{ pref.label }}</p>
            <p class="text-xs text-muted-foreground">{{ pref.description }}</p>
          </div>
          <button
            class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors"
            :class="pref.enabled ? 'bg-emerald-500' : 'bg-muted'"
            :aria-label="pref.label"
            @click="profile.toggleAlert(pref.id)"
          >
            <span
              class="inline-block size-5 transform rounded-full bg-white shadow transition-transform"
              :class="pref.enabled ? 'translate-x-5' : 'translate-x-0.5'"
            />
          </button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
