<script setup lang="ts">
import { computed, ref } from 'vue'
import { ShieldCheck, UserPlus, UserRound } from '@lucide/vue'
import PageHeader from '@/components/PageHeader.vue'
import KpiCard from '@/components/KpiCard.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth'
import type { Role } from '@/types/domain'

const auth = useAuthStore()

const name = ref('')
const email = ref('')
const newRole = ref<Role>('volunteer')
const formError = ref('')

const adminCount = computed(() => auth.users.filter((u) => u.role === 'admin' && u.active).length)
const volunteerCount = computed(
  () => auth.users.filter((u) => u.role === 'volunteer' && u.active).length,
)

function onRoleChange(id: string, role: Role) {
  auth.setRole(id, role)
}

function addUser() {
  formError.value = ''
  if (!name.value.trim() || !email.value.trim()) {
    formError.value = 'Completá nombre y correo.'
    return
  }
  const ok = auth.addUser(name.value.trim(), email.value.trim(), newRole.value)
  if (!ok) {
    formError.value = 'Ya existe un usuario con ese correo.'
    return
  }
  name.value = ''
  email.value = ''
  newRole.value = 'volunteer'
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Gestión de permisos">
      <template #description>Administrá los roles y el acceso de los miembros del equipo.</template>
    </PageHeader>

    <div class="grid gap-4 sm:grid-cols-2">
      <KpiCard
        label="Administradores activos"
        :value="adminCount"
        :icon="ShieldCheck"
        tone="text-primary bg-primary/10"
      />
      <KpiCard
        label="Voluntarios activos"
        :value="volunteerCount"
        :icon="UserRound"
        tone="text-emerald-500 bg-emerald-500/10"
      />
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Miembros del equipo</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="overflow-x-auto rounded-lg border">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                <th scope="col" class="px-4 py-3 font-medium">Usuario</th>
                <th scope="col" class="px-4 py-3 font-medium">Correo</th>
                <th scope="col" class="px-4 py-3 font-medium">Rol</th>
                <th scope="col" class="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="user in auth.users"
                :key="user.id"
                class="border-b last:border-0 hover:bg-muted/30"
              >
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <div
                      class="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-xs font-semibold text-white"
                    >
                      {{ user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase() }}
                    </div>
                    <span class="font-medium">{{ user.name }}</span>
                    <span
                      v-if="user.id === auth.currentUser?.id"
                      class="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      vos
                    </span>
                  </div>
                </td>
                <td class="px-4 py-3 text-muted-foreground">{{ user.email }}</td>
                <td class="px-4 py-3">
                  <Select
                    :model-value="user.role"
                    :disabled="user.id === auth.currentUser?.id"
                    class="w-40"
                    @update:model-value="onRoleChange(user.id, $event as Role)"
                  >
                    <option value="admin">Administrador</option>
                    <option value="volunteer">Voluntario</option>
                  </Select>
                </td>
                <td class="px-4 py-3">
                  <Switch
                    :model-value="user.active"
                    :disabled="user.id === auth.currentUser?.id"
                    :aria-label="`${user.active ? 'Desactivar' : 'Activar'} a ${user.name}`"
                    @update:model-value="auth.toggleActive(user.id)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="rounded-lg border p-4">
          <p class="mb-3 flex items-center gap-2 text-sm font-medium">
            <UserPlus class="size-4 text-primary" />
            Agregar miembro
          </p>
          <div class="grid gap-3 md:grid-cols-4">
            <Input v-model="name" type="text" placeholder="Nombre completo" />
            <Input v-model="email" type="email" placeholder="correo@hydropix.ar" />
            <Select v-model="newRole">
              <option value="volunteer">Voluntario</option>
              <option value="admin">Administrador</option>
            </Select>
            <Button size="lg" @click="addUser">Agregar</Button>
          </div>
          <p v-if="formError" class="mt-2 text-sm text-rose-600 dark:text-rose-300">
            {{ formError }}
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
