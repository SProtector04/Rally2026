<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Bar, Doughnut } from 'vue-chartjs'
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Legend,
  Tooltip,
} from 'chart.js'
import { Activity, AlertTriangle, CircleCheck, Gauge, Waves } from '@lucide/vue'
import MapView from '@/components/MapView.vue'
import ReadingChart from '@/components/ReadingChart.vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSensors } from '@/composables/useSensors'
import { useReadingsHistory } from '@/composables/useReadingsHistory'
import { useReadings } from '@/composables/useReadings'
import { latestBySensor } from '@/lib/readings'

ChartJS.register(CategoryScale, LinearScale, ArcElement, BarElement, Legend, Tooltip)

const { sensors, fallback: sensorsFallback, load: loadSensors } = useSensors()
const { readings: history, fallback: readingsFallback, load: loadHistory } = useReadingsHistory()
const { connected, latest, connect } = useReadings()

const isDemo = computed(() => sensorsFallback.value || readingsFallback.value)

const alerts = computed(() => Object.values(latest.value).filter((r) => r.status === 'alert'))
const warnings = computed(() => Object.values(latest.value).filter((r) => r.status === 'warning'))
const ok = computed(() => Object.values(latest.value).filter((r) => r.status === 'ok'))

const availability = computed(() =>
  sensors.value.length === 0 ? 0 : Math.round((ok.value.length / sensors.value.length) * 100),
)

const doughnutData = computed(() => ({
  labels: ['Normal', 'Atención', 'Alerta'],
  datasets: [
    {
      data: [ok.value.length, warnings.value.length, alerts.value.length],
      backgroundColor: ['#34d399', '#fbbf24', '#fb7185'],
      borderWidth: 0,
    },
  ],
}))

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: {
    legend: { position: 'bottom' as const },
  },
}

const readingsBySensor = computed(() => {
  const counts = sensors.value.map((s) => ({
    name: s.name.split(' ').slice(0, 2).join(' '),
    count: history.value.filter((r) => r.sensor_id === s.id).length,
  }))
  return {
    labels: counts.map((c) => c.name),
    datasets: [
      {
        label: 'Lecturas',
        data: counts.map((c) => c.count),
        backgroundColor: ['#38bdf8', '#34d399', '#2dd4bf', '#0ea5e9', '#4ade80', '#22d3ee'],
        borderRadius: 6,
      },
    ],
  }
})

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
  scales: {
    y: { beginAtZero: true, ticks: { precision: 0 } },
  },
}

const kpis = computed(() => [
  {
    label: 'Sensores activos',
    value: sensors.value.length,
    icon: Gauge,
    tone: 'text-sky-500 bg-sky-500/10',
  },
  {
    label: 'En alerta',
    value: alerts.value.length,
    icon: AlertTriangle,
    tone: 'text-rose-500 bg-rose-500/10',
  },
  {
    label: 'En atención',
    value: warnings.value.length,
    icon: Activity,
    tone: 'text-amber-500 bg-amber-500/10',
  },
  {
    label: 'Disponibilidad',
    value: `${availability.value}%`,
    icon: CircleCheck,
    tone: 'text-emerald-500 bg-emerald-500/10',
  },
])

onMounted(async () => {
  await Promise.all([loadSensors(), loadHistory(undefined, 200)])
  latest.value = { ...latestBySensor(history.value), ...latest.value }
  connect()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Monitoreo del reservorio</h1>
        <p class="text-sm text-muted-foreground">
          Lecturas en tiempo real clasificadas por umbrales.
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
              class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
            />
            <span
              class="relative inline-flex size-2 rounded-full"
              :class="connected ? 'bg-emerald-500' : 'bg-muted-foreground'"
            />
          </span>
          {{ connected ? 'En línea' : 'Sin conexión en vivo' }}
        </span>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card v-for="kpi in kpis" :key="kpi.label">
        <CardContent class="flex items-center gap-4">
          <div class="flex size-11 shrink-0 items-center justify-center rounded-xl" :class="kpi.tone">
            <component :is="kpi.icon" class="size-5" />
          </div>
          <div class="min-w-0">
            <p class="text-2xl font-semibold leading-none">{{ kpi.value }}</p>
            <p class="mt-1 truncate text-sm text-muted-foreground">{{ kpi.label }}</p>
          </div>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <Card class="lg:col-span-2">
        <CardHeader>
          <CardTitle>Evolución de lecturas</CardTitle>
          <CardDescription>Últimas muestras por sensor</CardDescription>
        </CardHeader>
        <CardContent class="h-[320px]">
          <ReadingChart :history="history" :sensors="sensors" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribución de estados</CardTitle>
          <CardDescription>Porcentaje de sensores</CardDescription>
        </CardHeader>
        <CardContent class="h-[320px]">
          <Doughnut :data="doughnutData" :options="doughnutOptions" />
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Mapa de sensores</CardTitle>
          <CardDescription>Estado en vivo sobre el terreno</CardDescription>
        </CardHeader>
        <CardContent class="h-[340px]">
          <MapView :sensors="sensors" :latest="latest" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex-row items-center justify-between">
          <div>
            <CardTitle class="flex items-center gap-2">
              <Waves class="size-4 text-primary" />
              Lecturas por sensor
            </CardTitle>
            <CardDescription>Volumen de muestras registradas</CardDescription>
          </div>
        </CardHeader>
        <CardContent class="h-[340px]">
          <Bar :data="readingsBySensor" :options="barOptions" />
        </CardContent>
      </Card>
    </div>
  </div>
</template>
