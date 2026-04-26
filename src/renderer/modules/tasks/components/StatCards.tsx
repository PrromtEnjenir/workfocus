// src/renderer/modules/tasks/components/StatCards.tsx
import { useEffect, useState, useCallback } from 'react'
import { api } from '@/bridge/api'
import styles from './StatCards.module.css'

interface Stats {
  focusMinutes: number
  sessionsCompleted: number
  sessionsTotal: number
}

function formatFocusTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

export function StatCards() {
  const [stats, setStats] = useState<Stats>({
    focusMinutes: 0,
    sessionsCompleted: 0,
    sessionsTotal: 0,
  })

  const loadStats = useCallback(async () => {
    try {
      const data = await api.pomodoro.statsToday()
      setStats({
        focusMinutes: data.focusMinutes,
        sessionsCompleted: data.sessions.completed,
        sessionsTotal: data.sessions.total,
      })
    } catch (err) {
      console.error('[StatCards] Błąd ładowania statystyk:', err)
    }
  }, [])

  useEffect(() => {
    loadStats()
    // Odświeżaj co minutę — po zakończeniu sesji pomodoro liczniki się aktualizują
    const interval = setInterval(loadStats, 60_000)
    return () => clearInterval(interval)
  }, [loadStats])

  const cards = [
    {
      label: 'FOCUS TIME',
      value: formatFocusTime(stats.focusMinutes),
      sub: 'today',
      color: 'var(--accent)',
    },
    {
      label: 'SESSIONS',
      value: `${stats.sessionsCompleted} / ${stats.sessionsTotal}`,
      sub: 'completed',
      color: 'var(--accent-2)',
    },
    {
      label: 'STREAK',
      value: '—',
      sub: 'current',
      color: 'var(--xp-color)',
    },
    {
      label: 'EFFICIENCY',
      value: '—',
      sub: 'vs avg',
      color: 'var(--accent-3)',
    },
  ]

  return (
    <div className={styles.grid}>
      {cards.map((stat) => (
        <div key={stat.label} className={styles.card}>
          <span className={styles.label}>{stat.label}</span>
          <span className={styles.value} style={{ color: stat.color }}>
            {stat.value}
          </span>
          <span className={styles.sub}>{stat.sub}</span>
        </div>
      ))}
    </div>
  )
}
