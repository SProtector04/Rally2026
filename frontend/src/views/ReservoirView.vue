<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { AlertTriangle, CircleDot, Diamond, Radio } from '@lucide/vue'
import ReservoirMap from '@/components/ReservoirMap.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSensors } from '@/composables/useSensors'
import { useReadingsHistory } from '@/composables/useReadingsHistory'
import { useReadings } from '@/composables/useReadings'
import { latestBySensor } from '@/lib/readings'
import { mockActuators } from '@/data/mock'
import { ACTUATOR_STATE, ACTUATOR_TYPE } from '@/lib/device'

const { sensors, fallback: sensorsFallback, load: loadSensors } = useSensors()
const { readings, fallback: readingsFallback, load: loadReadings } = useReadingsHistory()
const { latest, connect } = useReadings()

const isDemo = computed(() => sensorsFallback.value || readingsFallback.value)

const alertCount = computed(() => {
  const sensorAlerts = Object.values(latest.value).filter((r) => r.status === 'alert').length
  const actuatorErrors = mockActuators.filter((a) => a.state === 'error').length
  return sensorAlerts + actuatorErrors
})

onMounted(async () => {
  await Promise.all([loadSensors(), loadReadings(undefined, 200)])
  latest.value = { ...latestBySensor(readings.value), ...latest.value }
  connect()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Reservorio</h1>
        <p class="text-sm text-muted-foreground">
          Ubicación de sensores y actuadores con indicativos visuales.
        </p>
      </div>
      <div class="flex items-center gap-3">
        <span
          v-if="isDemo"
          class="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
        >
          Modo demo · sin backend
        </span>
        <span
          v-if="alertCount > 0"
          class="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-sm font-medium text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
        >
          <AlertTriangle class="size-4" />
          {{ alertCount }} alerta{{ alertCount === 1 ? '' : 's' }} activa{{ alertCount === 1 ? '' : 's' }}
        </span>
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <Card class="lg:col-span-2">
        <CardHeader>
          <CardTitle>Mapa interactivo</CardTitle>
          <CardDescription>Hacé clic en un punto para ver el detalle.</CardDescription>
        </CardHeader>
        <CardContent class="h-[520px]">
          <ReservoirMap :sensors="sensors" :actuators="mockActuators" :latest="latest" />
        </CardContent>
      </Card>

      <div class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Leyenda</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4 text-sm">
            <div>
              <p class="mb-2 flex items-center gap-2 font-medium">
                <CircleDot class="size-4 text-primary" />
                Sensores
              </p>
              <div class="space-y-1.5">
                <div class="flex items-center gap-2">
                  <span class="size-3 rounded-full border border-white bg-emerald-500 shadow" />
                  Normal
                </div>
                <div class="flex items-center gap-2">
                  <span class="size-3 rounded-full border border-white bg-amber-500 shadow" />
                  Atención
                </div>
                <div class="flex items-center gap-2">
                  <span class="size-3 rounded-full border border-white bg-rose-500 shadow" />
                  Alerta
                </div>
              </div>
            </div>
            <div>
              <p class="mb-2 flex items-center gap-2 font-medium">
                <Diamond class="size-4 text-primary" />
                Actuadores
              </p>
              <div class="space-y-1.5">
                <div class="flex items-center gap-2">
                  <span class="flex size-4 rotate-45 items-center justify-center rounded-[4px] bg-emerald-500" />
                  Activo
                </div>
                <div class="flex items-center gap-2">
                  <span class="flex size-4 rotate-45 items-center justify-center rounded-[4px] bg-slate-400" />
                  Inactivo
                </div>
                <div class="flex items-center gap-2">
                  <span class="flex size-4 rotate-45 items-center justify-center rounded-[4px] bg-rose-500" />
                  Falla
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Radio class="size-4 text-primary" />
              Estado de dispositivos
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <div v-for="sensor in sensors" :key="sensor.id" class="flex items-center justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate text-sm font-medium">{{ sensor.name }}</p>
                <p class="text-xs text-muted-foreground">
                  {{ latest[sensor.id]?.value ?? '—' }} {{ sensor.unit }}
                </p>
              </div>
              <StatusBadge :status="latest[sensor.id]?.status ?? 'ok'" />
            </div>
            <div class="border-t pt-3">
              <div
                v-for="actuator in mockActuators"
                :key="actuator.id"
                class="mb-3 flex items-center justify-between gap-3 last:mb-0"
              >
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium">{{ actuator.name }}</p>
                  <p class="text-xs text-muted-foreground">{{ ACTUATOR_TYPE[actuator.type].label }}</p>
                </div>
                <span
                  class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset"
                  :class="ACTUATOR_STATE[actuator.state].badge"
                >
                  <span class="size-1.5 rounded-full" :class="ACTUATOR_STATE[actuator.state].dot" />
                  {{ ACTUATOR_STATE[actuator.state].label }}
                </span>
              </div>
              <p class="pt-3 text-xs text-muted-foreground">
                Actuadores: datos de demostración. El envío de comandos aún no está disponible en el backend.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
