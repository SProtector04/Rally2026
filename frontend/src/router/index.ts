import { createRouter, createWebHistory } from 'vue-router'
import type { Role } from '@/types/domain'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    roles?: Role[]
    layout?: 'blank' | 'shell'
    title?: string
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('../views/LandingView.vue'),
      meta: { layout: 'blank', title: 'Inicio' },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { layout: 'blank', title: 'Iniciar sesión' },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { requiresAuth: true, title: 'Monitoreo' },
    },
    {
      path: '/registro',
      name: 'registro',
      component: () => import('../views/HistoricalView.vue'),
      meta: { requiresAuth: true, title: 'Registro histórico' },
    },
    {
      path: '/permisos',
      name: 'permisos',
      component: () => import('../views/PermissionsView.vue'),
      meta: { requiresAuth: true, roles: ['admin'], title: 'Gestión de permisos' },
    },
    {
      path: '/perfil',
      name: 'perfil',
      component: () => import('../views/ProfileView.vue'),
      meta: { requiresAuth: true, title: 'Mi perfil' },
    },
    {
      path: '/foro',
      name: 'foro',
      component: () => import('../views/ForumView.vue'),
      meta: { requiresAuth: true, title: 'Foro' },
    },
    {
      path: '/reservorio',
      name: 'reservorio',
      component: () => import('../views/ReservoirView.vue'),
      meta: { requiresAuth: true, title: 'Reservorio' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.roles && !to.meta.roles.includes(auth.currentUser?.role ?? 'volunteer')) {
    return { name: 'dashboard' }
  }
  return true
})

export default router
