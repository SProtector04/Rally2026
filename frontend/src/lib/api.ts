import type { Reading, Sensor, SensorInput } from '@/types/api'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`)
  }
  return response.json() as Promise<T>
}

export function listSensors(): Promise<Sensor[]> {
  return request<Sensor[]>('/api/sensors')
}

export function createSensor(payload: SensorInput): Promise<Sensor> {
  return request<Sensor>('/api/sensors', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listReadings(sensorId?: string, limit = 100): Promise<Reading[]> {
  const params = new URLSearchParams()
  if (sensorId) params.set('sensor_id', sensorId)
  params.set('limit', String(limit))
  return request<Reading[]>(`/api/readings?${params.toString()}`)
}

export function createReading(payload: {
  sensor_id: string
  value: number
  timestamp?: string
  status?: Reading['status']
}): Promise<Reading> {
  return request<Reading>('/api/readings', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateReading(
  id: number,
  payload: Partial<{
    sensor_id: string
    value: number
    timestamp: string
    status: Reading['status']
  }>,
): Promise<Reading> {
  return request<Reading>(`/api/readings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function readingsWebSocketUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${protocol}://${window.location.host}/ws/readings`
}
