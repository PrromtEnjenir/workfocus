import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useShallow } from 'zustand/shallow'
import { api } from '@/bridge/api'
import { useSharedStore } from '@/store/shared.slice'
import { useTasksStore } from '@/store/tasks.slice'
import type { CompletionMeta, FrictionReason, UpdateTaskDTO } from '@/shared/types/global.types'
import { useTags } from '../hooks/useTags'
import { TaskForm } from './TaskForm'
import styles from './TaskDetail.module.css'

interface TaskDetailProps {
  onComplete: (id: string, meta: CompletionMeta) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function TaskDetail({ onComplete, onDelete }: TaskDetailProps) {
  const { t } = useTranslation('tasks')
  const { activeTaskId, setActiveTaskId, activeArea } = useSharedStore(
    useShallow((s) => ({
      activeTaskId: s.activeTaskId,
      setActiveTaskId: s.setActiveTaskId,
      activeArea: s.activeArea,
    }))
  )

  const task = useTasksStore((s) => s.items.find((t) => t.id === activeTaskId) ?? null)
  const upsertItem = useTasksStore((s) => s.upsertItem)
  const { tags } = useTags()

  const [editing, setEditing] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [meta, setMeta] = useState<CompletionMeta>({})

  useEffect(() => {
    setEditing(false)
    setCompleting(false)
    setMeta({})
  }, [activeTaskId])

  if (!activeTaskId || !task) {
    return (
      <div className={styles.empty}>
        <span>Brak wybranego zadania</span>
        <span className={styles.emptyHint}>Kliknij zadanie na liście</span>
      </div>
    )
  }

  const tag = tags.find((tg) => tg.id === task.tagId)

  const handleEdit = async (data: UpdateTaskDTO) => {
    const updated = await api.tasks.update(task.id, data)
    upsertItem(updated)
    setEditing(false)
  }

  const handleComplete = async () => {
    await onComplete(task.id, meta)
    setActiveTaskId(null)
    setCompleting(false)
  }

  const handleDelete = async () => {
    await onDelete(task.id)
    setActiveTaskId(null)
  }

  if (editing) {
    return (
      <div className={styles.panel}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => setEditing(false)}>
            ← Wróć
          </button>
        </div>
        <TaskForm
          tags={tags}
          area={activeArea}
          initialData={task}
          onSubmit={handleEdit}
          onCancel={() => setEditing(false)}
        />
      </div>
    )
  }

  if (completing) {
    return (
      <div className={styles.panel}>
        <div className={styles.header}>
          <span className={styles.title}>{t('completingTask')}</span>
          <button className={styles.closeBtn} onClick={() => setCompleting(false)}>✕</button>
        </div>

        <div className={styles.postMortem}>
          <div className={styles.postMortemTitle}>Post-mortem</div>

          <div className={styles.field}>
            <span>{t('actualMinutes')}</span>
            <input
              type="number"
              min={1}
              placeholder="min"
              value={meta.actualMinutes ?? ''}
              onChange={(e) =>
                setMeta((m) => ({ ...m, actualMinutes: e.target.value ? Number(e.target.value) : undefined }))
              }
            />
          </div>

          <div className={styles.field}>
            <span>{t('frictionReason')}</span>
            <select
              value={meta.frictionReason ?? 'none'}
              onChange={(e) => setMeta((m) => ({ ...m, frictionReason: e.target.value as FrictionReason }))}
            >
              <option value="none">{t('frictionNone')}</option>
              <option value="waiting">{t('frictionWaiting')}</option>
              <option value="missing_info">{t('frictionMissingInfo')}</option>
              <option value="technical">{t('frictionTechnical')}</option>
              <option value="reprioritized">{t('frictionReprioritized')}</option>
            </select>
          </div>

          <div className={styles.field}>
            <span>{t('priorityAccurate')}</span>
            <select
              value={meta.priorityAccurate === undefined ? '' : meta.priorityAccurate ? 'yes' : 'no'}
              onChange={(e) =>
                setMeta((m) => ({
                  ...m,
                  priorityAccurate: e.target.value === '' ? undefined : e.target.value === 'yes',
                }))
              }
            >
              <option value="">{t('skip')}</option>
              <option value="yes">{t('yes')}</option>
              <option value="no">{t('no')}</option>
            </select>
          </div>

          <div className={styles.fieldFull}>
            <span>{t('postMortem')}</span>
            <textarea
              rows={3}
              placeholder={t('postMortemPlaceholder')}
              value={meta.postMortem ?? ''}
              onChange={(e) => setMeta((m) => ({ ...m, postMortem: e.target.value || undefined }))}
            />
          </div>

          <button className={styles.confirmBtn} onClick={handleComplete}>
            ✓ {t('confirmComplete')}
          </button>
        </div>
      </div>
    )
  }

  // Widok szczegółów
  const typeLabel: Record<string, string> = {
    task: 'Zadanie',
    email: 'Email',
    waiting_for: 'Czekam na',
  }

  const energyLabel: Record<string, string> = {
    high: 'Wysoka',
    medium: 'Średnia',
    low: 'Niska',
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.badges}>
          {task.important && <span className={styles.badgeImp}>Ważne</span>}
          {task.urgent && <span className={styles.badgeUrg}>Pilne</span>}
          {tag && (
            <span
              className={styles.badgeTag}
              style={{ '--tag-color': tag.color } as React.CSSProperties}
            >
              {tag.name}
            </span>
          )}
        </div>
        <button className={styles.closeBtn} onClick={() => setActiveTaskId(null)}>✕</button>
      </div>

      <h2 className={styles.taskTitle}>{task.title}</h2>

      <div className={styles.fields}>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>Typ</span>
          <span className={styles.fieldValue}>{typeLabel[task.type]}</span>
        </div>

        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>Ból</span>
          <span className={styles.fieldValue}>{task.painScore} / 10</span>
        </div>

        {task.deadline && (
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Termin</span>
            <span className={styles.fieldValue}>{task.deadline.substring(0, 10)}</span>
          </div>
        )}

        {task.estimatedMinutes && (
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Szac. czas</span>
            <span className={styles.fieldValue}>{task.estimatedMinutes} min</span>
          </div>
        )}

        {task.energyRequired && (
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Energia</span>
            <span className={styles.fieldValue}>{energyLabel[task.energyRequired]}</span>
          </div>
        )}

        {task.waitingForPerson && (
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Czeka na</span>
            <span className={styles.fieldValue}>{task.waitingForPerson}</span>
          </div>
        )}

        {task.notes && (
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Notatki</span>
            <span className={`${styles.fieldValue} ${styles.notes}`}>{task.notes}</span>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <button className={styles.editBtn} onClick={() => setEditing(true)}>
          Edytuj
        </button>
        <button className={styles.completeBtn} onClick={() => setCompleting(true)}>
          ✓ Zamknij
        </button>
        <button className={styles.deleteBtn} onClick={handleDelete}>
          ✕
        </button>
      </div>
    </div>
  )
}
