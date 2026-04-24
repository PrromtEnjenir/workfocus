export type Area = 'work' | 'personal'

export type TaskType = 'task' | 'email' | 'waiting_for'

export type TaskStatus = 'active' | 'completed' | 'someday' | 'cancelled'

export type EnergyLevel = 'high' | 'medium' | 'low'

export type FrictionReason =
  | 'waiting'
  | 'missing_info'
  | 'technical'
  | 'reprioritized'
  | 'none'

export type RitualType = 'daily_plan' | 'daily_shutdown' | 'weekly_review'

export type ExportEntity = 'tasks' | 'history' | 'pomodoro' | 'decisions'

export type MarkdownExportType = 'weekly_report' | 'decisions'

export type Theme = 'light' | 'dark' | 'system'

// ---- Task ----

export interface TaskModel {
  id: string
  title: string
  type: TaskType
  status: TaskStatus
  area: Area
  tagId: string | null
  important: boolean
  urgent: boolean
  painScore: number
  energyRequired: EnergyLevel | null
  estimatedMinutes: number | null
  actualMinutes: number | null
  deadline: string | null
  waitingForPerson: string | null
  notes: string | null
  parentTaskId: string | null
  dependsOnTaskId: string | null
  createdAt: string
  completedAt: string | null
  updatedAt: string
  deletedAt: string | null
}

export interface CreateTaskDTO {
  title: string
  type: TaskType
  area: Area
  tagId?: string
  important?: boolean
  urgent?: boolean
  painScore?: number
  energyRequired?: EnergyLevel
  estimatedMinutes?: number
  deadline?: string
  waitingForPerson?: string
  notes?: string
  dependsOnTaskId?: string
  parentTaskId?: string
}

export type UpdateTaskDTO = Partial<CreateTaskDTO>

export interface CompletionMeta {
  actualMinutes?: number
  postMortem?: string
  frictionReason?: FrictionReason
  priorityAccurate?: boolean
}

export interface TaskFilters {
  status?: TaskStatus
  tagId?: string
  type?: TaskType
  search?: string
  deadlineBefore?: string
}

// ---- Tag ----

export interface TagModel {
  id: string
  name: string
  color: string
  area: Area
  createdAt: string
  deletedAt: string | null
}

export interface CreateTagDTO {
  name: string
  color: string
  area: Area
}

// ---- Reminder ----

export type ReminderType = 'once' | 'followup' | 'recurring'

export interface ReminderModel {
  id: string
  taskId: string
  remindAt: string
  type: ReminderType
  recurrenceDays: number | null
  followupAfterDays: number | null
  dismissedAt: string | null
  firedAt: string | null
  createdAt: string
}

export interface CreateReminderDTO {
  taskId: string
  remindAt: string
  type: ReminderType
  recurrenceDays?: number
  followupAfterDays?: number
}

// ---- Pomodoro ----

export interface PomodoroSession {
  id: string
  taskId: string | null
  startedAt: string
  endedAt: string | null
  plannedMinutes: number
  completed: boolean
  interruptedReason: string | null
  parkingLot: string[]
  createdAt: string
}

// ---- History ----

export interface TaskHistoryEntry {
  id: string
  taskId: string
  title: string
  tagId: string | null
  area: Area
  estimatedMinutes: number | null
  actualMinutes: number | null
  postMortem: string | null
  frictionReason: FrictionReason | null
  priorityAccurate: boolean | null
  completedAt: string
}

export interface HistoryFilters {
  tagId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}

// ---- Ritual ----

export interface RitualLogDTO {
  type: RitualType
  date: string
  energyLevel?: EnergyLevel
  notes?: string
  wins?: string[]
}

export interface RitualLog extends RitualLogDTO {
  id: string
  completedAt: string
}

// ---- Decision ----

export interface DecisionEntry {
  id: string
  content: string
  context: string | null
  tagId: string | null
  area: Area
  createdAt: string
  deletedAt: string | null
}

export interface CreateDecisionDTO {
  content: string
  context?: string
  tagId?: string
  area: Area
}

// ---- Settings ----

export interface AppSettings {
  theme: Theme
  language: 'pl' | 'en'
  pomodoroMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  longBreakAfter: number
  dailyPlanningTime: string
  dailyShutdownTime: string
  weeklyReviewDay: string
  backupEnabled: boolean
  backupPath: string
  backupIntervalDays: number
  notificationsEnabled: boolean
  followupDefaultDays: number
  defaultArea: Area
}

// ---- Stats ----

export interface WeeklyThroughput {
  week: string
  count: number
}

export interface EstimationAccuracy {
  tagName: string | null
  avgEstimated: number
  avgActual: number
  ratio: number
}

export interface TimePerTag {
  tagName: string | null
  totalMinutes: number
}

export interface StreakData {
  current: number
  longest: number
}

// ---- Window API (preload) ----

declare global {
  interface Window {
    electronAPI: {
      invoke: (channel: string, data?: unknown) => Promise<unknown>
      on: (channel: string, callback: (...args: unknown[]) => void) => () => void
    }
  }
}
