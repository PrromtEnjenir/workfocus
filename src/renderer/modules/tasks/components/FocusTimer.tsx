// src/renderer/modules/tasks/components/FocusTimer.tsx
import { useEffect, useRef, useCallback } from 'react'
import { useShallow } from 'zustand/shallow'
import { api, broadcast, listen } from '@/bridge/api'
import { usePomodoroStore } from '@/store/pomodoro.slice'
import { useSharedStore } from '@/store/shared.slice'
import type { PomodoroSession, TaskModel } from '@/shared/types/global.types'
import timerEndSound from '@/assets/timer-end.wav'
import styles from './FocusTimer.module.css'

interface FocusTimerProps {
  activeTask: TaskModel | null
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function FocusTimer({ activeTask }: FocusTimerProps) {
  const focusTaskId = useSharedStore((s) => s.focusTaskId)

  const {
    timerState,
    totalSeconds,
    remainingSeconds,
    currentSession,
    sessionsToday,
    setTimerState,
    setTotalSeconds,
    setRemainingSeconds,
    setCurrentSession,
    setSessionsToday,
    syncFromBroadcast,
  } = usePomodoroStore(
    useShallow((s) => ({
      timerState: s.timerState,
      totalSeconds: s.totalSeconds,
      remainingSeconds: s.remainingSeconds,
      currentSession: s.currentSession,
      sessionsToday: s.sessionsToday,
      setTimerState: s.setTimerState,
      setTotalSeconds: s.setTotalSeconds,
      setRemainingSeconds: s.setRemainingSeconds,
      setCurrentSession: s.setCurrentSession,
      setSessionsToday: s.setSessionsToday,
      syncFromBroadcast: s.syncFromBroadcast,
    }))
  )

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio(timerEndSound)
    audioRef.current.volume = 0.7
  }, [])

  // Broadcast stanu przy każdej zmianie — mini-okno odbiera
  const broadcastState = useCallback((
    state: typeof timerState,
    remaining: number,
    total: number,
    sessionId: string | null
  ) => {
    broadcast.timerState({
      timerState: state,
      totalSeconds: total,
      remainingSeconds: remaining,
      sessionId,
      focusTaskId: focusTaskId ?? null,
    })
  }, [focusTaskId])

  // Nasłuchuj na sync z mini-okna (pauza/reset z mini-okna)
  useEffect(() => {
    const cleanup = listen.onTimerSync((payload) => {
      syncFromBroadcast(payload)
      // Jeśli mini-okno wysłało pause/resume — obsłuż
      if (payload.timerState === 'paused' && timerState === 'running') {
        setTimerState('paused')
      } else if (payload.timerState === 'running' && timerState === 'paused') {
        setTimerState('running')
      }
    })
    return cleanup
  }, [timerState, syncFromBroadcast, setTimerState])

  // Tick timera
  useEffect(() => {
    if (timerState === 'running') {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds(
          (() => {
            const current = usePomodoroStore.getState().remainingSeconds
            if (current <= 1) {
              setTimerState('completing')
              broadcastState('completing', 0, totalSeconds, currentSession?.id ?? null)
              return 0
            }
            const next = current - 1
            broadcastState('running', next, totalSeconds, currentSession?.id ?? null)
            return next
          })()
        )
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [timerState, totalSeconds, currentSession?.id, broadcastState, setRemainingSeconds, setTimerState])

  // Obsługa completing
  useEffect(() => {
    if (timerState !== 'completing') return

    const session = currentSession

    const finish = async () => {
      audioRef.current?.play().catch(() => {
        console.warn('[FocusTimer] Brak pliku audio')
      })

      if (session) {
        try {
          await api.pomodoro.stop(session.id, true)
          setCurrentSession(null)
          setSessionsToday(sessionsToday + 1)
        } catch (err) {
          console.error('[FocusTimer] Błąd zapisu sesji:', err)
        }
      }

      setTimeout(() => {
        setTimerState('idle')
        setRemainingSeconds(totalSeconds)
        broadcastState('idle', totalSeconds, totalSeconds, null)
      }, 800)
    }

    finish()
  }, [timerState])  // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = async () => {
    if (timerState === 'idle') {
      try {
        const plannedMinutes = Math.max(1, Math.round(totalSeconds / 60))
        const session = await api.pomodoro.start(activeTask?.id ?? null, plannedMinutes)
        setCurrentSession(session)
        setTimerState('running')
        broadcastState('running', remainingSeconds, totalSeconds, session.id)
      } catch (err) {
        console.error('[FocusTimer] Błąd startu sesji:', err)
      }
    } else if (timerState === 'running') {
      setTimerState('paused')
      broadcastState('paused', remainingSeconds, totalSeconds, currentSession?.id ?? null)
    } else if (timerState === 'paused') {
      setTimerState('running')
      broadcastState('running', remainingSeconds, totalSeconds, currentSession?.id ?? null)
    }
  }

  const reset = async () => {
    if (currentSession) {
      try {
        await api.pomodoro.stop(currentSession.id, false, 'reset')
        setCurrentSession(null)
      } catch (err) {
        console.error('[FocusTimer] Błąd resetu sesji:', err)
      }
    }
    setTimerState('idle')
    setRemainingSeconds(totalSeconds)
    broadcastState('idle', totalSeconds, totalSeconds, null)
  }

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  const radius = 54
  const circumference = 2 * Math.PI * radius
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0
  const dashOffset = circumference * progress
  const isActive = timerState === 'running' || timerState === 'completing'

  return (
    <div className={styles.container}>
      <div
        className={styles.timerWrap}
        onClick={timerState === 'completing' ? undefined : toggle}
        title={timerState === 'running' ? 'Pauza' : timerState === 'completing' ? '' : 'Start'}
        style={timerState === 'completing' ? { cursor: 'default' } : undefined}
      >
        <svg className={styles.timerSvg} viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={radius} fill="none"
            stroke="rgba(192, 132, 252, 0.08)" strokeWidth="6" />
          <circle cx="64" cy="64" r={radius} fill="none"
            stroke={isActive ? 'url(#timerGrad)' : 'rgba(192, 132, 252, 0.3)'}
            strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={dashOffset}
            transform="rotate(-90 64 64)"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
          <defs>
            <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>
        </svg>
        <div className={styles.timerInner}>
          <span className={styles.timerTime}>{timeStr}</span>
          <span className={styles.timerLabel}>
            {timerState === 'running' ? 'FOCUS SESSION'
              : timerState === 'paused' ? 'PAUSED'
              : timerState === 'completing' ? 'COMPLETE'
              : 'CLICK TO START'}
          </span>
        </div>
      </div>

      {(timerState === 'running' || timerState === 'paused') && (
        <button className={styles.resetBtn} onClick={reset}>RESET</button>
      )}

      {activeTask && (
        <div className={styles.activeMission}>
          <div className={styles.missionHeader}>
            <span className={styles.missionHeaderLabel}>ACTIVE MISSION</span>
            <span className={styles.missionCritical}>
              {activeTask.important && activeTask.urgent ? 'CRITICAL'
                : activeTask.important || activeTask.urgent ? 'HIGH' : 'MED'}
            </span>
          </div>
          <div className={styles.missionTitle}>{activeTask.title}</div>
          {activeTask.estimatedMinutes && (
            <div className={styles.missionMeta}>
              <span>ETA {activeTask.estimatedMinutes}m</span>
            </div>
          )}
        </div>
      )}

      <div className={styles.sessionCount}>
        <span className={styles.sessionNum}>{sessionsToday}</span>
        <span className={styles.sessionLabel}>sessions today</span>
      </div>
    </div>
  )
}
