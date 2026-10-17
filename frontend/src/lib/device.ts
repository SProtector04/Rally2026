import type { ActuatorState, ActuatorType } from '@/types/domain'
import { STATUS_META, UNKNOWN_FILL } from '@/lib/status'

export const ACTUATOR_STATE: Record<
  ActuatorState,
  { label: string; color: string; badge: string; dot: string }
> = {
  active: {
    label: 'Activo',
    color: STATUS_META.ok.fill,
    badge: STATUS_META.ok.badge,
    dot: STATUS_META.ok.dot,
  },
  idle: {
    label: 'Inactivo',
    color: UNKNOWN_FILL,
    badge:
      'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-500/30',
    dot: 'bg-slate-400',
  },
  error: {
    label: 'Falla',
    color: STATUS_META.alert.fill,
    badge: STATUS_META.alert.badge,
    dot: STATUS_META.alert.dot,
  },
}

export const ACTUATOR_TYPE: Record<ActuatorType, { label: string; letter: string }> = {
  pump: { label: 'Bomba de achique', letter: 'B' },
  gate: { label: 'Compuerta', letter: 'C' },
}
