import type { ReadingStatus } from '@/types/api'

export interface StatusMeta {
  label: string
  badge: string
  dot: string
  fill: string
}

export const STATUS_META: Record<ReadingStatus, StatusMeta> = {
  ok: {
    label: 'Normal',
    badge:
      'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30',
    dot: 'bg-emerald-500',
    fill: '#22c55e',
  },
  warning: {
    label: 'Atención',
    badge:
      'bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30',
    dot: 'bg-amber-500',
    fill: '#f59e0b',
  },
  alert: {
    label: 'Alerta',
    badge:
      'bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/30',
    dot: 'bg-rose-500',
    fill: '#f43f5e',
  },
}

export const STATUS_LABEL: Record<ReadingStatus, string> = {
  ok: STATUS_META.ok.label,
  warning: STATUS_META.warning.label,
  alert: STATUS_META.alert.label,
}

export const UNKNOWN_FILL = '#94a3b8'

export function statusFill(status?: ReadingStatus): string {
  return status ? STATUS_META[status].fill : UNKNOWN_FILL
}

/** Brand-derived categorical palette for charts (steel → green → amber → rose → slate → sky). */
export const CHART_PALETTE = ['#3c8ca7', '#34a426', '#f59e0b', '#e11d48', '#48817a', '#0ea5e9']
