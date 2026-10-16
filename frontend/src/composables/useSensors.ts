import { ref } from 'vue'
import { listSensors } from '@/lib/api'
import { mockSensors } from '@/data/mock'
import type { Sensor } from '@/types/api'

export function useSensors() {
  const sensors = ref<Sensor[]>([])
  const loading = ref(false)
  const fallback = ref(false)

  async function load() {
    loading.value = true
    try {
      sensors.value = await listSensors()
      fallback.value = false
    } catch {
      sensors.value = mockSensors
      fallback.value = true
    } finally {
      loading.value = false
    }
  }

  return { sensors, loading, fallback, load }
}
