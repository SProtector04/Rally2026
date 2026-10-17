import { ref } from 'vue'

const THEME_KEY = 'hydropix.theme'

export const isDark = ref(false)

export function applyTheme(dark: boolean) {
  isDark.value = dark
  document.documentElement.classList.toggle('dark', dark)
  localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light')
}

export function initTheme() {
  applyTheme(localStorage.getItem(THEME_KEY) === 'dark')
}

export function toggleTheme() {
  applyTheme(!isDark.value)
}
