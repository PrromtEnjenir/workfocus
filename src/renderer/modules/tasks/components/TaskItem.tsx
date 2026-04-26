import { useTranslation } from 'react-i18next'
import { useShallow } from 'zustand/shallow'
import { useSharedStore } from '@/store/shared.slice'
import type { TagModel, TaskModel } from '@/shared/types/global.types'
import styles from './TaskItem.module.css'

interface TaskItemProps {
  task: TaskModel
  tags: TagModel[]
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onSelect: (id: string) => void
  selected: boolean
}

function DiamondIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 8 8" fill="currentColor">
      <polygon points="4,0 8,4 4,8 0,4" />
    </svg>
  )
}

function PainDots({ score }: { score: number }) {
  return (
    <div className={styles.painDots}>
      {Array.from({ length: 10 }, (_, i) => {
        const filled = i < score
        const high = filled && score >= 8
        return (
          <div
            key={i}
            className={`${styles.painDot} ${
              filled ? (high ? styles.painDotHigh : styles.painDotFilled) : ''
            }`}
          />
        )
      })}
    </div>
  )
}

function getPriorityBadge(task: TaskModel): { label: string; className: string } | null {
  if (task.important && task.urgent) return { label: 'CRITICAL', className: styles.badgeCritical }
  if (task.important) return { label: 'HIGH', className: styles.badgeHigh }
  if (task.urgent) return { label: 'HIGH', className: styles.badgeHigh }
  if (task.painScore >= 7) return { label: 'MED', className: styles.badgeMed }
  return null
}

const TYPE_ICON: Record<string, string> = {
  email: '✉',
  waiting_for: '⏳',
  task: '',
}

export function TaskItem({
  task,
  tags,
  onDelete,
  onSelect,
  selected,
}: TaskItemProps) {
  const { t } = useTranslation('tasks')

  // Zustand v5: selector zwracający obiekt MUSI używać useShallow
  const { focusTaskId, setFocusTaskId } = useSharedStore(
    useShallow((s) => ({
      focusTaskId: s.focusTaskId,
      setFocusTaskId: s.setFocusTaskId,
    }))
  )

  const tag = tags.find((tg) => tg.id === task.tagId)
  const priorityBadge = getPriorityBadge(task)
  const isFocused = focusTaskId === task.id

  const isOverdue =
    task.deadline != null &&
    task.deadline < new Date().toISOString().substring(0, 10)

  const handleFocus = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFocusTaskId(isFocused ? null : task.id)
  }

  return (
    <li
      className={`${styles.item} ${selected ? styles.selected : ''}`}
      onClick={() => onSelect(task.id)}
      role="option"
      aria-selected={selected}
    >
      <button
        className={`${styles.focusBtn} ${isFocused ? styles.focusBtnActive : ''}`}
        aria-label="Ustaw jako focus"
        title={isFocused ? 'Zdejmij focus' : 'Ustaw jako Active Mission'}
        onClick={handleFocus}
      >
        {isFocused ? '◉' : '▶'}
      </button>

      {(task.important || task.urgent) && (
        <div className={styles.priorityIcons}>
          {task.important && <DiamondIcon className={styles.iconImportant} />}
          {task.urgent && <div className={styles.iconUrgent} />}
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.titleRow}>
          {TYPE_ICON[task.type] && (
            <span className={styles.typeIcon}>{TYPE_ICON[task.type]}</span>
          )}
          <span className={styles.title}>{task.title}</span>
          {priorityBadge && (
            <span className={`${styles.priorityBadge} ${priorityBadge.className}`}>
              {priorityBadge.label}
            </span>
          )}
        </div>

        {(tag || task.deadline || task.estimatedMinutes) && (
          <div className={styles.meta}>
            {tag && (
              <span
                className={styles.tag}
                style={{ '--tag-color': tag.color } as React.CSSProperties}
              >
                {tag.name}
              </span>
            )}
            {task.deadline && (
              <span className={isOverdue ? styles.deadline : styles.deadlineOk}>
                {task.deadline.substring(0, 10)}
              </span>
            )}
            {task.estimatedMinutes && (
              <span className={styles.estimate}>ETA {task.estimatedMinutes}m</span>
            )}
          </div>
        )}
      </div>

      <div className={styles.painScore}>
        <PainDots score={task.painScore} />
      </div>

      <button
        className={styles.deleteBtn}
        aria-label={t('delete')}
        onClick={(e) => {
          e.stopPropagation()
          onDelete(task.id)
        }}
      >
        ×
      </button>
    </li>
  )
}
