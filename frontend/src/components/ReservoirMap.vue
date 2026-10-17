<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { LngLatBounds, Map as MapLibreMap, Marker, Popup } from 'maplibre-gl'
import { initMapLibre, TERRAIN_STYLE } from '@/lib/map'
import { LA_MARAVILLA } from '@/data/mock'
import type { Reading, ReadingStatus, Sensor } from '@/types/api'
import type { Actuator } from '@/types/domain'
import { ACTUATOR_STATE, ACTUATOR_TYPE } from '@/lib/device'

const props = defineProps<{
  sensors: Sensor[]
  actuators: Actuator[]
  latest: Record<string, Reading>
}>()

const container = ref<HTMLDivElement | null>(null)
let map: MapLibreMap | null = null
const markers = new Map<string, { marker: Marker; el: HTMLDivElement }>()
const SITE_RADIUS_DEG = 0.05

function statusColor(status?: ReadingStatus): string {
  if (status === 'alert') return '#f43f5e'
  if (status === 'warning') return '#f59e0b'
  if (status === 'ok') return '#10b981'
  return '#64748b'
}

function createSensorDot(color: string): HTMLDivElement {
  const el = document.createElement('div')
  el.style.cssText =
    'width:14px;height:14px;border-radius:50%;background:' +
    color +
    ';border:2px solid #fff;box-shadow:0 0 4px rgba(0,0,0,0.4)'
  return el
}

function createActuatorDiamond(color: string, letter: string): HTMLDivElement {
  const el = document.createElement('div')
  el.style.cssText =
    'width:20px;height:20px;transform:rotate(45deg);background:' +
    color +
    ';border:2px solid #fff;border-radius:4px;box-shadow:0 0 4px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center'
  const span = document.createElement('span')
  span.textContent = letter
  span.style.cssText = 'transform:rotate(-45deg);font-size:10px;font-weight:700;color:#fff;line-height:1'
  el.appendChild(span)
  return el
}

function sensorPopup(sensor: Sensor, reading?: Reading): string {
  const state = reading ? `${reading.value} ${sensor.unit} (${reading.status})` : 'Sin datos'
  return `<strong>${sensor.name}</strong><br/><span>SENSOR · ${sensor.type}</span><br/><span>${state}</span>`
}

function actuatorPopup(actuator: Actuator): string {
  const state = ACTUATOR_STATE[actuator.state].label
  return `<strong>${actuator.name}</strong><br/><span>ACTUADOR · ${ACTUATOR_TYPE[actuator.type].label}</span><br/><span>${state} — ${actuator.lastAction}</span><br/><span>${actuator.description}</span>`
}

function renderMarkers() {
  if (!map) return
  for (const { marker } of markers.values()) marker.remove()
  markers.clear()

  for (const sensor of props.sensors) {
    if (sensor.latitude == null || sensor.longitude == null) continue
    const reading = props.latest[sensor.id]
    const el = createSensorDot(statusColor(reading?.status))
    const marker = new Marker({ element: el })
      .setLngLat([sensor.longitude, sensor.latitude])
      .setPopup(new Popup({ offset: 15 }).setHTML(sensorPopup(sensor, reading)))
      .addTo(map)
    markers.set(sensor.id, { marker, el })
  }

  for (const actuator of props.actuators) {
    const el = createActuatorDiamond(
      ACTUATOR_STATE[actuator.state].color,
      ACTUATOR_TYPE[actuator.type].letter,
    )
    const marker = new Marker({ element: el })
      .setLngLat([actuator.longitude, actuator.latitude])
      .setPopup(new Popup({ offset: 15 }).setHTML(actuatorPopup(actuator)))
      .addTo(map)
    markers.set(`a-${actuator.id}`, { marker, el })
  }
}

function nearSite(lat?: number | null, lng?: number | null): boolean {
  if (lat == null || lng == null) return false
  return (
    Math.abs(lat - LA_MARAVILLA.lat) <= SITE_RADIUS_DEG &&
    Math.abs(lng - LA_MARAVILLA.lng) <= SITE_RADIUS_DEG
  )
}

function fitToDevices() {
  if (!map) return
  const positioned = [
    ...props.sensors.filter((s) => nearSite(s.latitude, s.longitude)),
    ...props.actuators.filter((a) => nearSite(a.latitude, a.longitude)),
  ]
  if (positioned.length === 0) return
  const bounds = new LngLatBounds()
  for (const d of positioned) bounds.extend([d.longitude!, d.latitude!])
  map.fitBounds(bounds, { padding: 60, maxZoom: 16 })
}

function addSiteMarker(target: MapLibreMap) {
  const el = document.createElement('div')
  el.textContent = LA_MARAVILLA.name
  el.style.cssText =
    'padding:2px 10px;border-radius:999px;background:#3c8ca7;color:#fff;font-size:11px;font-weight:600;white-space:nowrap;border:1px solid rgba(255,255,255,0.85);box-shadow:0 1px 4px rgba(0,0,0,0.35)'
  new Marker({ element: el })
    .setLngLat([LA_MARAVILLA.lng, LA_MARAVILLA.lat])
    .setPopup(
      new Popup({ offset: 15 }).setHTML(
        `<strong>Micropresa ${LA_MARAVILLA.name}</strong><br/><span>${LA_MARAVILLA.lat.toFixed(5)}, ${LA_MARAVILLA.lng.toFixed(5)}</span>`,
      ),
    )
    .addTo(target)
}

onMounted(() => {
  if (!container.value) return
  initMapLibre()
  map = new MapLibreMap({
    container: container.value,
    style: TERRAIN_STYLE,
    center: [LA_MARAVILLA.lng, LA_MARAVILLA.lat],
    zoom: 15,
  })
  addSiteMarker(map)
  renderMarkers()
  fitToDevices()
})

watch(() => props.sensors, () => {
  renderMarkers()
  fitToDevices()
})
watch(() => props.actuators, () => {
  renderMarkers()
  fitToDevices()
})
watch(
  () => props.latest,
  () => {
    for (const [sensorId, { el }] of markers.entries()) {
      if (sensorId.startsWith('a-')) continue
      el.style.background = statusColor(props.latest[sensorId]?.status)
    }
  },
  { deep: true },
)

onBeforeUnmount(() => {
  for (const { marker } of markers.values()) marker.remove()
  markers.clear()
  map?.remove()
})
</script>

<template>
  <div ref="container" class="h-full w-full min-h-[320px] rounded-xl" />
</template>
