import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { AlertPreference, ScheduleEntry } from '@/types/domain'
import { seedAlertPrefs, seedSchedule } from '@/data/mock'

const SCHEDULE_KEY = 'hydropix.profile.schedule'
const ALERTS_KEY = 'hydropix.profile.alerts'

function load<T>(key: string, seed: T[]): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T[]
  } catch {
    // fall through to seed
  }
  return seed
}

export const useProfileStore = defineStore('profile', () => {
  const schedule = ref<ScheduleEntry[]>(load(SCHEDULE_KEY, seedSchedule))
  const alerts = ref<AlertPreference[]>(load(ALERTS_KEY, seedAlertPrefs))

  function persistSchedule() {
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule.value))
  }

  function addScheduleEntry(entry: Omit<ScheduleEntry, 'id'>) {
    schedule.value.push({ ...entry, id: `s-${Date.now()}` })
    persistSchedule()
  }

  function removeScheduleEntry(id: string) {
    schedule.value = schedule.value.filter((e) => e.id !== id)
    persistSchedule()
  }

  function toggleAlert(id: string) {
    const pref = alerts.value.find((a) => a.id === id)
    if (pref) pref.enabled = !pref.enabled
    localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts.value))
  }

  return {
    schedule,
    alerts,
    addScheduleEntry,
    removeScheduleEntry,
    toggleAlert,
  }
})
