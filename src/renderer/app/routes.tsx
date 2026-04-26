import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { Layout } from './Layout'

const TasksPage = lazy(() => import('@/modules/tasks'))
const TriagePage = lazy(() => import('@/modules/triage'))
const AnalyticsPage = lazy(() => import('@/modules/analytics'))
const RitualsPage = lazy(() => import('@/modules/rituals'))
const SettingsPage = lazy(() => import('@/modules/settings'))

// Osobne mini-okna — bez Layout (brak navbara/sidebara)
const FocusModePage = lazy(() => import('@/modules/focus/FocusMode'))
const QuickCapturePage = lazy(() => import('@/modules/capture/QuickCapture'))

export const routes: RouteObject[] = [
  // Focus Mode — osobna trasa bez Layout
  {
    path: '/focus-mode',
    element: <FocusModePage />,
  },

  // Quick Capture — osobna trasa bez Layout
  {
    path: '/quick-capture',
    element: <QuickCapturePage />,
  },

  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <TasksPage /> },
      { path: 'tasks', element: <TasksPage /> },
      { path: 'triage', element: <TriagePage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'stats', element: <AnalyticsPage /> },
      { path: 'history', element: <AnalyticsPage /> },
      { path: 'rituals', element: <RitualsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]
