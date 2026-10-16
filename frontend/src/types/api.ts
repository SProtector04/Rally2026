export type ReadingStatus = 'ok' | 'warning' | 'alert'

export interface Sensor {
  id: string
  name: string
  type: string
  unit: string
  latitude: number | null
  longitude: number | null
  low_threshold: number | null
  high_threshold: number | null
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
