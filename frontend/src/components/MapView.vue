<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { LngLatBounds, Map as MapLibreMap, Marker, Popup } from 'maplibre-gl'
import type { GeoJSONSource } from 'maplibre-gl'
import { initMapLibre, TERRAIN_STYLE } from '@/lib/map'
import { LA_MARAVILLA } from '@/data/mock'
import { statusFill } from '@/lib/status'
import type { Reading, Sensor } from '@/types/api'

const props = defineProps<{
  sensors: Sensor[]
  latest: Record<string, Reading>
}>()

const container = ref<HTMLDivElement | null>(null)
let map: MapLibreMap | null = null
const markers = new Map<string, { marker: Marker; el: HTMLDivElement }>()
const SITE_RADIUS_DEG = 0.05

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
    const el = createDot(statusFill(reading?.status))
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

function buildZoneGeoJSON(): GeoJSON.FeatureCollection {
  const zones = new Map<string, { lat: number; lng: number }[]>()
  for (const s of props.sensors) {
    if (!s.zone || s.latitude == null || s.longitude == null) continue
    if (!zones.has(s.zone)) zones.set(s.zone, [])
    zones.get(s.zone)!.push({ lat: s.latitude, lng: s.longitude })
  }

  const features: GeoJSON.Feature[] = []
  for (const [zone, points] of zones) {
    if (points.length < 2) continue
    const center = points.reduce(
      (acc, p) => ({ lat: acc.lat + p.lat / points.length, lng: acc.lng + p.lng / points.length }),
      { lat: 0, lng: 0 },
    )
    const sorted = [...points].sort((a, b) => Math.atan2(a.lat - center.lat, a.lng - center.lng) - Math.atan2(b.lat - center.lat, b.lng - center.lng))
    const coords = sorted.map((p) => [p.lng, p.lat])
    coords.push(coords[0])
    features.push({
      type: 'Feature',
      properties: { zone },
      geometry: { type: 'LineString', coordinates: coords },
    })
  }
  return { type: 'FeatureCollection', features }
}

function renderZoneLines() {
  if (!map) return
  const source = map.getSource('zone-lines') as GeoJSONSource | undefined
  const geojson = buildZoneGeoJSON()
  if (source) {
    source.setData(geojson)
  } else {
    map.addSource('zone-lines', { type: 'geojson', data: geojson })
    map.addLayer({
      id: 'zone-lines',
      type: 'line',
      source: 'zone-lines',
      paint: {
        'line-color': '#a0a0a0',
        'line-width': 2,
        'line-dasharray': [4, 3],
        'line-opacity': 0.55,
      },
    })
  }
}

function updateMarkerColors() {
  for (const [sensorId, { el }] of markers.entries()) {
    el.style.backgroundColor = statusFill(props.latest[sensorId]?.status)
  }
}

function nearSite(lat?: number | null, lng?: number | null): boolean {
  if (lat == null || lng == null) return false
  return (
    Math.abs(lat - LA_MARAVILLA.lat) <= SITE_RADIUS_DEG &&
    Math.abs(lng - LA_MARAVILLA.lng) <= SITE_RADIUS_DEG
  )
}

function fitToSensors() {
  if (!map) return
  const positioned = props.sensors.filter((s) => nearSite(s.latitude, s.longitude))
  if (positioned.length === 0) return
  const bounds = new LngLatBounds()
  for (const s of positioned) bounds.extend([s.longitude!, s.latitude!])
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
  map.on('load', () => {
    addSiteMarker(map!)
    renderMarkers()
    renderZoneLines()
    fitToSensors()
  })
})

watch(
  () => props.sensors,
  () => {
    renderMarkers()
    renderZoneLines()
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
