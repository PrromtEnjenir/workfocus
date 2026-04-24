import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CreateTaskDTO, TagModel, TaskModel, TaskType } from '@/shared/types/global.types'
import styles from './TaskForm.module.css'

interface TaskFormProps {
  tags: TagModel[]
  initialData?: Partial<TaskModel>
  onSubmit: (data: CreateTaskDTO) => Promise<void>
  onCancel: () => void
  area: 'work' | 'personal'
}

const defaultForm = (): CreateTaskDTO => ({
  title: '',
  type: 'task',
  area: 'work',
  important: false,
  urgent: false,
  painScore: 5,
})

export function TaskForm({ tags, initialData, onSubmit, onCancel, area }: TaskFormProps) {
  const { t } = useTranslation('tasks')
  const titleRef = useRef<HTMLInputElement>(null)
  const [submitting, setSubmitting] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const [form, setForm] = useState<CreateTaskDTO>(() => ({
    ...defaultForm(),
    area,
    title: initialData?.title ?? '',
    type: initialData?.type ?? 'task',
    important: initialData?.important ?? false,
    urgent: initialData?.urgent ?? false,
    painScore: initialData?.painScore ?? 5,
    tagId: initialData?.tagId ?? undefined,
    estimatedMinutes: initialData?.estimatedMinutes ?? undefined,
    deadline: initialData?.deadline ?? undefined,
    notes: initialData?.notes ?? undefined,
    waitingForPerson: initialData?.waitingForPerson ?? undefined,
    energyRequired: initialData?.energyRequired ?? undefined,
  }))

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  const set = <K extends keyof CreateTaskDTO>(key: K, value: CreateTaskDTO[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSubmitting(true)
    try {
      await onSubmit({ ...form, title: form.title.trim() })
    } finally {
      setSubmitting(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onCancel()
  }

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
      onKeyDown={handleKey}
      aria-label={t('taskForm')}
    >
      {/* Tytuł + typ */}
      <div className={styles.titleRow}>
        <select
          className={styles.typeSelect}
          value={form.type}
          onChange={(e) => set('type', e.target.value as TaskType)}
          aria-label={t('type')}
        >
          <option value="task">✓ {t('typeTask')}</option>
          <option value="email">✉ {t('typeEmail')}</option>
          <option value="waiting_for">⏳ {t('typeWaiting')}</option>
        </select>

        <input
          ref={titleRef}
          className={styles.titleInput}
          placeholder={t('titlePlaceholder')}
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          aria-label={t('title')}
          required
        />
      </div>

      {/* Eisenhower + pain */}
      <div className={styles.priorityRow}>
        <label className={`${styles.toggleBtn} ${form.important ? styles.active : ''}`}>
          <input
            type="checkbox"
            hidden
            checked={form.important ?? false}
            onChange={(e) => set('important', e.target.checked)}
          />
          {t('important')}
        </label>

        <label className={`${styles.toggleBtn} ${form.urgent ? styles.active : ''}`}>
          <input
            type="checkbox"
            hidden
            checked={form.urgent ?? false}
            onChange={(e) => set('urgent', e.target.checked)}
          />
          {t('urgent')}
        </label>

        <div className={styles.painGroup}>
          <span className={styles.painLabel}>{t('pain')}: {form.painScore}</span>
          <input
            type="range"
            min={1}
            max={10}
            value={form.painScore}
            onChange={(e) => set('painScore', Number(e.target.value))}
            className={styles.painSlider}
            aria-label={t('painScore')}
          />
        </div>
      </div>

      {/* Rozwijane dodatkowe pola */}
      <button
        type="button"
        className={styles.expandBtn}
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? '▲' : '▼'} {t('moreOptions')}
      </button>

      {expanded && (
        <div className={styles.expanded}>
          {/* Tag */}
          <label className={styles.field}>
            <span>{t('tag')}</span>
            <select
              value={form.tagId ?? ''}
              onChange={(e) => set('tagId', e.target.value || undefined)}
            >
              <option value="">{t('noTag')}</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </label>

          {/* Szacowany czas */}
          <label className={styles.field}>
            <span>{t('estimatedMinutes')}</span>
            <input
              type="number"
              min={1}
              max={480}
              placeholder="min"
              value={form.estimatedMinutes ?? ''}
              onChange={(e) =>
                set('estimatedMinutes', e.target.value ? Number(e.target.value) : undefined)
              }
            />
          </label>

          {/* Deadline */}
          <label className={styles.field}>
            <span>{t('deadline')}</span>
            <input
              type="date"
              value={form.deadline ?? ''}
              onChange={(e) => set('deadline', e.target.value || undefined)}
            />
          </label>

          {/* Energia */}
          <label className={styles.field}>
            <span>{t('energyRequired')}</span>
            <select
              value={form.energyRequired ?? ''}
              onChange={(e) =>
                set('energyRequired', (e.target.value as CreateTaskDTO['energyRequired']) || undefined)
              }
            >
              <option value="">{t('energyAny')}</option>
              <option value="high">{t('energyHigh')}</option>
              <option value="medium">{t('energyMedium')}</option>
              <option value="low">{t('energyLow')}</option>
            </select>
          </label>

          {/* Oczekuje od (waiting_for) */}
          {form.type === 'waiting_for' && (
            <label className={styles.field}>
              <span>{t('waitingForPerson')}</span>
              <input
                type="text"
                placeholder={t('waitingForPersonPlaceholder')}
                value={form.waitingForPerson ?? ''}
                onChange={(e) => set('waitingForPerson', e.target.value || undefined)}
              />
            </label>
          )}

          {/* Notatki */}
          <label className={styles.field}>
            <span>{t('notes')}</span>
            <textarea
              rows={3}
              placeholder={t('notesPlaceholder')}
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value || undefined)}
            />
          </label>
        </div>
      )}

      {/* Akcje */}
      <div className={styles.actions}>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          {t('cancel')}
        </button>
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={submitting || !form.title.trim()}
        >
          {submitting ? t('saving') : t('save')}
        </button>
      </div>
    </form>
  )
}
