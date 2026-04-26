// src/renderer/modules/triage/hooks/useTriageTasks.ts
import { useCallback, useEffect, useState } from 'react'
import { api } from '@/bridge/api'
import { useSharedStore } from '@/store/shared.slice'
import type { TaskModel, UpdateTaskDTO } from '@/shared/types/global.types'
import type { TriageTask } from '../types/triage.types'

function calcScore(task: TaskModel): number {
  const imp = task.important ? 40 : 0
  const urg = task.urgent ? 30 : 0
  // pain 1-10 → 3-30
  const pain = task.painScore * 3
  return imp + urg + pain
}

function toTriageTask(task: TaskModel): TriageTask {
  return { ...task, score: calcScore(task) }
}

export function useTriageTasks() {
  const activeArea = useSharedStore((s) => s.activeArea)
  const [tasks, setTasks] = useState<TriageTask[]>([])
  const [loading, setLoading] = useState(false)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.tasks.getAll(activeArea, { status: 'active' })
      const scored = data
        .map(toTriageTask)
        .sort((a, b) => b.score - a.score)
      setTasks(scored)
    } catch (err) {
      console.error('[useTriageTasks] fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [activeArea])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const updatePriority = useCallback(async (
    id: string,
    data: Pick<UpdateTaskDTO, 'important' | 'urgent' | 'painScore'>
  ): Promise<void> => {
    // Optymistyczna aktualizacja
    setTasks((prev) =>
      prev
        .map((t) => {
          if (t.id !== id) return t
          const updated: TaskModel = {
            ...t,
            important: data.important ?? t.important,
            urgent: data.urgent ?? t.urgent,
            painScore: data.painScore ?? t.painScore,
            updatedAt: new Date().toISOString(),
          }
          return toTriageTask(updated)
        })
        .sort((a, b) => b.score - a.score)
    )

    await api.tasks.update(id, data)
  }, [])

  return { tasks, loading, refresh: fetchTasks, updatePriority }
}
