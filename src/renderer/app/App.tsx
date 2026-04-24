import { useEffect } from 'react'
import { RouterProvider, createHashRouter } from 'react-router-dom'
import { routes } from './routes'
import { api } from '@/bridge/api'
import { useSettingsStore } from '@/store/settings.slice'
import { useSharedStore } from '@/store/shared.slice'
import type { AppSettings } from '@/shared/types/global.types'

const router = createHashRouter(routes)

export default function App(): JSX.Element {
  const { setSettings, setLoaded } = useSettingsStore()
  const { setActiveArea } = useSharedStore()

  useEffect(() => {
    // Załaduj ustawienia z DB przy starcie
    api.settings.getAll().then((settings: AppSettings) => {
      setSettings(settings)
      setLoaded(true)

      // Ustaw domyślny obszar z ustawień
      setActiveArea(settings.defaultArea)

      // Zastosuj motyw
      applyTheme(settings.theme)
    }).catch((err: unknown) => {
      console.error('[App] Błąd ładowania ustawień:', err)
      setLoaded(true)
    })
  }, [setSettings, setLoaded, setActiveArea])

  return <RouterProvider router={router} />
}

function applyTheme(theme: AppSettings['theme']): void {
  const root = document.documentElement
  if (theme === 'system') {
    root.removeAttribute('data-theme')
  } else {
    root.setAttribute('data-theme', theme)
  }
}
