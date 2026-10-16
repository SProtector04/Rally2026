import { setWorkerUrl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'

let initialized = false

export function initMapLibre(): void {
  if (initialized) return
  setWorkerUrl(mapWorkerUrl)
  initialized = true
}
