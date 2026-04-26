// src/bridge/api.ts
import type {
  Area,
  AppSettings,
  CompletionMeta,
  CreateDecisionDTO,
  CreateReminderDTO,
  CreateTagDTO,
  CreateTaskDTO,
  DecisionEntry,
  EstimationAccuracy,
  ExportEntity,
  FiredReminderPayload,
  HistoryFilters,
  MarkdownExportType,
  PomodoroSession,
  ReminderModel,
  ReminderWithTask,
  RitualLog,
  RitualLogDTO,
  StreakData,
  TagModel,
  TaskFilters,
  TaskHistoryEntry,
  TaskModel,
  TimePerTag,
  UpdateTaskDTO,
  WeeklyThroughput,
} from '@/shared/types/global.types'

function ipc<T>(channel: string, data?: unknown): Promise<T> {
  return window.electronAPI.invoke(channel, data) as Promise<T>
}

export const api = {
  tasks: {
    getAll: (area: Area, filters?: TaskFilters) =>
      ipc<TaskModel[]>('tasks:getAll', { area, filters }),
    getById: (id: string) =>
      ipc<TaskModel | null>('tasks:getById', { id }),
    create: (data: CreateTaskDTO) =>
      ipc<TaskModel>('tasks:create', data),
    update: (id: string, data: UpdateTaskDTO) =>
      ipc<TaskModel>('tasks:update', { id, data }),
    complete: (id: string, meta: CompletionMeta) =>
      ipc<void>('tasks:complete', { id, meta }),
    softDelete: (id: string) =>
      ipc<void>('tasks:delete', { id }),
    snooze: (id: string, until: string) =>
      ipc<void>('tasks:snooze', { id, until }),
    someday: (id: string) =>
      ipc<void>('tasks:someday', { id }),
    cancel: (id: string) =>
      ipc<void>('tasks:cancel', { id }),
  },

  tags: {
    getAll: (area: Area) =>
      ipc<TagModel[]>('tags:getAll', { area }),
    create: (data: CreateTagDTO) =>
      ipc<TagModel>('tags:create', data),
    update: (id: string, data: Partial<CreateTagDTO>) =>
      ipc<TagModel>('tags:update', { id, data }),
    delete: (id: string) =>
      ipc<void>('tags:delete', { id }),
  },

  reminders: {
    getToday: () =>
      ipc<ReminderWithTask[]>('reminders:getToday'),
    getUpcoming: (days?: number) =>
      ipc<ReminderWithTask[]>('reminders:getUpcoming', { days }),
    getByTask: (taskId: string) =>
      ipc<ReminderModel[]>('reminders:getByTask', { taskId }),
    create: (data: CreateReminderDTO) =>
      ipc<ReminderModel>('reminders:create', data),
    dismiss: (id: string) =>
      ipc<void>('reminders:dismiss', { id }),
    snooze: (id: string, until: string) =>
      ipc<void>('reminders:snooze', { id, until }),
    countFollowups: (area?: Area) =>
      ipc<number>('reminders:countFollowups', { area }),
  },

  pomodoro: {
    start: (taskId: string | null, minutes?: number) =>
      ipc<PomodoroSession>('pomodoro:start', { taskId, minutes }),
    stop: (sessionId: string, completed: boolean, interruptedReason?: string) =>
      ipc<void>('pomodoro:stop', { sessionId, completed, interruptedReason }),
    addParkingLot: (sessionId: string, note: string) =>
      ipc<void>('pomodoro:parkingLot', { sessionId, note }),
    getHistory: (taskId?: string) =>
      ipc<PomodoroSession[]>('pomodoro:history', { taskId }),
    statsToday: () =>
      ipc<{ sessions: { completed: number; total: number }; focusMinutes: number }>('pomodoro:statsToday'),
  },

  stats: {
    getWeeklyThroughput: (weeks: number) =>
      ipc<WeeklyThroughput[]>('stats:weeklyThroughput', { weeks }),
    getEstimationAccuracy: () =>
      ipc<EstimationAccuracy[]>('stats:estimationAccuracy'),
    getTimePerTag: (days: number) =>
      ipc<TimePerTag[]>('stats:timePerTag', { days }),
    getStreak: () =>
      ipc<StreakData>('stats:streak'),
  },

  history: {
    getAll: (area: Area, filters?: HistoryFilters) =>
      ipc<TaskHistoryEntry[]>('history:getAll', { area, filters }),
    getById: (id: string) =>
      ipc<TaskHistoryEntry | null>('history:getById', { id }),
  },

  rituals: {
    getLog: (date: string) =>
      ipc<RitualLog | null>('rituals:getLog', { date }),
    save: (data: RitualLogDTO) =>
      ipc<RitualLog>('rituals:save', data),
  },

  decisions: {
    getAll: (area: Area) =>
      ipc<DecisionEntry[]>('decisions:getAll', { area }),
    create: (data: CreateDecisionDTO) =>
      ipc<DecisionEntry>('decisions:create', data),
    delete: (id: string) =>
      ipc<void>('decisions:delete', { id }),
  },

  settings: {
    get: <K extends keyof AppSettings>(key: K) =>
      ipc<AppSettings[K]>('settings:get', { key }),
    set: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
      ipc<void>('settings:set', { key, value }),
    getAll: () =>
      ipc<AppSettings>('settings:getAll'),
  },

  export: {
    toJSON: (area?: Area) =>
      ipc<string>('export:json', { area }),
    toCSV: (entity: ExportEntity, area?: Area) =>
      ipc<string>('export:csv', { entity, area }),
    toMarkdown: (type: MarkdownExportType) =>
      ipc<string>('export:markdown', { type }),
  },
}

// Push eventy z main process (scheduler → renderer)
export const listen = {
  // Scheduler odpala gdy reminder jest due
  onReminderFired: (cb: (payload: FiredReminderPayload) => void): (() => void) =>
    window.electronAPI.on('reminder:fired', (p) => cb(p as FiredReminderPayload)),

  onQuickCapture: (cb: () => void): (() => void) =>
    window.electronAPI.on('shortcut:quickCapture', cb),
}
