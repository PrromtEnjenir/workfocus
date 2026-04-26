// src/renderer/modules/tasks/components/IntelFeed.tsx
import { useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react'
import { api, listen } from '@/bridge/api'
import { useSharedStore } from '@/store/shared.slice'
import type { FiredReminderPayload, ReminderWithTask, TaskHistoryEntry } from '@/shared/types/global.types'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import styles from './IntelFeed.module.css'

type FeedEventType = 'mission_complete' | 'reminder' | 'followup'

interface FeedEvent {
  id: string
  type: FeedEventType
  title: string
  sub?: string
  time: string
}

export interface IntelFeedHandle {
  refresh: () => void
}

const DOT_COLOR: Record<FeedEventType, string> = {
  mission_complete: 'var(--color-success)',
  reminder: 'var(--accent)',
  followup: 'var(--priority-high)',
}

function relativeTime(iso: string): string {
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true, locale: pl })
  } catch {
    return '—'
  }
}

function historyToEvent(entry: TaskHistoryEntry): FeedEvent {
  return {
    id: `h-${entry.id}`,
    type: 'mission_complete',
    title: entry.title,
    sub: entry.postMortem ?? undefined,
    time: relativeTime(entry.completedAt),
  }
}

function reminderToEvent(r: ReminderWithTask): FeedEvent {
  return {
    id: `r-${r.id}`,
    type: r.type === 'followup' ? 'followup' : 'reminder',
    title: r.taskTitle,
    sub: r.type === 'followup' ? 'Oczekuje odpowiedzi' : 'Przypomnienie',
    time: relativeTime(r.remindAt),
  }
}

function firedToEvent(payload: FiredReminderPayload): FeedEvent {
  return {
    id: `fired-${payload.id}`,
    type: payload.type === 'followup' ? 'followup' : 'reminder',
    title: payload.taskTitle,
    sub: payload.type === 'followup' ? 'Follow-up!' : 'Przypomnienie!',
    time: 'TERAZ',
  }
}

export const IntelFeed = forwardRef<IntelFeedHandle>(function IntelFeed(_, ref) {
  const activeArea = useSharedStore((s) => s.activeArea)
  const [events, setEvents] = useState<FeedEvent[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const [history, reminders] = await Promise.all([
        api.history.getAll(activeArea, { area: activeArea }),
        api.reminders.getUpcoming(7),
      ])

      const historyEvents = history.slice(0, 5).map(historyToEvent)
      const reminderEvents = reminders
        .filter((r) => r.taskArea === activeArea)
        .map(reminderToEvent)

      setEvents([...historyEvents, ...reminderEvents])
    } catch (err) {
      console.error('[IntelFeed] Błąd ładowania danych:', err)
    } finally {
      setLoading(false)
    }
  }, [activeArea])

  // Eksponuj refresh na zewnątrz przez ref
  useImperativeHandle(ref, () => ({
    refresh: loadData,
  }), [loadData])

  useEffect(() => {
    setLoading(true)
    loadData()
  }, [loadData])

  useEffect(() => {
    const cleanup = listen.onReminderFired((payload) => {
      if (payload.taskArea !== activeArea) return
      setEvents((prev) => {
        const newEvent = firedToEvent(payload)
        const filtered = prev.filter((e) => e.id !== newEvent.id)
        return [newEvent, ...filtered].slice(0, 20)
      })
    })
    return cleanup
  }, [activeArea])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.headerLabel}>INTEL FEED</span>
        <span className={styles.headerDot} />
      </div>

      <div className={styles.feed}>
        {loading ? (
          <div className={styles.empty}>LOADING…</div>
        ) : events.length === 0 ? (
          <div className={styles.empty}>NO EVENTS</div>
        ) : (
          events.map((event) => (
            <div key={event.id} className={styles.event}>
              <div
                className={styles.dot}
                style={{ background: DOT_COLOR[event.type] }}
              />
              <div className={styles.eventContent}>
                <span className={styles.eventTitle}>{event.title}</span>
                {event.sub && (
                  <span className={styles.eventSub}>{event.sub}</span>
                )}
              </div>
              <span className={styles.eventTime}>{event.time}</span>
            </div>
          ))
        )}
      </div>

      <div className={styles.operator}>
        <div className={styles.operatorHeader}>OPERATOR</div>
        <div className={styles.operatorRow}>
          <div className={styles.operatorAvatar}>◎</div>
          <div className={styles.operatorInfo}>
            <span className={styles.operatorName}>OPERATOR</span>
            <span className={styles.operatorRank}>Senior · LVL 1</span>
          </div>
        </div>
        <div className={styles.operatorStats}>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>FOCUS</span>
            <div className={styles.statBar}>
              <div className={styles.statFill} style={{ width: '0%', background: 'var(--accent)' }} />
            </div>
            <span className={styles.statVal}>0</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>QUALITY</span>
            <div className={styles.statBar}>
              <div className={styles.statFill} style={{ width: '0%', background: 'var(--accent-2)' }} />
            </div>
            <span className={styles.statVal}>0</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>STREAK</span>
            <div className={styles.statBar}>
              <div className={styles.statFill} style={{ width: '0%', background: 'var(--xp-color)' }} />
            </div>
            <span className={styles.statVal}>0</span>
          </div>
        </div>
      </div>
    </div>
  )
})
