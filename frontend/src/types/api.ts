export type ReadingStatus = 'ok' | 'warning' | 'alert'

export type SensorType = 'nivel_boya' | 'nivel_hidrostatico' | 'precipitacion' | 'turbidez' | 'solidos_suspendidos'

export interface Sensor {
  id: string
  name: string
  type: SensorType
  unit: string
  latitude: number | null
  longitude: number | null
  low_threshold: number | null
  high_threshold: number | null
  zone?: string
  created_at: string
}

export interface SensorInput {
  name: string
  type: string
  unit: string
  latitude: number | null
  longitude: number | null
  low_threshold: number | null
  high_threshold: number | null
}

export interface Reading {
  id: number
  sensor_id: string
  value: number
  status: ReadingStatus
  timestamp: string
}
