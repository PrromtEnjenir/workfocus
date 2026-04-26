// src/renderer/modules/triage/index.tsx
import { useState } from 'react'
import { useTriageTasks } from './hooks/useTriageTasks'
import { TriageCard } from './components/TriageCard'
import { PairComparison } from './components/PairComparison'
import type { TriageMode } from './types/triage.types'
import styles from './TriagePage.module.css'

export default function TriagePage(): JSX.Element {
  const [mode, setMode] = useState<TriageMode>('matrix')
  const { tasks, loading, refresh, updatePriority } = useTriageTasks()

  const quadrants = {
    q1: tasks.filter((t) => t.important && t.urgent),
    q2: tasks.filter((t) => t.important && !t.urgent),
    q3: tasks.filter((t) => !t.important && t.urgent),
    q4: tasks.filter((t) => !t.important && !t.urgent),
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>TRIAGE</h1>
          <span className={styles.count}>{tasks.length} aktywnych zadań</span>
        </div>

        <div className={styles.modeSwitch}>
          <button
            className={`${styles.modeBtn} ${mode === 'matrix' ? styles.modeBtnActive : ''}`}
            onClick={() => setMode('matrix')}
          >
            ⊞ MATRIX
          </button>
          <button
            className={`${styles.modeBtn} ${mode === 'pairs' ? styles.modeBtnActive : ''}`}
            onClick={() => setMode('pairs')}
            disabled={tasks.length < 2}
            title={tasks.length < 2 ? 'Potrzeba co najmniej 2 zadań' : undefined}
          >
            ⇄ PARY
          </button>
        </div>
      </div>

      {loading && (
        <div className={styles.loading}>Ładowanie zadań…</div>
      )}

      {!loading && tasks.length === 0 && (
        <div className={styles.empty}>
          <p>Brak aktywnych zadań do triage.</p>
        </div>
      )}

      {!loading && tasks.length > 0 && mode === 'pairs' && (
        <PairComparison
          tasks={tasks}
          onUpdate={updatePriority}
          onDone={() => {
            setMode('matrix')
            refresh()
          }}
        />
      )}

      {!loading && tasks.length > 0 && mode === 'matrix' && (
        <div className={styles.matrixLayout}>
          {/* Eisenhower 2x2 — wizualne */}
          <div className={styles.eisenhower}>
            <div className={styles.axisY}>WAŻNOŚĆ →</div>
            <div className={styles.axisX}>PILNOŚĆ →</div>

            <div className={styles.quadrantGrid}>
              <QuadrantCell
                label="DO NOW"
                sublabel="Ważne + Pilne"
                cls="q1"
                tasks={quadrants.q1}
                allTasks={tasks}
                onUpdate={updatePriority}
              />
              <QuadrantCell
                label="SCHEDULE"
                sublabel="Ważne, nie pilne"
                cls="q2"
                tasks={quadrants.q2}
                allTasks={tasks}
                onUpdate={updatePriority}
              />
              <QuadrantCell
                label="DELEGATE"
                sublabel="Pilne, nie ważne"
                cls="q3"
                tasks={quadrants.q3}
                allTasks={tasks}
                onUpdate={updatePriority}
              />
              <QuadrantCell
                label="DROP"
                sublabel="Nie ważne, nie pilne"
                cls="q4"
                tasks={quadrants.q4}
                allTasks={tasks}
                onUpdate={updatePriority}
              />
            </div>
          </div>

          {/* Lista priorytetowa — posortowana po score */}
          <div className={styles.priorityList}>
            <h2 className={styles.listTitle}>KOLEJNOŚĆ PRIORYTETÓW</h2>
            <div className={styles.cards}>
              {tasks.map((task, i) => (
                <TriageCard
                  key={task.id}
                  task={task}
                  rank={i + 1}
                  onUpdate={updatePriority}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

interface QuadrantCellProps {
  label: string
  sublabel: string
  cls: 'q1' | 'q2' | 'q3' | 'q4'
  tasks: ReturnType<typeof useTriageTasks>['tasks']
  allTasks: ReturnType<typeof useTriageTasks>['tasks']
  onUpdate: ReturnType<typeof useTriageTasks>['updatePriority']
}

function QuadrantCell({ label, sublabel, cls, tasks, onUpdate }: QuadrantCellProps) {
  return (
    <div className={`${styles.quadrant} ${styles[cls]}`}>
      <div className={styles.quadrantHeader}>
        <span className={styles.quadrantLabel}>{label}</span>
        <span className={styles.quadrantSub}>{sublabel}</span>
        <span className={styles.quadrantCount}>{tasks.length}</span>
      </div>
      <ul className={styles.quadrantList}>
        {tasks.slice(0, 5).map((task) => (
          <li key={task.id} className={styles.quadrantItem}>
            <span className={styles.quadrantTitle}>{task.title}</span>
            <span className={styles.quadrantPain}>{task.painScore}</span>
          </li>
        ))}
        {tasks.length > 5 && (
          <li className={styles.quadrantMore}>+{tasks.length - 5} więcej</li>
        )}
      </ul>
    </div>
  )
}
