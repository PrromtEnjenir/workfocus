// src/renderer/modules/tasks/components/StatCards.tsx
import { useEffect, useState, useCallback } from 'react'
import { api } from '@/bridge/api'
import type { StreakData } from '@/shared/types/global.types'
import styles from './StatCards.module.css'

interface Stats {
  focusMinutes: number
  sessionsCompleted: number
  sessionsTotal: number
  streak: StreakData | null
  efficiency: number | null
}

function formatFocusTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

function formatEfficiency(value: number | null): string {
  if (value === null) return '—'
  return `${value}%`
}

function formatStreak(streak: StreakData | null): string {
  if (streak === null) return '—'
  return `${streak.current}d`
}

export function StatCards() {
  const [stats, setStats] = useState<Stats>({
    focusMinutes: 0,
    sessionsCompleted: 0,
    sessionsTotal: 0,
    streak: null,
    efficiency: null,
  })

  const loadStats = useCallback(async () => {
    try {
      const [pomodoro, streak, efficiency] = await Promise.all([
        api.pomodoro.statsToday(),
        api.stats.getStreak(),
        api.stats.getEfficiency(),
      ])

      setStats({
        focusMinutes: pomodoro.focusMinutes,
        sessionsCompleted: pomodoro.sessions.completed,
        sessionsTotal: pomodoro.sessions.total,
        streak,
        efficiency,
      })
    } catch (err) {
      console.error('[StatCards] Błąd ładowania statystyk:', err)
    }
  }, [])

  useEffect(() => {
    loadStats()
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
      value: formatStreak(stats.streak),
      sub: stats.streak ? `best ${stats.streak.best}d` : 'current',
      color: 'var(--xp-color)',
    },
    {
      label: 'EFFICIENCY',
      value: formatEfficiency(stats.efficiency),
      sub: stats.efficiency !== null
        ? stats.efficiency <= 100 ? 'under estimate' : 'over estimate'
        : 'vs estimate',
      color: stats.efficiency !== null && stats.efficiency > 120
        ? 'var(--color-danger, #ef4444)'
        : 'var(--accent-3)',
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
