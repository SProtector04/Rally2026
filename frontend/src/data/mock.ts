import type { Reading, ReadingStatus, Sensor } from '@/types/api'
import type {
  Actuator,
  AlertPreference,
  ForumPost,
  Poll,
  ScheduleEntry,
  User,
} from '@/types/domain'

export const LA_MARAVILLA = {
  name: 'La Maravilla',
  lat: 12.128772951717632,
  lng: -86.18159277757499,
}

function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export const mockSensors: Sensor[] = [
  {
    id: 'a1f0c3a0-1111-4000-8000-000000000001',
    name: 'Temperatura del agua',
    type: 'temperatura',
    unit: '°C',
    latitude: LA_MARAVILLA.lat + 0.0012,
    longitude: LA_MARAVILLA.lng - 0.001,
    low_threshold: 8,
    high_threshold: 26,
    created_at: '2025-11-02T10:00:00Z',
  },
  {
    id: 'a1f0c3a0-1111-4000-8000-000000000002',
    name: 'Nivel del reservorio',
    type: 'nivel',
    unit: 'm',
    latitude: LA_MARAVILLA.lat - 0.0008,
    longitude: LA_MARAVILLA.lng + 0.0012,
    low_threshold: 2,
    high_threshold: 9,
    created_at: '2025-11-02T10:00:00Z',
  },
  {
    id: 'a1f0c3a0-1111-4000-8000-000000000003',
    name: 'pH del agua',
    type: 'ph',
    unit: 'pH',
    latitude: LA_MARAVILLA.lat + 0.0004,
    longitude: LA_MARAVILLA.lng + 0.002,
    low_threshold: 6.5,
    high_threshold: 8.5,
    created_at: '2025-11-03T10:00:00Z',
  },
  {
    id: 'a1f0c3a0-1111-4000-8000-000000000004',
    name: 'Caudal de salida',
    type: 'caudal',
    unit: 'm³/s',
    latitude: LA_MARAVILLA.lat + 0.002,
    longitude: LA_MARAVILLA.lng - 0.002,
    low_threshold: 0.5,
    high_threshold: 4,
    created_at: '2025-11-03T10:00:00Z',
  },
  {
    id: 'a1f0c3a0-1111-4000-8000-000000000005',
    name: 'Humedad del suelo',
    type: 'humedad',
    unit: '%',
    latitude: LA_MARAVILLA.lat - 0.002,
    longitude: LA_MARAVILLA.lng - 0.0018,
    low_threshold: 30,
    high_threshold: 75,
    created_at: '2025-11-04T10:00:00Z',
  },
  {
    id: 'a1f0c3a0-1111-4000-8000-000000000006',
    name: 'Turbidez',
    type: 'turbidez',
    unit: 'NTU',
    latitude: LA_MARAVILLA.lat - 0.0004,
    longitude: LA_MARAVILLA.lng + 0.0005,
    low_threshold: 0,
    high_threshold: 20,
    created_at: '2025-11-04T10:00:00Z',
  },
]

export const mockActuators: Actuator[] = [
  {
    id: 'b2f0d3b0-2222-4000-8000-000000000001',
    name: 'Válvula de desagüe',
    type: 'valve',
    state: 'active',
    latitude: LA_MARAVILLA.lat + 0.0016,
    longitude: LA_MARAVILLA.lng - 0.0024,
    lastAction: 'Apertura al 40%',
    description: 'Regula el desagüe de fondo del reservorio.',
  },
  {
    id: 'b2f0d3b0-2222-4000-8000-000000000002',
    name: 'Bomba de recirculación',
    type: 'pump',
    state: 'idle',
    latitude: LA_MARAVILLA.lat - 0.0014,
    longitude: LA_MARAVILLA.lng + 0.002,
    lastAction: 'Detenida',
    description: 'Recircula agua para oxigenación.',
  },
  {
    id: 'b2f0d3b0-2222-4000-8000-000000000003',
    name: 'Compuerta norte',
    type: 'gate',
    state: 'active',
    latitude: LA_MARAVILLA.lat + 0.0025,
    longitude: LA_MARAVILLA.lng + 0.0008,
    lastAction: 'Cerrada al 100%',
    description: 'Controla el ingreso desde el canal norte.',
  },
  {
    id: 'b2f0d3b0-2222-4000-8000-000000000004',
    name: 'Aireador de superficie',
    type: 'aerator',
    state: 'error',
    latitude: LA_MARAVILLA.lat - 0.001,
    longitude: LA_MARAVILLA.lng - 0.0008,
    lastAction: 'Falla de motor',
    description: 'Mantiene los niveles de oxígeno disuelto.',
  },
]

export function classify(value: number, sensor: Sensor): ReadingStatus {
  const high = sensor.high_threshold
  const low = sensor.low_threshold
  if (high != null && value >= high) return 'alert'
  if (low != null && value <= low) return 'alert'
  if (high != null && value >= high * 0.85) return 'warning'
  if (low != null && value <= low * 1.15) return 'warning'
  return 'ok'
}

export function generateReadings(): Reading[] {
  const now = Date.now()
  const out: Reading[] = []
  mockSensors.forEach((sensor, sensorIndex) => {
    const count = 10
    const high = sensor.high_threshold ?? 50
    const low = sensor.low_threshold ?? 0
    const mid = (high + low) / 2
    const amplitude = Math.abs(high - low) * 0.45
    for (let i = 0; i < count; i++) {
      const timestamp = new Date(now - (count - i) * 5 * 60_000).toISOString()
      const value = round(mid + Math.sin(i * 0.9 + sensorIndex) * amplitude, 1)
      out.push({
        id: out.length + 1,
        sensor_id: sensor.id,
        value,
        status: classify(value, sensor),
        timestamp,
      })
    }
  })
  return out
}

export const mockReadings: Reading[] = generateReadings()

export const seedUsers: User[] = [
  {
    id: 'u-001',
    name: 'Valentina Ruiz',
    email: 'admin@hydropix.ar',
    role: 'admin',
    active: true,
    joinedAt: '2025-09-12',
  },
  {
    id: 'u-002',
    name: 'Mateo Costa',
    email: 'voluntario@hydropix.ar',
    role: 'volunteer',
    active: true,
    joinedAt: '2025-10-03',
  },
  {
    id: 'u-003',
    name: 'Lucía Fernández',
    email: 'lucia@hydropix.ar',
    role: 'volunteer',
    active: true,
    joinedAt: '2025-10-20',
  },
  {
    id: 'u-004',
    name: 'Joaquín Pérez',
    email: 'joaquin@hydropix.ar',
    role: 'volunteer',
    active: false,
    joinedAt: '2025-11-01',
  },
]

export const seedPosts: ForumPost[] = [
  {
    id: 'p-001',
    author: 'Valentina Ruiz',
    title: 'Plan de mantenimiento de compuertas para marzo',
    body: 'Propongo coordinar el mantenimiento preventivo de las compuertas norte y sur durante la primera semana de marzo, antes de la temporada de lluvias.',
    type: 'proposal',
    votes: 12,
    myVote: 0,
    replies: 5,
    createdAt: '2026-01-14T09:20:00Z',
  },
  {
    id: 'p-002',
    author: 'Mateo Costa',
    title: '¿Cómo se calibra el sensor de turbidez?',
    body: 'El sensor de turbidez del sector este marca valores anómalos. ¿Alguien tiene documentado el procedimiento de calibración?',
    type: 'qa',
    votes: 7,
    myVote: 0,
    replies: 3,
    createdAt: '2026-01-16T14:05:00Z',
  },
  {
    id: 'p-003',
    author: 'Lucía Fernández',
    title: 'Limpieza de márgenes este sábado',
    body: 'Necesitamos al menos cuatro voluntarios para la jornada de limpieza de las márgenes. Anotarse en los comentarios.',
    type: 'task',
    votes: 9,
    myVote: 0,
    replies: 8,
    createdAt: '2026-01-17T11:30:00Z',
  },
]

export const seedPolls: Poll[] = [
  {
    id: 'v-001',
    question: '¿Qué horario preferís para la jornada de mantenimiento?',
    options: [
      { id: 'o-1', label: 'Sábado 08:00 – 12:00', votes: 6 },
      { id: 'o-2', label: 'Sábado 14:00 – 18:00', votes: 9 },
      { id: 'o-3', label: 'Domingo 09:00 – 13:00', votes: 4 },
    ],
    myOptionId: null,
    closed: false,
  },
  {
    id: 'v-002',
    question: 'Prioridad de inversión para este trimestre',
    options: [
      { id: 'o-4', label: 'Nuevos sensores de nivel', votes: 11 },
      { id: 'o-5', label: 'Reparación de bomba', votes: 5 },
      { id: 'o-6', label: 'Cámara de monitoreo', votes: 7 },
    ],
    myOptionId: null,
    closed: true,
  },
]

export const seedSchedule: ScheduleEntry[] = [
  { id: 's-1', day: 0, start: '08:00', end: '12:00', task: 'Revisión de sensores', location: 'Sector este' },
  { id: 's-2', day: 1, start: '09:00', end: '13:00', task: 'Monitoreo de nivel', location: 'Central' },
  { id: 's-3', day: 3, start: '08:00', end: '12:00', task: 'Limpieza de márgenes', location: 'Márgenes sur' },
  { id: 's-4', day: 5, start: '10:00', end: '14:00', task: 'Inspección de compuertas', location: 'Compuerta norte' },
]

export const seedAlertPrefs: AlertPreference[] = [
  {
    id: 'a-1',
    label: 'Alertas críticas',
    description: 'Niveles de alerta que requieren acción inmediata.',
    enabled: true,
  },
  {
    id: 'a-2',
    label: 'Avisos de advertencia',
    description: 'Valores cercanos a los umbrales configurados.',
    enabled: true,
  },
  {
    id: 'a-3',
    label: 'Resumen semanal',
    description: 'Correo con el resumen de actividad del reservorio.',
    enabled: false,
  },
  {
    id: 'a-4',
    label: 'Recordatorios de turno',
    description: 'Aviso antes de cada turno asignado.',
    enabled: true,
  },
]

export const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
