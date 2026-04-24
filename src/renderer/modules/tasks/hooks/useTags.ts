import { useCallback, useEffect } from 'react'
import { useShallow } from 'zustand/shallow'
import { api } from '@/bridge/api'
import { useSharedStore } from '@/store/shared.slice'
import { useTasksStore } from '@/store/tasks.slice'
import type { CreateTagDTO } from '@/shared/types/global.types'

export function useTags() {
  const activeArea = useSharedStore((s) => s.activeArea)
  const { tags, setTags } = useTasksStore(
    useShallow((s) => ({ tags: s.tags, setTags: s.setTags }))
  )

  useEffect(() => {
    api.tags.getAll(activeArea).then(setTags).catch(console.error)
  }, [activeArea])

  const createTag = useCallback(async (data: CreateTagDTO) => {
    const tag = await api.tags.create(data)
    setTags([...useTasksStore.getState().tags, tag])
    return tag
  }, [setTags])

  const deleteTag = useCallback(async (id: string) => {
    await api.tags.delete(id)
    setTags(useTasksStore.getState().tags.filter((t) => t.id !== id))
  }, [setTags])

  return { tags, createTag, deleteTag }
}
