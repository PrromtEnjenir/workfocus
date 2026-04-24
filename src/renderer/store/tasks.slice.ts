import { create } from 'zustand'
import type { TagModel, TaskModel } from '@/shared/types/global.types'
import { getActiveTaskId } from './shared.slice'

interface TasksState {
  items: TaskModel[]
  tags: TagModel[]
  loading: boolean
  undoQueue: { task: TaskModel; timeoutId: ReturnType<typeof setTimeout> }[]

  setItems: (items: TaskModel[]) => void
  setTags: (tags: TagModel[]) => void
  setLoading: (loading: boolean) => void

  // Optymistyczne usunięcie z undo
  removeItem: (id: string) => void
  restoreItem: (id: string) => void
  addUndoEntry: (task: TaskModel, timeoutId: ReturnType<typeof setTimeout>) => void
  clearUndoEntry: (id: string) => void

  // Inline update po edycji bez re-fetcha
  upsertItem: (task: TaskModel) => void
}

export const useTasksStore = create<TasksState>((set, get) => ({
  items: [],
  tags: [],
  loading: false,
  undoQueue: [],

  setItems: (items) => set({ items }),
  setTags: (tags) => set({ tags }),
  setLoading: (loading) => set({ loading }),

  removeItem: (id) =>
    set((s) => ({ items: s.items.filter((t) => t.id !== id) })),

  restoreItem: (id) => {
    // Przywracamy task z undoQueue do items
    // Sam task trzymamy w undoQueue żeby móc przywrócić
    const entry = get().undoQueue.find((e) => e.task.id === id)
    if (!entry) return
    set((s) => ({
      items: [entry.task, ...s.items],
      undoQueue: s.undoQueue.filter((e) => e.task.id !== id),
    }))
  },

  addUndoEntry: (task, timeoutId) =>
    set((s) => ({ undoQueue: [...s.undoQueue, { task, timeoutId }] })),

  clearUndoEntry: (id) =>
    set((s) => ({
      undoQueue: s.undoQueue.filter((e) => e.task.id !== id),
    })),

  upsertItem: (task) =>
    set((s) => {
      const exists = s.items.some((t) => t.id === task.id)
      if (exists) {
        return { items: s.items.map((t) => (t.id === task.id ? task : t)) }
      }
      return { items: [task, ...s.items] }
    }),
}))

// Selektory eksportowane dla innych modułów (nie importuj całego store)
export const selectActiveTask = (): TaskModel | null => {
  const { items } = useTasksStore.getState()
  const activeId = getActiveTaskId()
  return items.find((t) => t.id === activeId) ?? null
}

export const selectTaskById = (id: string): TaskModel | null => {
  return useTasksStore.getState().items.find((t) => t.id === id) ?? null
}
