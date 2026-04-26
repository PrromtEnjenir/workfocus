// src/renderer/store/pomodoro.slice.ts
import { create } from 'zustand'
import type { PomodoroSession } from '@/shared/types/global.types'

export type TimerState = 'idle' | 'running' | 'paused' | 'completing'

export interface PomodoroState {
  // Stan timera
  timerState: TimerState
  totalSeconds: number
  remainingSeconds: number
  currentSession: PomodoroSession | null

  // Statystyki dziś
  sessionsToday: number
  focusMinutesToday: number

  // Akcje
  setTimerState: (state: TimerState) => void
  setTotalSeconds: (seconds: number) => void
  setRemainingSeconds: (seconds: number) => void
  setCurrentSession: (session: PomodoroSession | null) => void
  setSessionsToday: (count: number) => void
  setFocusMinutesToday: (minutes: number) => void

  // Synchronizacja z zewnątrz (mini-okno → główne okno)
  syncFromBroadcast: (payload: TimerBroadcastPayload) => void
}

export interface TimerBroadcastPayload {
  timerState: TimerState
  totalSeconds: number
  remainingSeconds: number
  sessionId: string | null
  focusTaskId: string | null
}

const DEFAULT_MINUTES = 25

export const usePomodoroStore = create<PomodoroState>((set) => ({
  timerState: 'idle',
  totalSeconds: DEFAULT_MINUTES * 60,
  remainingSeconds: DEFAULT_MINUTES * 60,
  currentSession: null,
  sessionsToday: 0,
  focusMinutesToday: 0,

  setTimerState: (timerState) => set({ timerState }),
  setTotalSeconds: (totalSeconds) => set({ totalSeconds }),
  setRemainingSeconds: (remainingSeconds) => set({ remainingSeconds }),
  setCurrentSession: (currentSession) => set({ currentSession }),
  setSessionsToday: (sessionsToday) => set({ sessionsToday }),
  setFocusMinutesToday: (focusMinutesToday) => set({ focusMinutesToday }),

  syncFromBroadcast: (payload) =>
    set((s) => ({
      timerState: payload.timerState,
      totalSeconds: payload.totalSeconds,
      remainingSeconds: payload.remainingSeconds,
      // currentSession nie syncujemy przez broadcast — każde okno ma swój ref
    })),
}))

// Selektory
export const selectTimerState = (): TimerState =>
  usePomodoroStore.getState().timerState

export const selectIsTimerActive = (): boolean => {
  const state = usePomodoroStore.getState().timerState
  return state === 'running' || state === 'paused'
}
