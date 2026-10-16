<script setup lang="ts">
import { computed, ref } from 'vue'
import { ShieldCheck, UserPlus, UserRound } from '@lucide/vue'
import { Button } from '@/components/ui/button'
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
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Gestión de permisos</h1>
      <p class="text-sm text-muted-foreground">
        Administrá los roles y el acceso de los miembros del equipo.
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardContent class="flex items-center gap-4">
          <div class="flex size-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
            <ShieldCheck class="size-5" />
          </div>
          <div>
            <p class="text-2xl font-semibold leading-none">{{ adminCount }}</p>
            <p class="mt-1 text-sm text-muted-foreground">Administradores activos</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="flex items-center gap-4">
          <div class="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <UserRound class="size-5" />
          </div>
          <div>
            <p class="text-2xl font-semibold leading-none">{{ volunteerCount }}</p>
            <p class="mt-1 text-sm text-muted-foreground">Voluntarios activos</p>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Miembros del equipo</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="overflow-x-auto rounded-lg border">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th class="px-4 py-3 font-medium">Usuario</th>
                <th class="px-4 py-3 font-medium">Correo</th>
                <th class="px-4 py-3 font-medium">Rol</th>
                <th class="px-4 py-3 font-medium">Estado</th>
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
                  <select
                    :value="user.role"
                    :disabled="user.id === auth.currentUser?.id"
                    class="h-9 rounded-md border border-input bg-background px-2 text-sm outline-none ring-ring/50 disabled:opacity-50 focus-visible:ring-3"
                    @change="onRoleChange(user.id, ($event.target as HTMLSelectElement).value as Role)"
                  >
                    <option value="admin">Administrador</option>
                    <option value="volunteer">Voluntario</option>
                  </select>
                </td>
                <td class="px-4 py-3">
                  <button
                    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                    :class="user.active ? 'bg-emerald-500' : 'bg-muted'"
                    :disabled="user.id === auth.currentUser?.id"
                    :aria-label="`${user.active ? 'Desactivar' : 'Activar'} ${user.name}`"
                    @click="auth.toggleActive(user.id)"
                  >
                    <span
                      class="inline-block size-5 transform rounded-full bg-white shadow transition-transform"
                      :class="user.active ? 'translate-x-5' : 'translate-x-0.5'"
                    />
                  </button>
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
            <input
              v-model="name"
              type="text"
              placeholder="Nombre completo"
              class="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring/50 focus-visible:ring-3"
            />
            <input
              v-model="email"
              type="email"
              placeholder="correo@rally.ar"
              class="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring/50 focus-visible:ring-3"
            />
            <select
              v-model="newRole"
              class="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring/50 focus-visible:ring-3"
            >
              <option value="volunteer">Voluntario</option>
              <option value="admin">Administrador</option>
            </select>
            <Button @click="addUser">Agregar</Button>
          </div>
          <p v-if="formError" class="mt-2 text-sm text-rose-600 dark:text-rose-300">
            {{ formError }}
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
