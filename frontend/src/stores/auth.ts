import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Role, User } from '@/types/domain'
import { seedUsers } from '@/data/mock'

const USER_KEY = 'hydropix.auth.user'
const USERS_KEY = 'hydropix.auth.users'

function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (raw) return JSON.parse(raw) as User[]
  } catch {
    // fall through to seed
  }
  return [...seedUsers]
}

function loadCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (raw) return JSON.parse(raw) as User
  } catch {
    return null
  }
  return null
}

export const useAuthStore = defineStore('auth', () => {
  const users = ref<User[]>(loadUsers())
  const currentUser = ref<User | null>(loadCurrentUser())

  const isAuthenticated = computed(() => currentUser.value !== null)
  const isAdmin = computed(() => currentUser.value?.role === 'admin')

  function persistUsers() {
    localStorage.setItem(USERS_KEY, JSON.stringify(users.value))
  }

  function login(email: string): User | null {
    const found = users.value.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.active,
    )
    if (!found) return null
    currentUser.value = found
    localStorage.setItem(USER_KEY, JSON.stringify(found))
    return found
  }

  function logout() {
    currentUser.value = null
    localStorage.removeItem(USER_KEY)
  }

  function setRole(id: string, role: Role) {
    const user = users.value.find((u) => u.id === id)
    if (user) {
      user.role = role
      persistUsers()
      if (currentUser.value?.id === id) {
        currentUser.value.role = role
        localStorage.setItem(USER_KEY, JSON.stringify(currentUser.value))
      }
    }
  }

  function toggleActive(id: string) {
    const user = users.value.find((u) => u.id === id)
    if (user) {
      user.active = !user.active
      persistUsers()
    }
  }

  function addUser(name: string, email: string, role: Role): boolean {
    if (users.value.some((u) => u.email.toLowerCase() === email.toLowerCase())) return false
    users.value.push({
      id: `u-${Date.now()}`,
      name,
      email,
      role,
      active: true,
      joinedAt: new Date().toISOString().slice(0, 10),
    })
    persistUsers()
    return true
  }

  return {
    users,
    currentUser,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    setRole,
    toggleActive,
    addUser,
  }
})
