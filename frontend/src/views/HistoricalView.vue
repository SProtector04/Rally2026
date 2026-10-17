<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Check, Download, Pencil, Search, Trash2, X } from '@lucide/vue'
import StatusBadge from '@/components/StatusBadge.vue'
import PageHeader from '@/components/PageHeader.vue'
import DemoBadge from '@/components/DemoBadge.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { useSensors } from '@/composables/useSensors'
import { useReadingsHistory } from '@/composables/useReadingsHistory'
import { downloadTablePdf } from '@/lib/pdf'
import { STATUS_LABEL } from '@/lib/status'
import { useAuthStore } from '@/stores/auth'
import type { ReadingStatus } from '@/types/api'

const auth = useAuthStore()
const isAdmin = computed(() => auth.isAdmin)

const { sensors, fallback: sensorsFallback, load: loadSensors } = useSensors()
const { readings, fallback: readingsFallback, load: loadReadings } = useReadingsHistory()

const isDemo = computed(() => sensorsFallback.value || readingsFallback.value)

interface Row {
  id: number
  sensorId: string
  sensorName: string
  value: number
  unit: string
  status: ReadingStatus
  timestamp: string
}

const rows = ref<Row[]>([])

const sensorName = (id: string) =>
  sensors.value.find((s) => s.id === id)?.name ?? id.slice(0, 8)
const sensorUnit = (id: string) => sensors.value.find((s) => s.id === id)?.unit ?? ''

function buildRows(): Row[] {
  return readings.value.map((r) => ({
    id: r.id,
    sensorId: r.sensor_id,
    sensorName: sensorName(r.sensor_id),
    value: r.value,
    unit: sensorUnit(r.sensor_id),
    status: r.status,
    timestamp: r.timestamp,
  }))
}

const search = ref('')
const sensorFilter = ref('all')
const statusFilter = ref('all')

const editingId = ref<number | null>(null)
const editValue = ref(0)
const editStatus = ref<ReadingStatus>('ok')

const sensorOptions = computed(() =>
  sensors.value.map((s) => ({ id: s.id, name: s.name })),
)

const filteredRows = computed(() =>
  rows.value.filter((row) => {
    if (sensorFilter.value !== 'all' && row.sensorId !== sensorFilter.value) return false
    if (statusFilter.value !== 'all' && row.status !== statusFilter.value) return false
    if (search.value && !row.sensorName.toLowerCase().includes(search.value.toLowerCase()))
      return false
    return true
  }),
)

function startEdit(row: Row) {
  editingId.value = row.id
  editValue.value = row.value
  editStatus.value = row.status
}

function saveEdit(row: Row) {
  row.value = editValue.value
  row.status = editStatus.value
  editingId.value = null
}

function cancelEdit() {
  editingId.value = null
}

function removeRow(row: Row) {
  rows.value = rows.value.filter((r) => r.id !== row.id)
  if (editingId.value === row.id) editingId.value = null
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

function downloadPdf() {
  downloadTablePdf(
    'Registro histórico de lecturas',
    'Data conservada del reservorio · Hydropix',
    ['Fecha y hora', 'Sensor', 'Valor', 'Estado'],
    filteredRows.value.map((r) => [
      formatTimestamp(r.timestamp),
      r.sensorName,
      `${r.value} ${r.unit}`,
      STATUS_LABEL[r.status],
    ]),
    'registro-historico.pdf',
    { statusColumn: 3 },
  )
}

onMounted(async () => {
  await Promise.all([loadSensors(), loadReadings(undefined, 1000)])
  rows.value = buildRows()
})
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Registro histórico">
      <template #description>
        Data conservada de las lecturas del reservorio.
        <template v-if="isAdmin">Podés editar y corregir los registros.</template>
        <template v-else>Acceso de solo lectura.</template>
      </template>
      <DemoBadge v-if="isDemo" />
      <Button variant="outline" size="lg" @click="downloadPdf">
        <Download class="size-4" />
        Descargar PDF
      </Button>
    </PageHeader>

    <Card>
      <CardContent class="space-y-4">
        <div class="grid gap-3 md:grid-cols-3">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input v-model="search" type="text" placeholder="Buscar por sensor…" class="pl-9" />
          </div>
          <Select v-model="sensorFilter">
            <option value="all">Todos los sensores</option>
            <option v-for="s in sensorOptions" :key="s.id" :value="s.id">{{ s.name }}</option>
          </Select>
          <Select v-model="statusFilter">
            <option value="all">Todos los estados</option>
            <option value="ok">Normal</option>
            <option value="warning">Atención</option>
            <option value="alert">Alerta</option>
          </Select>
        </div>

        <div class="overflow-x-auto rounded-lg border">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                <th scope="col" class="px-4 py-3 font-medium">Fecha y hora</th>
                <th scope="col" class="px-4 py-3 font-medium">Sensor</th>
                <th scope="col" class="px-4 py-3 font-medium">Valor</th>
                <th scope="col" class="px-4 py-3 font-medium">Estado</th>
                <th v-if="isAdmin" scope="col" class="px-4 py-3 text-right font-medium">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in filteredRows"
                :key="row.id"
                class="border-b last:border-0 hover:bg-muted/30"
              >
                <td class="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {{ formatTimestamp(row.timestamp) }}
                </td>
                <td class="px-4 py-3 font-medium">{{ row.sensorName }}</td>
                <td class="whitespace-nowrap px-4 py-3">
                  <template v-if="editingId === row.id">
                    <input
                      v-model.number="editValue"
                      type="number"
                      step="0.1"
                      class="h-8 w-24 rounded-md border border-input bg-background px-2 text-sm outline-none ring-ring/50 focus-visible:ring-3"
                    />
                  </template>
                  <template v-else>
                    {{ row.value }} <span class="text-muted-foreground">{{ row.unit }}</span>
                  </template>
                </td>
                <td class="px-4 py-3">
                  <template v-if="editingId === row.id">
                    <Select v-model="editStatus" class="h-8">
                      <option value="ok">Normal</option>
                      <option value="warning">Atención</option>
                      <option value="alert">Alerta</option>
                    </Select>
                  </template>
                  <template v-else>
                    <StatusBadge :status="row.status" />
                  </template>
                </td>
                <td v-if="isAdmin" class="px-4 py-3">
                  <div class="flex items-center justify-end gap-1">
                    <template v-if="editingId === row.id">
                      <Button variant="ghost" size="icon-sm" aria-label="Guardar" @click="saveEdit(row)">
                        <Check class="size-4 text-emerald-500" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label="Cancelar" @click="cancelEdit">
                        <X class="size-4" />
                      </Button>
                    </template>
                    <template v-else>
                      <Button variant="ghost" size="icon-sm" aria-label="Editar" @click="startEdit(row)">
                        <Pencil class="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label="Eliminar" @click="removeRow(row)">
                        <Trash2 class="size-4 text-destructive" />
                      </Button>
                    </template>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredRows.length === 0">
                <td :colspan="isAdmin ? 5 : 4" class="px-4 py-10 text-center text-muted-foreground">
                  No hay registros que coincidan con los filtros.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="text-xs text-muted-foreground">
          Mostrando {{ filteredRows.length }} de {{ rows.length }} registros.
        </p>
      </CardContent>
    </Card>
  </div>
</template>
