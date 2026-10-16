import type { ActuatorState, ActuatorType } from '@/types/domain'

export const ACTUATOR_STATE: Record<
  ActuatorState,
  { label: string; color: string; badge: string; dot: string }
> = {
  active: {
    label: 'Activo',
    color: '#10b981',
    badge:
      'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30',
    dot: 'bg-emerald-500',
  },
  idle: {
    label: 'Inactivo',
    color: '#64748b',
    badge:
      'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-500/30',
    dot: 'bg-slate-400',
  },
  error: {
    label: 'Falla',
    color: '#f43f5e',
    badge:
      'bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/30',
    dot: 'bg-rose-500',
  },
}

export const ACTUATOR_TYPE: Record<ActuatorType, { label: string; letter: string }> = {
  valve: { label: 'Válvula', letter: 'V' },
  pump: { label: 'Bomba', letter: 'P' },
  gate: { label: 'Compuerta', letter: 'C' },
  aerator: { label: 'Aireador', letter: 'A' },
}
