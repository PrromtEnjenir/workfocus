import { useCallback } from 'react'
import { useTasksStore } from '@/store/tasks.slice'
import type { CompletionMeta } from '@/shared/types/global.types'
import { useTasks } from './hooks/useTasks'
import { TaskDetail } from './components/TaskDetail'
import { TaskList } from './components/TaskList'
import styles from './Tasks.module.css'

export default function TasksPage() {
  const { completeTask, deleteTask } = useTasks()
  const upsertItem = useTasksStore((s) => s.upsertItem)

  const handleComplete = useCallback(
    async (id: string, meta: CompletionMeta) => {
      await completeTask(id, meta)
    },
    [completeTask]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteTask(id)
    },
    [deleteTask]
  )

  return (
    <div className={styles.layout}>
      <div className={styles.list}>
        <TaskList />
      </div>
      <div className={styles.detail}>
        <TaskDetail onComplete={handleComplete} onDelete={handleDelete} />
      </div>
    </div>
  )
}
