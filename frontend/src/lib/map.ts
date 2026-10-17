import { setWorkerUrl } from 'maplibre-gl'
import type { StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'

let initialized = false

export function initMapLibre(): void {
  if (initialized) return
  setWorkerUrl(mapWorkerUrl)
  initialized = true
}

export const TERRAIN_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    terrain: {
      type: 'raster',
      tiles: [
        'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
        'https://b.tile.opentopomap.org/{z}/{x}/{y}.png',
        'https://c.tile.opentopomap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      maxzoom: 17,
      attribution:
        'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)',
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#e8e0d8' },
    },
    {
      id: 'terrain',
      type: 'raster',
      source: 'terrain',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
}
