import type { Reading } from '@/types/api'

export function latestBySensor(readings: Reading[]): Record<string, Reading> {
  const latest: Record<string, Reading> = {}
  for (const reading of readings) {
    const current = latest[reading.sensor_id]
    if (!current || new Date(reading.timestamp) > new Date(current.timestamp)) {
      latest[reading.sensor_id] = reading
    }
  }
  return latest
}

export function statusCounts(readings: Reading[]): {
  ok: number
  warning: number
  alert: number
} {
  const counts = { ok: 0, warning: 0, alert: 0 }
  for (const reading of readings) {
    if (reading.status === 'ok') counts.ok += 1
    else if (reading.status === 'warning') counts.warning += 1
    else if (reading.status === 'alert') counts.alert += 1
  }
  return counts
}
