import { create } from 'zustand'
import type { AppSettings } from '@/shared/types/global.types'

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  language: 'pl',
  pomodoroMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakAfter: 4,
  dailyPlanningTime: '08:00',
  dailyShutdownTime: '17:00',
  weeklyReviewDay: 'friday',
  backupEnabled: true,
  backupPath: '',
  backupIntervalDays: 7,
  notificationsEnabled: true,
  followupDefaultDays: 3,
  defaultArea: 'work',
}

interface SettingsState {
  settings: AppSettings
  loaded: boolean
  setSettings: (settings: AppSettings) => void
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void
  setLoaded: (loaded: boolean) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,
  setSettings: (settings) => set({ settings }),
  updateSetting: (key, value) =>
    set((state) => ({
      settings: { ...state.settings, [key]: value },
    })),
  setLoaded: (loaded) => set({ loaded }),
}))
