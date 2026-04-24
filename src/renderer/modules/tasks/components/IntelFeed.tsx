import styles from './IntelFeed.module.css'

// Typy eventów w feedzie
type FeedEventType = 'session_start' | 'mission_complete' | 'mission_add' | 'streak' | 'reminder'

interface FeedEvent {
  id: string
  type: FeedEventType
  title: string
  sub?: string
  time: string
}

// Kolory dot per typ
const DOT_COLOR: Record<FeedEventType, string> = {
  session_start: 'var(--accent)',
  mission_complete: 'var(--color-success)',
  mission_add: 'var(--accent-2)',
  streak: 'var(--xp-color)',
  reminder: 'var(--priority-high)',
}

// Placeholder events — w pełnej implementacji z DB/event bus
const PLACEHOLDER_EVENTS: FeedEvent[] = [
  {
    id: '1',
    type: 'session_start',
    title: 'Focus session started',
    sub: 'Ready to work',
    time: 'NOW',
  },
]

interface IntelFeedProps {
  events?: FeedEvent[]
}

export function IntelFeed({ events = PLACEHOLDER_EVENTS }: IntelFeedProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.headerLabel}>INTEL FEED</span>
        <span className={styles.headerDot} />
      </div>

      <div className={styles.feed}>
        {events.length === 0 ? (
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

      {/* Operator panel na dole */}
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
}
