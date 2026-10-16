<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { LngLatBounds, Map as MapLibreMap, Marker, Popup } from 'maplibre-gl'
import { initMapLibre } from '@/lib/map'
import type { Reading, ReadingStatus, Sensor } from '@/types/api'

const props = defineProps<{
  sensors: Sensor[]
  latest: Record<string, Reading>
}>()

const container = ref<HTMLDivElement | null>(null)
let map: MapLibreMap | null = null
const markers = new Map<string, { marker: Marker; el: HTMLDivElement }>()

function statusColor(status?: ReadingStatus): string {
  if (status === 'alert') return '#e11d48'
  if (status === 'warning') return '#f59e0b'
  if (status === 'ok') return '#22c55e'
  return '#64748b'
}

function createDot(color: string): HTMLDivElement {
  const el = document.createElement('div')
  el.style.width = '14px'
  el.style.height = '14px'
  el.style.borderRadius = '50%'
  el.style.backgroundColor = color
  el.style.border = '2px solid #fff'
  el.style.boxShadow = '0 0 4px rgba(0,0,0,0.5)'
  return el
}

function renderMarkers() {
  if (!map) return
  for (const { marker } of markers.values()) marker.remove()
  markers.clear()

  for (const sensor of props.sensors) {
    if (sensor.latitude == null || sensor.longitude == null) continue
    const reading = props.latest[sensor.id]
    const el = createDot(statusColor(reading?.status))
    const popupText = reading
      ? `${sensor.name} — ${reading.value} ${sensor.unit} (${reading.status})`
      : `${sensor.name} — no data`
    const marker = new Marker({ element: el })
      .setLngLat([sensor.longitude, sensor.latitude])
      .setPopup(new Popup({ offset: 15 }).setText(popupText))
      .addTo(map)
    markers.set(sensor.id, { marker, el })
  }
}

function updateMarkerColors() {
  for (const [sensorId, { el }] of markers.entries()) {
    el.style.backgroundColor = statusColor(props.latest[sensorId]?.status)
  }
}

function fitToSensors() {
  if (!map) return
  const positioned = props.sensors.filter((s) => s.latitude != null && s.longitude != null)
  if (positioned.length === 0) return
  const bounds = new LngLatBounds()
  for (const s of positioned) bounds.extend([s.longitude!, s.latitude!])
  map.fitBounds(bounds, { padding: 60, maxZoom: 12 })
}

onMounted(() => {
  if (!container.value) return
  initMapLibre()
  map = new MapLibreMap({
    container: container.value,
    style: 'https://demotiles.maplibre.org/style.json',
    center: [0, 0],
    zoom: 2,
  })
  renderMarkers()
  fitToSensors()
})

watch(
  () => props.sensors,
  () => {
    renderMarkers()
    fitToSensors()
  },
)
watch(() => props.latest, updateMarkerColors, { deep: true })

onBeforeUnmount(() => {
  for (const { marker } of markers.values()) marker.remove()
  markers.clear()
  map?.remove()
})
</script>

<template>
  <div ref="container" class="h-full w-full min-h-[320px] rounded-xl" />
</template>
