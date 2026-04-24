import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useShallow } from 'zustand/shallow'
import { useSharedStore } from '@/store/shared.slice'
import { useTasksStore } from '@/store/tasks.slice'
import type { CreateTaskDTO, TaskType } from '@/shared/types/global.types'
import { useTags } from '../hooks/useTags'
import { useTasks } from '../hooks/useTasks'
import { TaskForm } from './TaskForm'
import { TaskItem } from './TaskItem'
import { UndoBar } from './UndoBar'
import styles from './TaskList.module.css'

export function TaskList() {
  const { t } = useTranslation('tasks')
  const [showForm, setShowForm] = useState(false)
  const [filterType, setFilterType] = useState<TaskType | ''>('')

  const activeArea = useSharedStore((s) => s.activeArea)
  const { activeTaskId, setActiveTaskId } = useSharedStore(
    useShallow((s) => ({
      activeTaskId: s.activeTaskId,
      setActiveTaskId: s.setActiveTaskId,
    }))
  )

  const { tasks, loading, createTask, completeTask, deleteTask, undoDelete } = useTasks(
    filterType ? { type: filterType } : undefined
  )
  const { tags } = useTags()

  const undoQueue = useTasksStore((s) => s.undoQueue)

  const handleCreate = async (data: CreateTaskDTO) => {
    await createTask(data)
    setShowForm(false)
  }

  const handleComplete = async (id: string) => {
    // Prosta wersja bez post-mortem — post-mortem w TaskDetail
    await completeTask(id, {})
  }

  const typeFilters: Array<{ value: TaskType | ''; label: string }> = [
    { value: '', label: t('allTypes') },
    { value: 'task', label: t('typeTask') },
    { value: 'email', label: t('typeEmail') },
    { value: 'waiting_for', label: t('typeWaiting') },
  ]

  return (
    <div className={styles.container}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          {typeFilters.map((f) => (
            <button
              key={f.value}
              className={`${styles.filterBtn} ${filterType === f.value ? styles.active : ''}`}
              onClick={() => setFilterType(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          className={styles.addBtn}
          onClick={() => setShowForm((v) => !v)}
          aria-label={t('addTask')}
          title="Ctrl+N"
        >
          + {t('addTask')}
        </button>
      </div>

      {/* Formularz tworzenia */}
      {showForm && (
        <TaskForm
          tags={tags}
          area={activeArea}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Undo bar */}
      {undoQueue.length > 0 && (
        <div className={styles.undoBars}>
          {undoQueue.map((entry) => (
            <UndoBar
              key={entry.task.id}
              taskTitle={entry.task.title}
              onUndo={() => undoDelete(entry.task.id)}
            />
          ))}
        </div>
      )}

      {/* Lista zadań */}
      <div className={styles.listWrapper}>
        {loading ? (
          <p className={styles.empty}>{t('loading')}</p>
        ) : tasks.length === 0 ? (
          <p className={styles.empty}>{t('noTasks')}</p>
        ) : (
          <ul className={styles.list} role="listbox" aria-label={t('taskList')}>
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                tags={tags}
                selected={task.id === activeTaskId}
                onComplete={handleComplete}
                onDelete={deleteTask}
                onSelect={setActiveTaskId}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
