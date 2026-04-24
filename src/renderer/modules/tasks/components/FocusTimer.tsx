import { useEffect, useRef, useState } from 'react'
import type { TaskModel } from '@/shared/types/global.types'
import styles from './FocusTimer.module.css'

interface FocusTimerProps {
  activeTask: TaskModel | null
}

type TimerState = 'idle' | 'running' | 'paused'

const DEFAULT_MINUTES = 25

export function FocusTimer({ activeTask }: FocusTimerProps) {
  const [state, setState] = useState<TimerState>('idle')
  const [totalSeconds, setTotalSeconds] = useState(DEFAULT_MINUTES * 60)
  const [remainingSeconds, setRemainingSeconds] = useState(DEFAULT_MINUTES * 60)
  const [sessions, setSessions] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (state === 'running') {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setState('idle')
            setSessions((s) => s + 1)
            return totalSeconds
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
  }, [state, totalSeconds])

  const toggle = () => {
    if (state === 'idle' || state === 'paused') setState('running')
    else setState('paused')
  }

  const reset = () => {
    setState('idle')
    setRemainingSeconds(totalSeconds)
  }

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  // SVG circle progress
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const progress = remainingSeconds / totalSeconds
  const dashOffset = circumference * (1 - progress)

  return (
    <div className={styles.container}>
      {/* Timer SVG */}
      <div className={styles.timerWrap} onClick={toggle} title={state === 'running' ? 'Pauza' : 'Start'}>
        <svg className={styles.timerSvg} viewBox="0 0 128 128">
          {/* Tło okręgu */}
          <circle
            cx="64" cy="64" r={radius}
            fill="none"
            stroke="rgba(192, 132, 252, 0.08)"
            strokeWidth="6"
          />
          {/* Postęp */}
          <circle
            cx="64" cy="64" r={radius}
            fill="none"
            stroke={state === 'running' ? 'url(#timerGrad)' : 'rgba(192, 132, 252, 0.3)'}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 64 64)"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
          {/* Gradient */}
          <defs>
            <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>
        </svg>

        {/* Czas w środku */}
        <div className={styles.timerInner}>
          <span className={styles.timerTime}>{timeStr}</span>
          <span className={styles.timerLabel}>
            {state === 'running' ? 'FOCUS SESSION' : state === 'paused' ? 'PAUSED' : 'CLICK TO START'}
          </span>
        </div>
      </div>

      {/* Reset button */}
      {state !== 'idle' && (
        <button className={styles.resetBtn} onClick={reset}>
          RESET
        </button>
      )}

      {/* Active Mission */}
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
          {activeTask.tagId && (
            <div className={styles.missionMeta}>
              {activeTask.estimatedMinutes && (
                <span>ETA {activeTask.estimatedMinutes}m</span>
              )}
            </div>
          )}
          {/* Progress bar (placeholder — 0% dopóki nie ma tracking) */}
          <div className={styles.progressRow}>
            <span className={styles.progressLabel}>PROGRESS</span>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: '0%' }} />
            </div>
            <span className={styles.progressPct}>0%</span>
          </div>
        </div>
      )}

      {/* Sessions count */}
      <div className={styles.sessionCount}>
        <span className={styles.sessionNum}>{sessions}</span>
        <span className={styles.sessionLabel}>sessions today</span>
      </div>
    </div>
  )
}
