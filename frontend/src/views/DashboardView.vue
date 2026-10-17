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
import PageHeader from '@/components/PageHeader.vue'
import DemoBadge from '@/components/DemoBadge.vue'
import ConnectionBadge from '@/components/ConnectionBadge.vue'
import KpiCard from '@/components/KpiCard.vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSensors } from '@/composables/useSensors'
import { useReadingsHistory } from '@/composables/useReadingsHistory'
import { useReadings } from '@/composables/useReadings'
import { latestBySensor } from '@/lib/readings'
import { CHART_PALETTE, STATUS_META } from '@/lib/status'

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
  labels: [STATUS_META.ok.label, STATUS_META.warning.label, STATUS_META.alert.label],
  datasets: [
    {
      data: [ok.value.length, warnings.value.length, alerts.value.length],
      backgroundColor: [
        STATUS_META.ok.fill,
        STATUS_META.warning.fill,
        STATUS_META.alert.fill,
      ],
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
        backgroundColor: CHART_PALETTE,
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
    tone: 'text-primary bg-primary/10',
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
    <PageHeader title="Monitoreo del reservorio">
      <template #description>Lecturas en tiempo real clasificadas por umbrales.</template>
      <DemoBadge v-if="isDemo" />
      <ConnectionBadge :connected="connected" />
    </PageHeader>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        v-for="kpi in kpis"
        :key="kpi.label"
        :label="kpi.label"
        :value="kpi.value"
        :icon="kpi.icon"
        :tone="kpi.tone"
      />
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
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Waves class="size-4 text-primary" />
            Lecturas por sensor
          </CardTitle>
          <CardDescription>Volumen de muestras registradas</CardDescription>
        </CardHeader>
        <CardContent class="h-[340px]">
          <Bar :data="readingsBySensor" :options="barOptions" />
        </CardContent>
      </Card>
    </div>
  </div>
</template>
