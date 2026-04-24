import { create } from 'zustand'
import type { Area, EnergyLevel } from '@/shared/types/global.types'

interface SharedState {
  activeArea: Area
  activeTaskId: string | null
  todayEnergyLevel: EnergyLevel | null
  currentDate: string

  setActiveArea: (area: Area) => void
  setActiveTaskId: (id: string | null) => void
  setTodayEnergyLevel: (level: EnergyLevel | null) => void
  setCurrentDate: (date: string) => void
}

export const useSharedStore = create<SharedState>((set) => ({
  activeArea: 'work',
  activeTaskId: null,
  todayEnergyLevel: null,
  currentDate: new Date().toISOString().split('T')[0] ?? new Date().toISOString().substring(0, 10),

  setActiveArea: (area) => set({ activeArea: area, activeTaskId: null }),
  setActiveTaskId: (id) => set({ activeTaskId: id }),
  setTodayEnergyLevel: (level) => set({ todayEnergyLevel: level }),
  setCurrentDate: (date) => set({ currentDate: date }),
}))

// Eksportowane selektory do użycia w innych slice'ach
export const getActiveArea = (): Area => useSharedStore.getState().activeArea
export const getActiveTaskId = (): string | null => useSharedStore.getState().activeTaskId
