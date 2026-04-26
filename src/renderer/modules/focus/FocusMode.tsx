// src/renderer/modules/focus/FocusMode.tsx
import { useEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/shallow'
import { api, broadcast, listen } from '@/bridge/api'
import { usePomodoroStore } from '@/store/pomodoro.slice'
import { useSharedStore } from '@/store/shared.slice'
import timerEndSound from '@/assets/timer-end.wav'
import styles from './FocusMode.module.css'

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export default function FocusMode() {
  const focusTaskId = useSharedStore((s) => s.focusTaskId)

  const {
    timerState,
    totalSeconds,
    remainingSeconds,
    currentSession,
    sessionsToday,
    setTimerState,
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
      setRemainingSeconds: s.setRemainingSeconds,
      setCurrentSession: s.setCurrentSession,
      setSessionsToday: s.setSessionsToday,
      syncFromBroadcast: s.syncFromBroadcast,
    }))
  )

  const [muted, setMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio(timerEndSound)
    audioRef.current.volume = muted ? 0 : 0.7
  }, [])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : 0.7
    }
  }, [muted])

  // Odbierz sync z głównego okna
  useEffect(() => {
    const cleanup = listen.onTimerSync((payload) => {
      syncFromBroadcast(payload)
    })
    return cleanup
  }, [syncFromBroadcast])

  // Obsługa completing w mini-oknie (dźwięk)
  useEffect(() => {
    if (timerState !== 'completing') return
    audioRef.current?.play().catch(() => {})

    const timeout = setTimeout(() => {
      setTimerState('idle')
      setRemainingSeconds(totalSeconds)
    }, 800)

    return () => clearTimeout(timeout)
  }, [timerState, totalSeconds, setTimerState, setRemainingSeconds])

  const handlePauseResume = () => {
    const next = timerState === 'running' ? 'paused' : 'running'
    setTimerState(next)
    broadcast.timerState({
      timerState: next,
      totalSeconds,
      remainingSeconds,
      sessionId: currentSession?.id ?? null,
      focusTaskId: focusTaskId ?? null,
    })
  }

  const handleReset = async () => {
    if (currentSession) {
      try {
        await api.pomodoro.stop(currentSession.id, false, 'reset')
        setCurrentSession(null)
      } catch (err) {
        console.error('[FocusMode] Błąd resetu:', err)
      }
    }
    setTimerState('idle')
    setRemainingSeconds(totalSeconds)
    broadcast.timerState({
      timerState: 'idle',
      totalSeconds,
      remainingSeconds: totalSeconds,
      sessionId: null,
      focusTaskId: focusTaskId ?? null,
    })
  }

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  const radius = 70
  const circumference = 2 * Math.PI * radius
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0
  const dashOffset = circumference * progress
  const isActive = timerState === 'running' || timerState === 'completing'

  return (
    <div className={styles.window}>
      {/* Titlebar do przeciągania */}
      <div className={styles.titlebar}>
        <span className={styles.titlebarLabel}>FOCUS MODE</span>
        <button
          className={styles.muteBtn}
          onClick={() => setMuted((v) => !v)}
          title={muted ? 'Włącz dźwięk' : 'Wycisz'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
        <button
          className={styles.closeBtn}
          onClick={() => broadcast.closeFocusWindow()}
          title="Zamknij"
        >
          ✕
        </button>
      </div>

      {/* Timer SVG */}
      <div className={styles.timerWrap}>
        <svg className={styles.timerSvg} viewBox="0 0 180 180">
          <circle cx="90" cy="90" r={radius} fill="none"
            stroke="rgba(192, 132, 252, 0.08)" strokeWidth="8" />
          <circle cx="90" cy="90" r={radius} fill="none"
            stroke={isActive ? 'url(#focusGrad)' : 'rgba(192, 132, 252, 0.3)'}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={dashOffset}
            transform="rotate(-90 90 90)"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
          <defs>
            <linearGradient id="focusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>
        </svg>

        <div className={styles.timerInner}>
          <span className={styles.timerTime}>{timeStr}</span>
          <span className={styles.timerLabel}>
            {timerState === 'running' ? 'FOCUS'
              : timerState === 'paused' ? 'PAUSED'
              : timerState === 'completing' ? 'DONE'
              : 'IDLE'}
          </span>
        </div>
      </div>

      {/* Kontrolki */}
      <div className={styles.controls}>
        {(timerState === 'running' || timerState === 'paused') && (
          <>
            <button className={styles.controlBtn} onClick={handlePauseResume}>
              {timerState === 'running' ? '⏸ Pauza' : '▶ Wznów'}
            </button>
            <button className={`${styles.controlBtn} ${styles.resetBtn}`} onClick={handleReset}>
              ↺ Reset
            </button>
          </>
        )}
        {timerState === 'idle' && (
          <p className={styles.idleHint}>Uruchom timer w głównym oknie</p>
        )}
      </div>

      {/* Sesje dziś */}
      <div className={styles.sessions}>
        <span className={styles.sessionsNum}>{sessionsToday}</span>
        <span className={styles.sessionsLabel}>sesji dziś</span>
      </div>
    </div>
  )
}
