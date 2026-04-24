import styles from './StatCards.module.css'

// Placeholder — w pełnej implementacji dane z api.stats
const MOCK_STATS = [
  { label: 'FOCUS TIME', value: '0h 0m', sub: 'today', color: 'var(--accent)' },
  { label: 'SESSIONS', value: '0 / 0', sub: 'completed', color: 'var(--accent-2)' },
  { label: 'STREAK', value: '0 days', sub: 'current', color: 'var(--xp-color)' },
  { label: 'EFFICIENCY', value: '—', sub: 'vs avg', color: 'var(--accent-3)' },
]

export function StatCards() {
  return (
    <div className={styles.grid}>
      {MOCK_STATS.map((stat) => (
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
