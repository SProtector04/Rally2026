<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js'
import type { Reading, Sensor } from '@/types/api'
import { CHART_PALETTE } from '@/lib/status'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip)

const props = defineProps<{
  history: Reading[]
  sensors: Sensor[]
}>()

function sensorName(id: string): string {
  return props.sensors.find((s) => s.id === id)?.name ?? id.slice(0, 8)
}

function sensorColor(id: string): string {
  const index = props.sensors.findIndex((s) => s.id === id)
  return CHART_PALETTE[Math.max(0, index) % CHART_PALETTE.length]!
}

const chartData = computed(() => {
  const sensorIds = [...new Set(props.history.map((r) => r.sensor_id))]
  return {
    labels: props.history.map((r) => new Date(r.timestamp).toLocaleTimeString()),
    datasets: sensorIds.map((sensorId) => ({
      label: sensorName(sensorId),
      data: props.history.map((r) => (r.sensor_id === sensorId ? r.value : null)),
      borderColor: sensorColor(sensorId),
      backgroundColor: 'transparent',
      spanGaps: true,
      tension: 0.3,
    })),
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: { beginAtZero: true },
  },
  plugins: {
    legend: { position: 'bottom' as const },
  },
}
</script>

<template>
  <div class="h-full w-full">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
