import { useCallback, useEffect } from 'react'
import { useShallow } from 'zustand/shallow'
import { api, listen } from '@/bridge/api'
import { useSharedStore } from '@/store/shared.slice'
import { useTasksStore } from '@/store/tasks.slice'
import type { CompletionMeta, CreateTaskDTO, TaskFilters, UpdateTaskDTO } from '@/shared/types/global.types'

const UNDO_DELAY_MS = 30_000

export function useTasks(filters?: TaskFilters) {
  const activeArea = useSharedStore((s) => s.activeArea)

  const { items, loading, setItems, setLoading, removeItem, restoreItem, addUndoEntry, clearUndoEntry, upsertItem } =
    useTasksStore(
      useShallow((s) => ({
        items: s.items,
        loading: s.loading,
        setItems: s.setItems,
        setLoading: s.setLoading,
        removeItem: s.removeItem,
        restoreItem: s.restoreItem,
        addUndoEntry: s.addUndoEntry,
        clearUndoEntry: s.clearUndoEntry,
        upsertItem: s.upsertItem,
      }))
    )

  const fetchTasks = useCallback(() => {
    setLoading(true)
    api.tasks
      .getAll(activeArea, filters)
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [activeArea, filters?.status, filters?.tagId, filters?.type, filters?.search])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const createTask = useCallback(async (data: CreateTaskDTO): Promise<void> => {
    await api.tasks.create(data)
    // Fetch zamiast upsert — nowy task musi trafić na właściwe miejsce
    // w posortowanej liście (repo sortuje po important+urgent+pain_score)
    fetchTasks()
  }, [fetchTasks])

  const updateTask = useCallback(async (id: string, data: UpdateTaskDTO): Promise<void> => {
    const task = await api.tasks.update(id, data)
    upsertItem(task)
  }, [upsertItem])

  const completeTask = useCallback(async (id: string, meta: CompletionMeta): Promise<void> => {
    const task = useTasksStore.getState().items.find((t) => t.id === id)
    if (!task) return
    removeItem(id)
    await api.tasks.complete(id, meta)
  }, [removeItem])

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    const task = useTasksStore.getState().items.find((t) => t.id === id)
    if (!task) return

    removeItem(id)

    const timeoutId = setTimeout(async () => {
      await api.tasks.softDelete(id)
      clearUndoEntry(id)
    }, UNDO_DELAY_MS)

    addUndoEntry(task, timeoutId)
  }, [removeItem, addUndoEntry, clearUndoEntry])

  const undoDelete = useCallback((id: string): void => {
    const entry = useTasksStore.getState().undoQueue.find((e) => e.task.id === id)
    if (!entry) return
    clearTimeout(entry.timeoutId)
    restoreItem(id)
  }, [restoreItem])

  const setSomeday = useCallback(async (id: string): Promise<void> => {
    removeItem(id)
    await api.tasks.someday(id)
  }, [removeItem])

  useEffect(() => {
    const unsub = listen.onTasksRefresh(() => void fetchTasks())
    return unsub
  }, [])

  return {
    tasks: items,
    loading,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
    undoDelete,
    setSomeday,
    refresh: fetchTasks,
  }
}
