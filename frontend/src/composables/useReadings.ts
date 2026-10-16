import { onBeforeUnmount, ref } from 'vue'
import { readingsWebSocketUrl } from '@/lib/api'
import type { Reading } from '@/types/api'

const MAX_HISTORY = 60

export function useReadings() {
  const connected = ref(false)
  const latest = ref<Record<string, Reading>>({})
  const history = ref<Reading[]>([])
  let socket: WebSocket | null = null

  function connect() {
    if (socket) return
    socket = new WebSocket(readingsWebSocketUrl())

    socket.onopen = () => {
      connected.value = true
    }
    socket.onclose = () => {
      connected.value = false
      socket = null
    }
    socket.onerror = () => {
      connected.value = false
    }
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as Reading
        latest.value = { ...latest.value, [data.sensor_id]: data }
        history.value = [...history.value, data].slice(-MAX_HISTORY)
      } catch {
        // Ignore malformed frames.
      }
    }
  }

  function disconnect() {
    socket?.close()
    socket = null
  }

  onBeforeUnmount(disconnect)

  return { connected, latest, history, connect, disconnect }
}
