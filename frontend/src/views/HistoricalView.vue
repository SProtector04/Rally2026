<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { CalendarPlus, Check, Download, Pencil, Search, X } from '@lucide/vue'
import StatusBadge from '@/components/StatusBadge.vue'
import PageHeader from '@/components/PageHeader.vue'
import DemoBadge from '@/components/DemoBadge.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { useSensors } from '@/composables/useSensors'
import { useReadingsHistory } from '@/composables/useReadingsHistory'
import { createReading, updateReading } from '@/lib/api'
import { downloadTablePdf } from '@/lib/pdf'
import { STATUS_LABEL } from '@/lib/status'
import { useAuthStore } from '@/stores/auth'
import type { Reading, ReadingStatus } from '@/types/api'

const auth = useAuthStore()
const isAdmin = computed(() => auth.isAdmin)
const { sensors, fallback: sensorsFallback, load: loadSensors } = useSensors()
const { readings, fallback: readingsFallback, load: loadReadings } = useReadingsHistory()
const isDemo = computed(() => sensorsFallback.value || readingsFallback.value)

interface Row extends Reading {
  sensorName: string
  sensorType: string
  unit: string
}

interface ReadingForm {
  sensorId: string
  value: number
  date: string
  status: ReadingStatus
}

interface DailyGroup {
  date: string
  rows: Row[]
}

interface SensorCard {
  sensorId: string
  sensorName: string
  sensorType: string
  unit: string
  days: DailyGroup[]
}

const rows = ref<Row[]>([])
const search = ref('')
const sensorFilter = ref('all')
const statusFilter = ref('all')
const modalOpen = ref(false)
const editingId = ref<number | null>(null)
const editingDayRows = ref<Row[]>([])
const saving = ref(false)
const formError = ref('')
const form = ref<ReadingForm>({
  sensorId: '',
  value: 0,
  date: new Date().toISOString().slice(0, 10),
  status: 'ok',
})

const sensorOptions = computed(() => sensors.value.map((s) => ({ id: s.id, name: s.name })))
const sensorFor = (id: string) => sensors.value.find((sensor) => sensor.id === id)

function buildRows(): Row[] {
  return readings.value.map((reading) => {
    const sensor = sensorFor(reading.sensor_id)
    return {
      ...reading,
      sensorName: sensor?.name ?? reading.sensor_id.slice(0, 8),
      sensorType: sensor?.type ?? 'Sin tipo',
      unit: sensor?.unit ?? '',
    }
  })
}

const filteredRows = computed(() =>
  rows.value.filter((row) => {
    if (sensorFilter.value !== 'all' && row.sensor_id !== sensorFilter.value) return false
    if (statusFilter.value !== 'all' && row.status !== statusFilter.value) return false
    return !search.value || row.sensorName.toLowerCase().includes(search.value.toLowerCase())
  }),
)

const sensorCards = computed<SensorCard[]>(() => {
  const bySensor = new Map<string, Row[]>()
  for (const row of filteredRows.value) {
    const sensorRows = bySensor.get(row.sensor_id) ?? []
    sensorRows.push(row)
    bySensor.set(row.sensor_id, sensorRows)
  }
  return [...bySensor.entries()]
    .sort(([, a], [, b]) =>
      (a[0]?.sensorName ?? '').localeCompare(b[0]?.sensorName ?? ''),
    )
    .map(([sensorId, sensorRows]) => {
      const first = sensorRows[0]
      const byDay = new Map<string, Row[]>()
      for (const row of sensorRows) {
        const dayRows = byDay.get(row.timestamp.slice(0, 10)) ?? []
        dayRows.push(row)
        byDay.set(row.timestamp.slice(0, 10), dayRows)
      }
      return {
        sensorId,
        sensorName: first?.sensorName ?? 'Sensor',
        sensorType: first?.sensorType ?? 'Sin tipo',
        unit: first?.unit ?? '',
        days: [...byDay.entries()]
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([date, dayRows]) => ({
            date,
            rows: dayRows.sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
          })),
      }
    })
})

const totalReadings = computed(() => filteredRows.value.length)
const activeSensors = computed(() => sensorCards.value.length)
const alertReadings = computed(
  () => filteredRows.value.filter((row) => row.status === 'alert').length,
)
const latestDay = computed(() => {
  const timestamp = filteredRows.value[0]?.timestamp
  return timestamp ? formatDate(timestamp.slice(0, 10)) : 'Sin lecturas'
})

function formatDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function openCreate() {
  editingId.value = null
  editingDayRows.value = []
  formError.value = ''
  form.value = {
    sensorId: sensors.value[0]?.id ?? '',
    value: 0,
    date: new Date().toISOString().slice(0, 10),
    status: 'ok',
  }
  modalOpen.value = true
}

function openEditDay(day: DailyGroup) {
  editingId.value = null
  editingDayRows.value = day.rows.map((row) => ({ ...row }))
  formError.value = ''
  modalOpen.value = true
}

function closeModal() {
  if (!saving.value) modalOpen.value = false
}

async function saveForm() {
  if (editingDayRows.value.length > 0) {
    saving.value = true
    formError.value = ''
    try {
      const saved = await Promise.all(
        editingDayRows.value.map((row) =>
          updateReading(row.id, {
            sensor_id: row.sensor_id,
            value: row.value,
            timestamp: row.timestamp,
            status: row.status,
          }),
        ),
      )
      const savedRows = buildRowsFor(saved)
      for (const savedRow of savedRows) {
        const index = rows.value.findIndex((row) => row.id === savedRow.id)
        if (index !== -1) rows.value[index] = savedRow
      }
      modalOpen.value = false
    } catch (error) {
      formError.value = error instanceof Error ? error.message : 'No se pudieron guardar los cambios.'
    } finally {
      saving.value = false
    }
    return
  }
  if (!form.value.sensorId || !form.value.date) {
    formError.value = 'Seleccioná el tipo y la fecha del registro.'
    return
  }
  saving.value = true
  formError.value = ''
  const timestamp = new Date(`${form.value.date}T12:00:00`).toISOString()
  try {
    const saved = editingId.value === null
      ? await createReading({
          sensor_id: form.value.sensorId,
          value: form.value.value,
          timestamp,
          status: form.value.status,
        })
      : await updateReading(editingId.value, {
          sensor_id: form.value.sensorId,
          value: form.value.value,
          timestamp,
          status: form.value.status,
        })
    const next = buildRowsFor([saved])[0]
    if (!next) throw new Error('La respuesta del servidor no contiene el registro guardado.')
    const index = rows.value.findIndex((row) => row.id === saved.id)
    if (index === -1) rows.value.unshift(next)
    else rows.value[index] = next
    modalOpen.value = false
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'No se pudo guardar el registro.'
  } finally {
    saving.value = false
  }
}

function buildRowsFor(readingList: Reading[]): Row[] {
  return readingList.map((reading) => {
    const sensor = sensorFor(reading.sensor_id)
    return {
      ...reading,
      sensorName: sensor?.name ?? reading.sensor_id.slice(0, 8),
      sensorType: sensor?.type ?? 'Sin tipo',
      unit: sensor?.unit ?? '',
    }
  })
}

function downloadSection(sensor: SensorCard, day: DailyGroup) {
  downloadTablePdf(
    `${sensor.sensorName} · ${formatDate(day.date)}`,
    'Data conservada del reservorio · Hydropix',
    ['Hora', 'Tipo', 'Magnitud', 'Valor', 'Estado'],
    day.rows.map((row) => [
      formatTimestamp(row.timestamp).split(', ')[1] ?? formatTimestamp(row.timestamp),
      row.sensorType,
      row.unit,
      `${row.value} ${row.unit}`,
      STATUS_LABEL[row.status],
    ]),
    `registro-${sensor.sensorName}-${day.date}.pdf`,
    { statusColumn: 4 },
  )
}

onMounted(async () => {
  await Promise.all([loadSensors(), loadReadings(undefined, 1000)])
  rows.value = buildRows()
})
</script>

<template>
  <div class="page-enter space-y-8">
    <PageHeader title="Registro histórico" class="section-enter">
      <template #description>
        La memoria diaria del reservorio, organizada por sensor.
        <template v-if="isAdmin">Podés agregar y editar registros.</template>
        <template v-else>Acceso de solo lectura.</template>
      </template>
      <DemoBadge v-if="isDemo" />
      <Button v-if="isAdmin" size="lg" @click="openCreate">
        <CalendarPlus class="size-4" />
        Agregar registro
      </Button>
    </PageHeader>

    <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-2xl bg-primary p-5 text-primary-foreground">
        <p class="text-sm opacity-80">Lecturas visibles</p>
        <p class="mt-3 text-4xl font-semibold tracking-tight">{{ totalReadings }}</p>
        <p class="mt-2 text-sm opacity-80">Según los filtros actuales</p>
      </div>
      <div class="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <p class="text-sm text-muted-foreground">Sensores con actividad</p>
        <p class="mt-3 text-4xl font-semibold tracking-tight">{{ activeSensors }}</p>
        <p class="mt-2 text-sm text-muted-foreground">Agrupados abajo</p>
      </div>
      <div class="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <p class="text-sm text-muted-foreground">Alertas visibles</p>
        <p class="mt-3 text-4xl font-semibold tracking-tight text-rose-600">{{ alertReadings }}</p>
        <p class="mt-2 text-sm text-muted-foreground">Requieren revisión</p>
      </div>
      <div class="rounded-2xl bg-muted p-5">
        <p class="text-sm text-muted-foreground">Último día registrado</p>
        <p class="mt-3 text-lg font-semibold capitalize">{{ latestDay }}</p>
        <p class="mt-2 text-sm text-muted-foreground">Corte de información</p>
      </div>
    </section>

    <Card class="section-enter">
      <CardContent class="space-y-4">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold">Explorar lecturas</h2>
            <p class="text-sm text-muted-foreground">Filtrá el historial antes de abrir una tabla diaria.</p>
          </div>
          <p class="text-sm font-medium text-primary">{{ totalReadings }} resultados</p>
        </div>
        <div class="grid gap-3 md:grid-cols-3">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input v-model="search" type="text" placeholder="Buscar por sensor…" class="pl-9" />
          </div>
          <Select v-model="sensorFilter">
            <option value="all">Todos los sensores</option>
            <option v-for="sensor in sensorOptions" :key="sensor.id" :value="sensor.id">{{ sensor.name }}</option>
          </Select>
          <Select v-model="statusFilter">
            <option value="all">Todos los estados</option>
            <option value="ok">Normal</option>
            <option value="warning">Atención</option>
            <option value="alert">Alerta</option>
          </Select>
        </div>
      </CardContent>
    </Card>

    <div
      v-for="(sensor, sensorIndex) in sensorCards"
      :key="sensor.sensorId"
      class="section-enter rounded-2xl bg-card p-5 ring-1 ring-foreground/10"
      :style="{ animationDelay: `${sensorIndex * 70}ms` }"
    >
      <div class="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{{ sensor.sensorType }}</p>
          <h2 class="mt-1 text-lg font-semibold">{{ sensor.sensorName }}</h2>
          <p class="text-sm text-muted-foreground">Magnitud: {{ sensor.unit || 'Sin unidad' }}</p>
        </div>
        <span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {{ sensor.days.length }} día(s)
        </span>
      </div>

      <div class="grid gap-4 xl:grid-cols-2">
        <article v-for="day in sensor.days" :key="day.date" class="overflow-hidden rounded-xl bg-background ring-1 ring-foreground/10">
          <div class="flex items-center justify-between gap-3 bg-muted/30 px-4 py-3">
            <div>
              <h3 class="font-medium capitalize">{{ formatDate(day.date) }}</h3>
              <p class="text-xs text-muted-foreground">{{ day.rows.length }} lectura(s)</p>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table data-ui class="w-full text-sm">
              <thead>
                <tr class="bg-muted/20 text-left text-xs text-muted-foreground">
                  <th class="px-4 py-2.5 font-medium">Hora</th>
                  <th class="px-4 py-2.5 font-medium">Valor</th>
                  <th class="px-4 py-2.5 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in day.rows" :key="row.id" class="odd:bg-muted/10">
                  <td class="whitespace-nowrap px-4 py-3 text-muted-foreground">{{ formatTimestamp(row.timestamp).split(', ')[1] }}</td>
                  <td class="whitespace-nowrap px-4 py-3">{{ row.value }} {{ row.unit }}</td>
                  <td class="px-4 py-3"><StatusBadge :status="row.status" /></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="flex justify-end gap-2 bg-muted/30 px-4 py-3">
            <Button
              v-if="isAdmin"
              variant="ghost"
              size="icon-sm"
              aria-label="Editar lecturas del día"
              title="Editar lecturas del día"
              @click="openEditDay(day)"
            >
              <Pencil class="size-4" />
            </Button>
            <Button variant="outline" size="sm" @click="downloadSection(sensor, day)">
              <Download class="size-4" />
              Descargar PDF
            </Button>
          </div>
        </article>
      </div>
    </div>

    <Card v-if="sensorCards.length === 0">
      <CardContent class="py-10 text-center text-muted-foreground">No hay registros que coincidan con los filtros.</CardContent>
    </Card>

    <div v-if="modalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" @click.self="closeModal">
      <Card class="w-full max-w-lg ring-2 ring-primary/20">
        <CardContent class="space-y-5 p-6">
          <div class="flex items-start justify-between">
            <div>
              <h2 class="text-lg font-semibold">{{ editingDayRows.length ? 'Editar lecturas del día' : 'Agregar registro' }}</h2>
              <p class="text-sm text-muted-foreground">Los cambios se guardan en la base de datos.</p>
            </div>
            <Button variant="ghost" size="icon-sm" aria-label="Cerrar" @click="closeModal"><X class="size-4" /></Button>
          </div>
          <div v-if="editingDayRows.length" class="space-y-4">
            <div v-for="row in editingDayRows" :key="row.id" class="rounded-lg border p-4">
              <p class="mb-3 text-sm font-medium">{{ formatTimestamp(row.timestamp) }}</p>
              <div class="grid gap-3 sm:grid-cols-2">
                <label class="space-y-1.5 text-sm font-medium">
                  Fecha
                  <Input
                    :model-value="row.timestamp.slice(0, 10)"
                    type="date"
                    @update:model-value="row.timestamp = new Date(`${$event}T12:00:00`).toISOString()"
                  />
                </label>
                <label class="space-y-1.5 text-sm font-medium">
                  Valor
                  <Input v-model.number="row.value" type="number" step="0.1" />
                </label>
                <label class="space-y-1.5 text-sm font-medium sm:col-span-2">
                  Estado
                  <Select v-model="row.status">
                    <option value="ok">Normal</option>
                    <option value="warning">Atención</option>
                    <option value="alert">Alerta</option>
                  </Select>
                </label>
              </div>
            </div>
          </div>
          <div v-else class="grid gap-4 sm:grid-cols-2">
            <label class="space-y-1.5 text-sm font-medium">
              Tipo
              <Select v-model="form.sensorId">
                <option value="" disabled>Seleccionar sensor</option>
                <option v-for="sensor in sensorOptions" :key="sensor.id" :value="sensor.id">{{ sensor.name }}</option>
              </Select>
            </label>
            <label class="space-y-1.5 text-sm font-medium">
              Magnitud
              <Input :value="sensorFor(form.sensorId)?.unit ?? '—'" readonly />
            </label>
            <label class="space-y-1.5 text-sm font-medium">
              Fecha
              <Input v-model="form.date" type="date" />
            </label>
            <label class="space-y-1.5 text-sm font-medium">
              Valor
              <Input v-model.number="form.value" type="number" step="0.1" />
            </label>
            <label class="space-y-1.5 text-sm font-medium sm:col-span-2">
              Estado
              <Select v-model="form.status">
                <option value="ok">Normal</option>
                <option value="warning">Atención</option>
                <option value="alert">Alerta</option>
              </Select>
            </label>
          </div>
          <p v-if="formError" class="text-sm text-destructive">{{ formError }}</p>
          <div class="flex justify-end gap-2">
            <Button variant="outline" :disabled="saving" @click="closeModal">Cancelar</Button>
            <Button :disabled="saving" @click="saveForm">
              <Check class="size-4" />
              {{ saving ? 'Guardando…' : 'Guardar registro' }}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
