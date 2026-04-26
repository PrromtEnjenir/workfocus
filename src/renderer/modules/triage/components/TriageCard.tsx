// src/renderer/modules/triage/components/TriageCard.tsx
import { useState } from 'react'
import type { TriageTask } from '../types/triage.types'
import styles from './TriageCard.module.css'

interface Props {
  task: TriageTask
  rank: number
  onUpdate: (
    id: string,
    data: { important?: boolean; urgent?: boolean; painScore?: number }
  ) => Promise<void>
}

export function TriageCard({ task, rank, onUpdate }: Props) {
  const [localPain, setLocalPain] = useState(task.painScore)
  const [saving, setSaving] = useState(false)

  const toggle = async (field: 'important' | 'urgent') => {
    setSaving(true)
    try {
      await onUpdate(task.id, { [field]: !task[field] })
    } finally {
      setSaving(false)
    }
  }

  const handlePainCommit = async (value: number) => {
    if (value === task.painScore) return
    setSaving(true)
    try {
      await onUpdate(task.id, { painScore: value })
    } finally {
      setSaving(false)
    }
  }

  const quadrant = (() => {
    if (task.important && task.urgent) return { label: 'DO NOW', cls: 'q1' }
    if (task.important && !task.urgent) return { label: 'SCHEDULE', cls: 'q2' }
    if (!task.important && task.urgent) return { label: 'DELEGATE', cls: 'q3' }
    return { label: 'DROP', cls: 'q4' }
  })()

  return (
    <div className={`${styles.card} ${saving ? styles.saving : ''}`}>
      <div className={styles.rank}>#{rank}</div>

      <div className={styles.main}>
        <div className={styles.header}>
          <span className={`${styles.quadrantBadge} ${styles[quadrant.cls]}`}>
            {quadrant.label}
          </span>
          <span className={styles.score}>{task.score}pts</span>
        </div>

        <p className={styles.title}>{task.title}</p>

        {/* Eisenhower toggles */}
        <div className={styles.toggleRow}>
          <button
            className={`${styles.toggle} ${task.important ? styles.toggleActive : ''}`}
            onClick={() => toggle('important')}
            disabled={saving}
          >
            <span className={styles.toggleIcon}>★</span>
            WAŻNE
          </button>
          <button
            className={`${styles.toggle} ${task.urgent ? styles.toggleUrgentActive : ''}`}
            onClick={() => toggle('urgent')}
            disabled={saving}
          >
            <span className={styles.toggleIcon}>⚡</span>
            PILNE
          </button>
        </div>

        {/* Pain slider */}
        <div className={styles.painRow}>
          <span className={styles.painLabel}>BÓL</span>
          <input
            type="range"
            min={1}
            max={10}
            value={localPain}
            className={styles.painSlider}
            onChange={(e) => setLocalPain(Number(e.target.value))}
            onMouseUp={() => handlePainCommit(localPain)}
            onTouchEnd={() => handlePainCommit(localPain)}
            disabled={saving}
          />
          <span className={styles.painValue}>{localPain}</span>
        </div>
      </div>
    </div>
  )
}
