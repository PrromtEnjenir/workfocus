import { create } from 'zustand'
import type { Area, EnergyLevel } from '@/shared/types/global.types'

interface SharedState {
  activeArea: Area
  activeTaskId: string | null
  focusTaskId: string | null        // task przypięty do Active Mission / timera
  todayEnergyLevel: EnergyLevel | null
  currentDate: string

  setActiveArea: (area: Area) => void
  setActiveTaskId: (id: string | null) => void
  setFocusTaskId: (id: string | null) => void
  setTodayEnergyLevel: (level: EnergyLevel | null) => void
  setCurrentDate: (date: string) => void
}

export const useSharedStore = create<SharedState>((set) => ({
  activeArea: 'work',
  activeTaskId: null,
  focusTaskId: null,
  todayEnergyLevel: null,
  currentDate: new Date().toISOString().split('T')[0] ?? new Date().toISOString().substring(0, 10),

  setActiveArea: (area) => set({ activeArea: area, activeTaskId: null, focusTaskId: null }),
  setActiveTaskId: (id) => set({ activeTaskId: id }),
  setFocusTaskId: (id) => set({ focusTaskId: id }),
  setTodayEnergyLevel: (level) => set({ todayEnergyLevel: level }),
  setCurrentDate: (date) => set({ currentDate: date }),
}))

export const getActiveArea = (): Area => useSharedStore.getState().activeArea
export const getActiveTaskId = (): string | null => useSharedStore.getState().activeTaskId
export const getFocusTaskId = (): string | null => useSharedStore.getState().focusTaskId
