import { ref } from 'vue'
import { listReadings } from '@/lib/api'
import { mockReadings } from '@/data/mock'
import type { Reading } from '@/types/api'

export function useReadingsHistory() {
  const readings = ref<Reading[]>([])
  const loading = ref(false)
  const fallback = ref(false)

  async function load(sensorId?: string, limit = 500) {
    loading.value = true
    try {
      readings.value = await listReadings(sensorId, limit)
      fallback.value = false
    } catch {
      readings.value = mockReadings
      fallback.value = true
    } finally {
      loading.value = false
    }
  }

  return { readings, loading, fallback, load }
}
