// src/renderer/modules/triage/components/PairComparison.tsx
import { useState, useCallback, useMemo } from 'react'
import type { TriageTask } from '../types/triage.types'
import styles from './PairComparison.module.css'

interface Props {
  tasks: TriageTask[]
  onUpdate: (
    id: string,
    data: { important?: boolean; urgent?: boolean; painScore?: number }
  ) => Promise<void>
  onDone: () => void
}

type Quadrant = 'q1' | 'q2' | 'q3' | 'q4'

interface QuadrantMeta {
  key: Quadrant
  label: string
  color: string
  filter: (t: TriageTask) => boolean
}

const QUADRANTS: QuadrantMeta[] = [
  {
    key: 'q1',
    label: 'DO NOW',
    color: '#ef4444',
    filter: (t) => t.important && t.urgent,
  },
  {
    key: 'q2',
    label: 'SCHEDULE',
    color: '#7c3aed',
    filter: (t) => t.important && !t.urgent,
  },
  {
    key: 'q3',
    label: 'DELEGATE',
    color: '#f59e0b',
    filter: (t) => !t.important && t.urgent,
  },
  {
    key: 'q4',
    label: 'DROP',
    color: '#6b7280',
    filter: (t) => !t.important && !t.urgent,
  },
]

interface Pair {
  a: TriageTask
  b: TriageTask
  quadrant: QuadrantMeta
}

/**
 * Buduje pary TYLKO wewnątrz ćwiartki.
 * Dla każdej ćwiartki z >=2 taskami: max 3 pary sąsiadujące (po score DESC).
 */
function buildIntraQuadrantPairs(tasks: TriageTask[]): Pair[] {
  const pairs: Pair[] = []

  for (const q of QUADRANTS) {
    const group = tasks.filter(q.filter).sort((a, b) => b.score - a.score)
    if (group.length < 2) continue

    const maxPairs = Math.min(3, group.length - 1)
    for (let i = 0; i < maxPairs; i++) {
      pairs.push({ a: group[i], b: group[i + 1], quadrant: q })
    }
  }

  return pairs
}

export function PairComparison({ tasks, onUpdate, onDone }: Props) {
  const pairs = useMemo(() => buildIntraQuadrantPairs(tasks), [tasks])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [resolvedPairs] = useState(() => new Set<string>())

  const done = pairs.length === 0 || currentIndex >= pairs.length
  const currentPair = pairs[currentIndex]
  const progress = pairs.length > 0 ? (currentIndex / pairs.length) * 100 : 100

  /**
   * Wybór: winner pain +1 (max 10), loser pain -1 (min 1).
   * NIE ruszamy important ani urgent — ćwiartka się nie zmienia.
   */
  const choose = useCallback(async (winnerId: string, loserId: string) => {
    const pairKey = `${winnerId}-${loserId}`
    if (resolvedPairs.has(pairKey) || saving) return
    resolvedPairs.add(pairKey)

    setSaving(true)
    try {
      const winner = tasks.find((t) => t.id === winnerId)
      const loser = tasks.find((t) => t.id === loserId)
      if (!winner || !loser) return

      const updates: Array<Promise<void>> = []

      if (winner.painScore < 10) {
        updates.push(onUpdate(winnerId, { painScore: winner.painScore + 1 }))
      }
      if (loser.painScore > 1) {
        updates.push(onUpdate(loserId, { painScore: loser.painScore - 1 }))
      }

      await Promise.all(updates)
    } finally {
      setSaving(false)
      setCurrentIndex((i) => i + 1)
    }
  }, [saving, tasks, onUpdate, resolvedPairs])

  const advance = () => setCurrentIndex((i) => i + 1)

  if (pairs.length === 0) {
    return (
      <div className={styles.done}>
        <div className={styles.doneIcon}>◈</div>
        <h2 className={styles.doneTitle}>BRAK PAR DO PORÓWNANIA</h2>
        <p className={styles.doneSub}>
          Każda ćwiartka ma co najwyżej jedno zadanie. Użyj toggles w Matrix
          żeby przypisać priorytety, potem wróć tu.
        </p>
        <button className={styles.doneBtn} onClick={onDone}>
          Wróć do Matrix
        </button>
      </div>
    )
  }

  if (done) {
    return (
      <div className={styles.done}>
        <div className={styles.doneIcon}>✓</div>
        <h2 className={styles.doneTitle}>TRIAGE KOMPLETNY</h2>
        <p className={styles.doneSub}>Kolejność wewnątrz ćwiartek zaktualizowana.</p>
        <button className={styles.doneBtn} onClick={onDone}>
          Wróć do Matrix
        </button>
      </div>
    )
  }

  const [a, b] = [currentPair.a, currentPair.b]
  const q = currentPair.quadrant

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.step}>
          {currentIndex + 1} / {pairs.length}
        </span>
        <span className={styles.prompt}>Który task jest ważniejszy?</span>
        <span className={styles.quadrantTag} style={{ color: q.color }}>
          w obrębie: {q.label}
        </span>
      </div>

      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      <div className={styles.pairRow}>
        <button
          className={styles.pairCard}
          onClick={() => choose(a.id, b.id)}
          disabled={saving}
        >
          <PairCardContent task={a} />
        </button>

        <div className={styles.vs}>VS</div>

        <button
          className={styles.pairCard}
          onClick={() => choose(b.id, a.id)}
          disabled={saving}
        >
          <PairCardContent task={b} />
        </button>
      </div>

      <div className={styles.hint}>
        Wybór przesuwa BÓL o ±1 wewnątrz ćwiartki. Nie zmienia Eisenhowera.
      </div>

      <button className={styles.skipBtn} onClick={advance} disabled={saving}>
        Pomiń tę parę →
      </button>
    </div>
  )
}

function PairCardContent({ task }: { task: TriageTask }) {
  return (
    <div className={styles.cardContent}>
      <p className={styles.cardTitle}>{task.title}</p>
      <div className={styles.cardMeta}>
        <span className={styles.pain}>BÓL: {task.painScore}/10</span>
        <span className={styles.score}>{task.score}pts</span>
      </div>
    </div>
  )
}
