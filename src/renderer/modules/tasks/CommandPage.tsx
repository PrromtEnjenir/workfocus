import { useState } from 'react'
import { useShallow } from 'zustand/shallow'
import { useTasksStore } from '@/store/tasks.slice'
import { useSharedStore } from '@/store/shared.slice'
import { useTags } from './hooks/useTags'
import { useTasks } from './hooks/useTasks'
import { TaskDetail } from './components/TaskDetail'
import { TaskForm } from './components/TaskForm'
import { TaskItem } from './components/TaskItem'
import { UndoBar } from './components/UndoBar'
import { FocusTimer } from './components/FocusTimer'
import { IntelFeed } from './components/IntelFeed'
import { StatCards } from './components/StatCards'
import type { CompletionMeta, CreateTaskDTO, TaskType } from '@/shared/types/global.types'
import styles from './CommandPage.module.css'
import taskListStyles from './components/TaskList.module.css'

const TYPE_FILTERS: Array<{ value: TaskType | ''; label: string }> = [
  { value: '', label: 'ALL' },
  { value: 'task', label: 'ACTIVE' },
  { value: 'email', label: 'EMAIL' },
  { value: 'waiting_for', label: 'QUEUED' },
]

export default function CommandPage() {
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

  const handleComplete = async (id: string, meta: CompletionMeta) => {
    await completeTask(id, meta)
  }

  const handleDelete = async (id: string) => {
    await deleteTask(id)
  }

  // Aktywny task (dla Active Mission panel)
  const activeTask = tasks[0] ?? null

  return (
    <div className={styles.layout}>
      {/* ---- LEWA KOLUMNA — timer + active mission + stat karty ---- */}
      <aside className={styles.leftPanel}>
        <FocusTimer activeTask={activeTask} />
        <StatCards />
      </aside>

      {/* ---- ŚRODEK — lista misji ---- */}
      <section className={styles.missionControl}>
        {/* Header sekcji */}
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>MISSION CONTROL</span>

          <div className={taskListStyles.filters}>
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.value}
                className={`${taskListStyles.filterBtn} ${filterType === f.value ? taskListStyles.active : ''}`}
                onClick={() => setFilterType(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            className={styles.addBtn}
            onClick={() => setShowForm((v) => !v)}
          >
            + ADD
          </button>
        </div>

        {/* Formularz */}
        {showForm && (
          <TaskForm
            tags={tags}
            area={activeArea}
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Undo */}
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
        <div className={styles.missionList}>
          {loading ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>◎</span>
              <span>LOADING…</span>
            </div>
          ) : tasks.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>◎</span>
              <span>NO ACTIVE MISSIONS</span>
            </div>
          ) : (
            <ul className={styles.list}>
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  tags={tags}
                  selected={task.id === activeTaskId}
                  onComplete={(id) => completeTask(id, {})}
                  onDelete={deleteTask}
                  onSelect={setActiveTaskId}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Detail panel (selected task) */}
        {activeTaskId && (
          <TaskDetail
            onComplete={handleComplete}
            onDelete={handleDelete}
          />
        )}
      </section>

      {/* ---- PRAWA KOLUMNA — Intel Feed ---- */}
      <aside className={styles.rightPanel}>
        <IntelFeed />
      </aside>
    </div>
  )
}
