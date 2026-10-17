import type { Reading, ReadingStatus, Sensor, SensorType } from '@/types/api'
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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Seeded PRNG (mulberry32) so every session produces the same "random" data.
 * Keeps demo mode deterministic and reviewable.
 */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20260115)

function gaussian(): number {
  const u1 = rand()
  const u2 = rand()
  return Math.sqrt(-2 * Math.log(u1 || 1e-10)) * Math.cos(2 * Math.PI * u2)
}

// ─── Sensors ─────────────────────────────────────────────────────────────────
// Taxonomía restringida:
//   Sensores: nivel_boya, nivel_hidrostatico, precipitacion, turbidez, solidos_suspendidos
//   Actuadores: pump (bomba achique sumergible CC 12/24V), gate (actuador lineal eléctrico IP68)
//
// Zonas de la micropresa La Maravilla:
//   Corona, Vertedero, Obra de toma, Talud aguas arriba, Talud aguas abajo,
//   Cuencas tributarias, Zona ambiental, Embalse central

export const SENSOR_ZONES = [
  'Corona',
  'Vertedero',
  'Obra de toma',
  'Talud aguas arriba',
  'Talud aguas abajo',
  'Cuencas tributarias',
  'Zona ambiental',
  'Embalse central',
] as const

export type SensorZone = (typeof SENSOR_ZONES)[number]

// Distribución geográfica por zona (offsets respecto a LA_MARAVILLA)
const ZONE_OFFSETS: Record<SensorZone, { latMin: number; latMax: number; lngMin: number; lngMax: number }> = {
  'Corona':               { latMin: 0.0018, latMax: 0.0028, lngMin: -0.003, lngMax: 0.003 },
  'Vertedero':            { latMin: 0.0005, latMax: 0.0015, lngMin: 0.002,  lngMax: 0.0045 },
  'Obra de toma':         { latMin: -0.0008, latMax: 0.0005, lngMin: 0.002,  lngMax: 0.004 },
  'Talud aguas arriba':   { latMin: 0.001,  latMax: 0.002,  lngMin: -0.0045, lngMax: -0.002 },
  'Talud aguas abajo':    { latMin: -0.0025, latMax: -0.001, lngMin: -0.004, lngMax: -0.0015 },
  'Cuencas tributarias':  { latMin: 0.003,  latMax: 0.005,  lngMin: -0.002, lngMax: 0.002 },
  'Zona ambiental':       { latMin: -0.0035, latMax: -0.002, lngMin: -0.001, lngMax: 0.0015 },
  'Embalse central':      { latMin: -0.001, latMax: 0.001,  lngMin: -0.001, lngMax: 0.001 },
}

function zoneCoord(zone: SensorZone, seed: number): { lat: number; lng: number } {
  const z = ZONE_OFFSETS[zone]
  const r1 = mulberry32(seed)()
  const r2 = mulberry32(seed + 7)()
  return {
    lat: LA_MARAVILLA.lat + z.latMin + (z.latMax - z.latMin) * r1,
    lng: LA_MARAVILLA.lng + z.lngMin + (z.lngMax - z.lngMin) * r2,
  }
}

let sensorIdx = 0
function makeSensor(
  zone: SensorZone,
  name: string,
  type: SensorType,
  unit: string,
  low: number,
  high: number,
  date: string,
): Sensor {
  sensorIdx++
  const { lat, lng } = zoneCoord(zone, sensorIdx * 31 + 7)
  return {
    id: `a1f0c3a0-1111-4000-8000-${String(sensorIdx).padStart(12, '0')}`,
    name,
    type,
    unit,
    latitude: round(lat, 7),
    longitude: round(lng, 7),
    low_threshold: low,
    high_threshold: high,
    zone,
    created_at: date,
  }
}

export const mockSensors: Sensor[] = [
  // ── Corona (4) ──────────────────────────────────────────────────────────────
  makeSensor('Corona', 'Nivel boya — Corona A', 'nivel_boya', 'm', 2.5, 8.5, '2025-11-02T10:00:00Z'),
  makeSensor('Corona', 'Nivel boya — Corona B', 'nivel_boya', 'm', 2.5, 8.5, '2025-11-02T10:00:00Z'),
  makeSensor('Corona', 'Nivel hidrostático — Corona', 'nivel_hidrostatico', 'm', 2.5, 8.5, '2025-11-03T10:00:00Z'),
  makeSensor('Corona', 'Turbidez — Corona', 'turbidez', 'NTU', 0, 20, '2025-11-03T10:00:00Z'),

  // ── Vertedero (4) ───────────────────────────────────────────────────────────
  makeSensor('Vertedero', 'Nivel boya — Vertedero A', 'nivel_boya', 'm', 2.5, 8.5, '2025-11-04T10:00:00Z'),
  makeSensor('Vertedero', 'Nivel boya — Vertedero B', 'nivel_boya', 'm', 2.5, 8.5, '2025-11-04T10:00:00Z'),
  makeSensor('Vertedero', 'Turbidez — Vertedero', 'turbidez', 'NTU', 0, 20, '2025-11-05T10:00:00Z'),
  makeSensor('Vertedero', 'Sólidos suspendidos — Vertedero', 'solidos_suspendidos', 'mg/L', 0, 200, '2025-11-05T10:00:00Z'),

  // ── Obra de toma (4) ────────────────────────────────────────────────────────
  makeSensor('Obra de toma', 'Nivel hidrostático — Toma A', 'nivel_hidrostatico', 'm', 2.5, 8.5, '2025-11-06T10:00:00Z'),
  makeSensor('Obra de toma', 'Nivel hidrostático — Toma B', 'nivel_hidrostatico', 'm', 2.5, 8.5, '2025-11-06T10:00:00Z'),
  makeSensor('Obra de toma', 'Turbidez — Toma', 'turbidez', 'NTU', 0, 20, '2025-11-07T10:00:00Z'),
  makeSensor('Obra de toma', 'Sólidos suspendidos — Toma', 'solidos_suspendidos', 'mg/L', 0, 200, '2025-11-07T10:00:00Z'),

  // ── Talud aguas arriba (4) ──────────────────────────────────────────────────
  makeSensor('Talud aguas arriba', 'Nivel hidrostático — Talud arriba A', 'nivel_hidrostatico', 'm', 2.5, 8.5, '2025-12-01T10:00:00Z'),
  makeSensor('Talud aguas arriba', 'Nivel hidrostático — Talud arriba B', 'nivel_hidrostatico', 'm', 2.5, 8.5, '2025-12-01T10:00:00Z'),
  makeSensor('Talud aguas arriba', 'Precipitación — Talud arriba', 'precipitacion', 'mm', 0, 50, '2025-12-02T10:00:00Z'),
  makeSensor('Talud aguas arriba', 'Turbidez — Talud arriba', 'turbidez', 'NTU', 0, 20, '2025-12-02T10:00:00Z'),

  // ── Talud aguas abajo (4) ───────────────────────────────────────────────────
  makeSensor('Talud aguas abajo', 'Nivel hidrostático — Talud abajo A', 'nivel_hidrostatico', 'm', 2.5, 8.5, '2025-12-03T10:00:00Z'),
  makeSensor('Talud aguas abajo', 'Nivel hidrostático — Talud abajo B', 'nivel_hidrostatico', 'm', 2.5, 8.5, '2025-12-03T10:00:00Z'),
  makeSensor('Talud aguas abajo', 'Precipitación — Talud abajo', 'precipitacion', 'mm', 0, 50, '2025-12-04T10:00:00Z'),
  makeSensor('Talud aguas abajo', 'Sólidos suspendidos — Talud abajo', 'solidos_suspendidos', 'mg/L', 0, 200, '2025-12-04T10:00:00Z'),

  // ── Cuencas tributarias (6) ─────────────────────────────────────────────────
  makeSensor('Cuencas tributarias', 'Nivel boya — Arroyo norte', 'nivel_boya', 'm', 0.3, 3, '2025-12-05T10:00:00Z'),
  makeSensor('Cuencas tributarias', 'Nivel boya — Arroyo sur', 'nivel_boya', 'm', 0.3, 3, '2025-12-05T10:00:00Z'),
  makeSensor('Cuencas tributarias', 'Precipitación — Cuenca norte', 'precipitacion', 'mm', 0, 50, '2025-12-06T10:00:00Z'),
  makeSensor('Cuencas tributarias', 'Precipitación — Cuenca sur', 'precipitacion', 'mm', 0, 50, '2025-12-06T10:00:00Z'),
  makeSensor('Cuencas tributarias', 'Turbidez — Arroyo norte', 'turbidez', 'NTU', 0, 30, '2025-12-07T10:00:00Z'),
  makeSensor('Cuencas tributarias', 'Turbidez — Arroyo sur', 'turbidez', 'NTU', 0, 30, '2025-12-07T10:00:00Z'),

  // ── Zona ambiental (4) ──────────────────────────────────────────────────────
  makeSensor('Zona ambiental', 'Precipitación — Estación meteo A', 'precipitacion', 'mm', 0, 50, '2026-01-02T10:00:00Z'),
  makeSensor('Zona ambiental', 'Precipitación — Estación meteo B', 'precipitacion', 'mm', 0, 50, '2026-01-02T10:00:00Z'),
  makeSensor('Zona ambiental', 'Precipitación — Márgenes', 'precipitacion', 'mm', 0, 50, '2026-01-03T10:00:00Z'),
  makeSensor('Zona ambiental', 'Nivel boya — Embalse sur', 'nivel_boya', 'm', 2.5, 8.5, '2026-01-03T10:00:00Z'),

  // ── Embalse central (10) ────────────────────────────────────────────────────
  makeSensor('Embalse central', 'Nivel boya — Centro A', 'nivel_boya', 'm', 2.5, 8.5, '2026-01-04T10:00:00Z'),
  makeSensor('Embalse central', 'Nivel boya — Centro B', 'nivel_boya', 'm', 2.5, 8.5, '2026-01-04T10:00:00Z'),
  makeSensor('Embalse central', 'Nivel boya — Centro C', 'nivel_boya', 'm', 2.5, 8.5, '2026-01-05T10:00:00Z'),
  makeSensor('Embalse central', 'Nivel hidrostático — Centro A', 'nivel_hidrostatico', 'm', 2.5, 8.5, '2026-01-05T10:00:00Z'),
  makeSensor('Embalse central', 'Nivel hidrostático — Centro B', 'nivel_hidrostatico', 'm', 2.5, 8.5, '2026-01-06T10:00:00Z'),
  makeSensor('Embalse central', 'Turbidez — Centro A', 'turbidez', 'NTU', 0, 20, '2026-01-06T10:00:00Z'),
  makeSensor('Embalse central', 'Turbidez — Centro B', 'turbidez', 'NTU', 0, 20, '2026-01-07T10:00:00Z'),
  makeSensor('Embalse central', 'Sólidos suspendidos — Centro A', 'solidos_suspendidos', 'mg/L', 0, 200, '2026-01-07T10:00:00Z'),
  makeSensor('Embalse central', 'Sólidos suspendidos — Centro B', 'solidos_suspendidos', 'mg/L', 0, 200, '2026-01-08T10:00:00Z'),
  makeSensor('Embalse central', 'Sólidos suspendidos — Centro C', 'solidos_suspendidos', 'mg/L', 0, 200, '2026-01-08T10:00:00Z'),
]

// ─── Actuators ───────────────────────────────────────────────────────────────
// Tipos: pump (bomba achique sumergible CC 12/24V), gate (actuador lineal eléctrico IP68)

let actuatorIdx = 0
function makeActuator(
  zone: SensorZone,
  name: string,
  type: 'pump' | 'gate',
  state: 'active' | 'idle' | 'error',
  lastAction: string,
  description: string,
): Actuator {
  actuatorIdx++
  const { lat, lng } = zoneCoord(zone, actuatorIdx * 41 + 13)
  return {
    id: `b2f0d3b0-2222-4000-8000-${String(actuatorIdx).padStart(12, '0')}`,
    name,
    type,
    state,
    latitude: round(lat, 7),
    longitude: round(lng, 7),
    lastAction,
    description,
  }
}

export const mockActuators: Actuator[] = [
  // ── Corona ──────────────────────────────────────────────────────────────────
  makeActuator('Corona', 'Bomba achique — Corona A', 'pump', 'idle', 'En espera',
    'Bomba sumergible CC 24V para evacuación de emergencia desde la corona.'),
  makeActuator('Corona', 'Compuerta — Corona', 'gate', 'active', 'Apertura al 60%',
    'Actuador lineal eléctrico IP68 que controla el vertido superficial en la cresta.'),

  // ── Vertedero ───────────────────────────────────────────────────────────────
  makeActuator('Vertedero', 'Bomba achique — Vertedero', 'pump', 'active', 'Funcionando al 75%',
    'Bomba sumergible CC 12V de respaldo para el aliviadero principal.'),
  makeActuator('Vertedero', 'Compuerta — Vertedero A', 'gate', 'active', 'Apertura al 100%',
    'Actuador lineal IP68 del aliviadero principal. Control de crecidas.'),
  makeActuator('Vertedero', 'Compuerta — Vertedero B', 'gate', 'idle', 'Cerrada',
    'Compuerta auxiliar del vertedero de emergencia.'),

  // ── Obra de toma ────────────────────────────────────────────────────────────
  makeActuator('Obra de toma', 'Bomba achique — Toma A', 'pump', 'active', 'Funcionando al 50%',
    'Bomba sumergible CC 24V para extracción controlada de agua del embalse.'),
  makeActuator('Obra de toma', 'Bomba achique — Toma B', 'pump', 'idle', 'En espera',
    'Bomba de respaldo para la obra de toma.'),
  makeActuator('Obra de toma', 'Compuerta — Toma principal', 'gate', 'active', 'Apertura al 40%',
    'Actuador lineal IP68 que regula el ingreso al sistema de conducción.'),

  // ── Talud aguas abajo ───────────────────────────────────────────────────────
  makeActuator('Talud aguas abajo', 'Bomba achique — Drenaje', 'pump', 'error', 'Falla de motor',
    'Bomba sumergible CC 12V del sistema de drenaje del talud. Fuera de servicio.'),
  makeActuator('Talud aguas abajo', 'Compuerta — Drenaje', 'gate', 'idle', 'Cerrada',
    'Actuador lineal IP68 del drenaje de pie de talud.'),

  // ── Embalse central ─────────────────────────────────────────────────────────
  makeActuator('Embalse central', 'Bomba achique — Emergencia', 'pump', 'idle', 'En espera',
    'Bomba sumergible CC 24V de alta capacidad para vaciado rápido en emergencia.'),
  makeActuator('Embalse central', 'Compuerta — Fondo', 'gate', 'active', 'Apertura al 30%',
    'Actuador lineal IP68 de desagüe de fondo del embalse.'),
]

// ─── Reading generation ──────────────────────────────────────────────────────
// Generates realistic time-series data with:
//   - Diurnal cycles for level sensors (rain-correlated)
//   - Rainfall spikes for precipitation (balancín)
//   - Turbidity correlated with rainfall events
//   - Suspended solids correlated with turbidity
//
// Each sensor gets 24 readings at 5-min intervals (last 2 hours).

interface SensorProfile {
  base: number
  amplitude: number
  noise: number
  phase: number
  rainSpike?: number
}

const SENSOR_PROFILES: Record<SensorType, SensorProfile> = {
  nivel_boya:           { base: 5.8,  amplitude: 0.6,  noise: 0.15, phase: 0.5, rainSpike: 0.8 },
  nivel_hidrostatico:   { base: 5.6,  amplitude: 0.5,  noise: 0.1,  phase: 0.5, rainSpike: 0.7 },
  precipitacion:        { base: 2,    amplitude: 1.5,  noise: 0.8,  phase: 1.2, rainSpike: 18 },
  turbidez:             { base: 6,    amplitude: 3,    noise: 1.5,  phase: 1.2, rainSpike: 15 },
  solidos_suspendidos:  { base: 45,   amplitude: 15,   noise: 5,    phase: 1.2, rainSpike: 40 },
}

function sensorValue(sensor: Sensor, hourFraction: number, idx: number): number {
  const profile = SENSOR_PROFILES[sensor.type]
  if (!profile) {
    const mid = ((sensor.high_threshold ?? 50) + (sensor.low_threshold ?? 0)) / 2
    return mid + gaussian() * 1.5
  }

  let value = profile.base + profile.amplitude * Math.sin(hourFraction + profile.phase + idx * 0.05)

  // Rainfall event: random spikes every ~8 readings
  if (profile.rainSpike && idx % 8 === 5) {
    value += profile.rainSpike * (0.5 + rand())
  }

  // Gaussian noise
  value += gaussian() * profile.noise

  // Clamp to physically possible range
  const min = sensor.low_threshold != null ? sensor.low_threshold * 0.5 : 0
  const max = sensor.high_threshold != null ? sensor.high_threshold * 1.3 : value + 10
  return round(clamp(value, min, max), 1)
}

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
  const count = 24
  const intervalMs = 5 * 60_000
  const out: Reading[] = []

  mockSensors.forEach((sensor) => {
    for (let i = 0; i < count; i++) {
      const timestamp = new Date(now - (count - i) * intervalMs).toISOString()
      const hourFraction = ((count - i) * 5) / 60 * Math.PI / 12
      const value = sensorValue(sensor, hourFraction, i)
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

// ─── Users ───────────────────────────────────────────────────────────────────

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
  {
    id: 'u-005',
    name: 'Camila Herrera',
    email: 'camila@hydropix.ar',
    role: 'volunteer',
    active: true,
    joinedAt: '2025-12-10',
  },
  {
    id: 'u-006',
    name: 'Santiago López',
    email: 'santiago@hydropix.ar',
    role: 'admin',
    active: true,
    joinedAt: '2025-08-05',
  },
  {
    id: 'u-007',
    name: 'Daniela Ríos',
    email: 'daniela@hydropix.ar',
    role: 'volunteer',
    active: true,
    joinedAt: '2026-01-08',
  },
]

// ─── Forum posts ─────────────────────────────────────────────────────────────

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
    title: '¿Cómo se calibra el sensor de turbidez óptico?',
    body: 'El sensor de turbidez óptico del sector este marca valores anómalos. ¿Alguien tiene documentado el procedimiento de calibración del sensor óptico?',
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
  {
    id: 'p-004',
    author: 'Santiago López',
    title: 'Nuevos sensores de nivel hidrostático instalados',
    body: 'Se completó la instalación de los sensores de nivel hidrostático en los taludes aguas arriba y abajo. Por favor revisen las lecturas y reporten cualquier anomalía durante la primera semana de monitoreo.',
    type: 'proposal',
    votes: 15,
    myVote: 0,
    replies: 6,
    createdAt: '2026-02-01T08:45:00Z',
  },
  {
    id: 'p-005',
    author: 'Camila Herrera',
    title: '¿Por qué sube la turbidez después de la lluvia?',
    body: 'Noté que después de cada lluvia fuerte la turbidez se dispara. ¿Es normal o hay erosión en las márgenes que debemos atender?',
    type: 'qa',
    votes: 5,
    myVote: 0,
    replies: 4,
    createdAt: '2026-02-10T16:20:00Z',
  },
  {
    id: 'p-006',
    author: 'Daniela Ríos',
    title: 'Capacitación sobre lecturas de sólidos suspendidos',
    body: 'Propongo organizar una sesión de capacitación para los voluntarios nuevos sobre cómo interpretar las lecturas de sólidos suspendidos y su relación con la turbidez del agua.',
    type: 'proposal',
    votes: 8,
    myVote: 0,
    replies: 2,
    createdAt: '2026-02-15T10:00:00Z',
  },
]

// ─── Polls ───────────────────────────────────────────────────────────────────

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
      { id: 'o-4', label: 'Nuevos sensores de nivel boya', votes: 11 },
      { id: 'o-5', label: 'Reparación de bomba', votes: 5 },
      { id: 'o-6', label: 'Cámara de monitoreo', votes: 7 },
    ],
    myOptionId: null,
    closed: true,
  },
  {
    id: 'v-003',
    question: '¿Cuántos turnos semanales puede cubrir cada voluntario?',
    options: [
      { id: 'o-7', label: '1 turno por semana', votes: 3 },
      { id: 'o-8', label: '2 turnos por semana', votes: 10 },
      { id: 'o-9', label: '3 o más turnos', votes: 2 },
    ],
    myOptionId: null,
    closed: false,
  },
]

// ─── Schedule ────────────────────────────────────────────────────────────────

export const seedSchedule: ScheduleEntry[] = [
  { id: 's-1', day: 0, start: '08:00', end: '12:00', task: 'Revisión de sensores de nivel', location: 'Corona' },
  { id: 's-2', day: 1, start: '09:00', end: '13:00', task: 'Monitoreo de nivel hidrostático', location: 'Embalse central' },
  { id: 's-3', day: 2, start: '07:00', end: '11:00', task: 'Calibración de turbidez óptica', location: 'Laboratorio' },
  { id: 's-4', day: 3, start: '08:00', end: '12:00', task: 'Limpieza de pluviómetros', location: 'Zona ambiental' },
  { id: 's-5', day: 3, start: '14:00', end: '18:00', task: 'Monitoreo de sólidos suspendidos', location: 'Vertedero' },
  { id: 's-6', day: 4, start: '09:00', end: '12:00', task: 'Revisión de bombas de achique', location: 'Obra de toma' },
  { id: 's-7', day: 5, start: '10:00', end: '14:00', task: 'Inspección de compuertas IP68', location: 'Vertedero' },
  { id: 's-8', day: 6, start: '08:00', end: '10:00', task: 'Resumen semanal', location: 'Embalse central' },
]

// ─── Alert preferences ───────────────────────────────────────────────────────

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

// ─── Labels ──────────────────────────────────────────────────────────────────

export const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']