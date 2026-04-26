// src/renderer/modules/tasks/components/FocusTimer.tsx
import { useEffect, useRef, useState, useCallback } from 'react'
import { api } from '@/bridge/api'
import type { PomodoroSession, TaskModel } from '@/shared/types/global.types'
import styles from './FocusTimer.module.css'

interface FocusTimerProps {
  activeTask: TaskModel | null
}

type TimerState = 'idle' | 'running' | 'paused' | 'completing'

const DEFAULT_MINUTES = 0.1

export function FocusTimer({ activeTask }: FocusTimerProps) {
  const [state, setState] = useState<TimerState>('idle')
  const [totalSeconds, setTotalSeconds] = useState(DEFAULT_MINUTES * 60)
  const [remainingSeconds, setRemainingSeconds] = useState(DEFAULT_MINUTES * 60)
  const [sessionsToday, setSessionsToday] = useState(0)

  const currentSessionRef = useRef<PomodoroSession | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadStats = useCallback(async () => {
    try {
      const stats = await api.pomodoro.statsToday()
      setSessionsToday(stats.sessions.completed)
    } catch (err) {
      console.error('[FocusTimer] Błąd ładowania statystyk:', err)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    if (state === 'running') {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            // Zostań na 0 — stan 'completing' zatrzyma interval i pokaże pełne kółko
            setState('completing')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [state])

  // Obsługa completing — osobny efekt, odpala się gdy stan zmieni się na 'completing'
  useEffect(() => {
    if (state !== 'completing') return

    const session = currentSessionRef.current

    const finish = async () => {
      if (session) {
        try {
          await api.pomodoro.stop(session.id, true)
          currentSessionRef.current = null
          setSessionsToday((s) => s + 1)
        } catch (err) {
          console.error('[FocusTimer] Błąd zapisu sesji:', err)
        }
      }
      // Reset po krótkim delay — użytkownik widzi 00:00 przez chwilę
      setTimeout(() => {
        setState('idle')
        setRemainingSeconds(totalSeconds)
      }, 800)
    }

    finish()
  }, [state, totalSeconds])

  const toggle = async () => {
    if (state === 'idle') {
      try {
        const plannedMinutes = Math.round(totalSeconds / 60)
        const session = await api.pomodoro.start(activeTask?.id ?? null, plannedMinutes)
        currentSessionRef.current = session
        setState('running')
      } catch (err) {
        console.error('[FocusTimer] Błąd startu sesji:', err)
      }
    } else if (state === 'running') {
      setState('paused')
    } else if (state === 'paused') {
      setState('running')
    }
  }

  const reset = async () => {
    const session = currentSessionRef.current
    if (session) {
      try {
        await api.pomodoro.stop(session.id, false, 'reset')
        currentSessionRef.current = null
      } catch (err) {
        console.error('[FocusTimer] Błąd resetu sesji:', err)
      }
    }
    setState('idle')
    setRemainingSeconds(totalSeconds)
  }

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  const radius = 54
  const circumference = 2 * Math.PI * radius
  // Przy completing: kółko zostaje pełne (progress = 0 → dashOffset = circumference = puste)
  // Chcemy pełne kółko przy 0s więc progress liczymy od totalSeconds
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0
  const dashOffset = circumference * progress  // 0 = pełne kółko, circumference = puste

  const isActive = state === 'running' || state === 'completing'

  return (
    <div className={styles.container}>
      <div
        className={styles.timerWrap}
        onClick={state === 'completing' ? undefined : toggle}
        title={state === 'running' ? 'Pauza' : state === 'completing' ? '' : 'Start'}
        style={state === 'completing' ? { cursor: 'default' } : undefined}
      >
        <svg className={styles.timerSvg} viewBox="0 0 128 128">
          <circle
            cx="64" cy="64" r={radius}
            fill="none"
            stroke="rgba(192, 132, 252, 0.08)"
            strokeWidth="6"
          />
          <circle
            cx="64" cy="64" r={radius}
            fill="none"
            stroke={isActive ? 'url(#timerGrad)' : 'rgba(192, 132, 252, 0.3)'}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
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
            {state === 'running' ? 'FOCUS SESSION'
              : state === 'paused' ? 'PAUSED'
              : state === 'completing' ? 'COMPLETE'
              : 'CLICK TO START'}
          </span>
        </div>
      </div>

      {(state === 'running' || state === 'paused') && (
        <button className={styles.resetBtn} onClick={reset}>
          RESET
        </button>
      )}

      {activeTask && (
        <div className={styles.activeMission}>
          <div className={styles.missionHeader}>
            <span className={styles.missionHeaderLabel}>ACTIVE MISSION</span>
            <span className={styles.missionCritical}>
              {activeTask.important && activeTask.urgent ? 'CRITICAL' :
               activeTask.important ? 'HIGH' :
               activeTask.urgent ? 'HIGH' : 'MED'}
            </span>
          </div>
          <div className={styles.missionTitle}>{activeTask.title}</div>
          {activeTask.estimatedMinutes && (
            <div className={styles.missionMeta}>
              <span>ETA {activeTask.estimatedMinutes}m</span>
            </div>
          )}
          <div className={styles.progressRow}>
            <span className={styles.progressLabel}>PROGRESS</span>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: '0%' }} />
            </div>
            <span className={styles.progressPct}>0%</span>
          </div>
        </div>
      )}

      <div className={styles.sessionCount}>
        <span className={styles.sessionNum}>{sessionsToday}</span>
        <span className={styles.sessionLabel}>sessions today</span>
      </div>
    </div>
  )
}
