import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { Layout } from './Layout'

// COMMAND — główny kokpit (tasks + pomodoro + intel feed)
const TasksPage = lazy(() => import('@/modules/tasks'))

// TRIAGE
const TriagePage = lazy(() => import('@/modules/triage'))

// ANALYTICS — agreguje stats, history, time blocking
const AnalyticsPage = lazy(() => import('@/modules/analytics'))

// SETTINGS
const SettingsPage = lazy(() => import('@/modules/settings'))

// Moduły dostępne wewnątrz COMMAND jako overlaye/modals (nie własne route)
// - Pomodoro timer (floating w COMMAND)
// - Reminders (Intel Feed w COMMAND)
// - Rituals (modal triggerowany z COMMAND)
// - Decisions (sekcja w ANALYTICS lub SETTINGS)

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      // Domyślna trasa → COMMAND
      { index: true, element: <TasksPage /> },
      { path: 'tasks', element: <TasksPage /> },

      // TRIAGE
      { path: 'triage', element: <TriagePage /> },

      // ANALYTICS (zastępuje osobne /stats i /history)
      { path: 'analytics', element: <AnalyticsPage /> },
      // Legacy redirect — gdyby gdzieś był hardcoded link
      { path: 'stats', element: <AnalyticsPage /> },
      { path: 'history', element: <AnalyticsPage /> },

      // SETTINGS
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]
