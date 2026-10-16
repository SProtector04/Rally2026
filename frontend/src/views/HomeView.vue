<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import MapView from '@/components/MapView.vue'
import ReadingChart from '@/components/ReadingChart.vue'
import { useReadings } from '@/composables/useReadings'
import { listSensors } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Sensor } from '@/types/api'

const { connected, latest, history, connect, disconnect } = useReadings()
const sensors = ref<Sensor[]>([])

const alertCount = computed(
  () => Object.values(latest.value).filter((r) => r.status === 'alert').length,
)
const warningCount = computed(
  () => Object.values(latest.value).filter((r) => r.status === 'warning').length,
)

onMounted(async () => {
  try {
    sensors.value = await listSensors()
  } catch {
    // Backend not reachable yet; map/table stay empty.
  }
  connect()
})
</script>

<template>
  <main class="mx-auto max-w-7xl space-y-6 p-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Sensor Monitoring</h1>
        <p class="text-muted-foreground text-sm">
          Live readings via MQTT &rarr; Redis &rarr; WebSocket, analyzed on the server.
        </p>
      </div>
      <div class="flex items-center gap-3">
        <span
          class="inline-flex items-center gap-2 text-sm"
          :class="connected ? 'text-primary' : 'text-destructive'"
        >
          <span class="h-2 w-2 rounded-full" :class="connected ? 'bg-primary' : 'bg-destructive'" />
          {{ connected ? 'Connected' : 'Disconnected' }}
        </span>
        <Button variant="outline" size="sm" @click="connected ? disconnect() : connect()">
          {{ connected ? 'Disconnect' : 'Connect' }}
        </Button>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Sensors</CardTitle>
          <CardDescription>Registered</CardDescription>
        </CardHeader>
        <CardContent class="text-3xl font-semibold">{{ sensors.length }}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle class="text-destructive">Alerts</CardTitle>
          <CardDescription>Active</CardDescription>
        </CardHeader>
        <CardContent class="text-3xl font-semibold text-destructive">
          {{ alertCount }}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle class="text-amber-500">Warnings</CardTitle>
          <CardDescription>Active</CardDescription>
        </CardHeader>
        <CardContent class="text-3xl font-semibold text-amber-500">
          {{ warningCount }}
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <Card class="min-h-[400px]">
        <CardHeader>
          <CardTitle>Sensor Map</CardTitle>
          <CardDescription>maplibre-gl</CardDescription>
        </CardHeader>
        <CardContent class="h-[360px]">
          <MapView :sensors="sensors" :latest="latest" />
        </CardContent>
      </Card>
      <Card class="min-h-[400px]">
        <CardHeader>
          <CardTitle>Reading History</CardTitle>
          <CardDescription>chart.js</CardDescription>
        </CardHeader>
        <CardContent class="h-[360px]">
          <ReadingChart :history="history" :sensors="sensors" />
        </CardContent>
      </Card>
    </div>
  </main>
</template>
