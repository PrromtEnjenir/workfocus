import { useTranslation } from 'react-i18next'
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

// SVG diament — ikona "ważne"
function DiamondIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 8 8" fill="currentColor">
      <polygon points="4,0 8,4 4,8 0,4" />
    </svg>
  )
}

// Pain dots — 10 kropek
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

// Mapowanie important+urgent+painScore → badge CRITICAL/HIGH/MED/LOW
function getPriorityBadge(task: TaskModel): {
  label: string
  className: string
} | null {
  if (task.important && task.urgent) {
    return { label: 'CRITICAL', className: styles.badgeCritical }
  }
  if (task.important) {
    return { label: 'HIGH', className: styles.badgeHigh }
  }
  if (task.urgent) {
    return { label: 'HIGH', className: styles.badgeHigh }
  }
  if (task.painScore >= 7) {
    return { label: 'MED', className: styles.badgeMed }
  }
  return null // LOW — nie pokazujemy badge żeby nie zaśmiecać
}

const TYPE_ICON: Record<string, string> = {
  email: '✉',
  waiting_for: '⏳',
  task: '',
}

export function TaskItem({
  task,
  tags,
  onComplete,
  onDelete,
  onSelect,
  selected,
}: TaskItemProps) {
  const { t } = useTranslation('tasks')
  const tag = tags.find((tg) => tg.id === task.tagId)
  const priorityBadge = getPriorityBadge(task)

  const isOverdue =
    task.deadline != null &&
    task.deadline < new Date().toISOString().substring(0, 10)

  return (
    <li
      className={`${styles.item} ${selected ? styles.selected : ''}`}
      onClick={() => onSelect(task.id)}
      role="option"
      aria-selected={selected}
    >
      {/* Checkbox */}
      <button
        className={styles.completeBtn}
        aria-label={t('complete')}
        title={t('complete')}
        onClick={(e) => {
          e.stopPropagation()
          onComplete(task.id)
        }}
      />

      {/* Ikony priorytetu */}
      {(task.important || task.urgent) && (
        <div className={styles.priorityIcons}>
          {task.important && <DiamondIcon className={styles.iconImportant} />}
          {task.urgent && <div className={styles.iconUrgent} />}
        </div>
      )}

      {/* Treść */}
      <div className={styles.content}>
        <div className={styles.titleRow}>
          {TYPE_ICON[task.type] && (
            <span className={styles.typeIcon}>{TYPE_ICON[task.type]}</span>
          )}
          <span className={styles.title}>{task.title}</span>

          {/* Badge priorytetu */}
          {priorityBadge && (
            <span
              className={`${styles.priorityBadge} ${priorityBadge.className}`}
            >
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
              <span
                className={isOverdue ? styles.deadline : styles.deadlineOk}
              >
                {task.deadline.substring(0, 10)}
              </span>
            )}
            {task.estimatedMinutes && (
              <span className={styles.estimate}>
                ETA {task.estimatedMinutes}m
              </span>
            )}
          </div>
        )}
      </div>

      {/* Pain dots */}
      <div className={styles.painScore}>
        <PainDots score={task.painScore} />
      </div>

      {/* Delete */}
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
