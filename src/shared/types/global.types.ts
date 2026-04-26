// src/shared/types/global.types.ts

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

export type ReminderType = 'once' | 'followup' | 'recurring'

// ---- TASK ----

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
}

export interface UpdateTaskDTO extends Partial<CreateTaskDTO> {}

export interface CompletionMeta {
  actualMinutes?: number
  postMortem?: string
  frictionReason?: FrictionReason
  priorityAccurate?: boolean
}

export interface TaskFilters {
  type?: TaskType
  tagId?: string
  important?: boolean
  urgent?: boolean
  status?: TaskStatus
}

// ---- TAG ----

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

// ---- REMINDER ----

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

export interface ReminderWithTask extends ReminderModel {
  taskTitle: string
  taskArea: string
}

export interface CreateReminderDTO {
  taskId: string
  remindAt: string
  type: ReminderType
  recurrenceDays?: number
  followupAfterDays?: number
}

// Payload wysyłany z main process przez scheduler
export interface FiredReminderPayload {
  id: string
  taskId: string
  taskTitle: string
  taskArea: string
  type: ReminderType
  remindAt: string
}

// ---- POMODORO ----

export interface PomodoroSession {
  id: string
  taskId: string | null
  startedAt: string
  endedAt: string | null
  plannedMinutes: number
  completed: boolean
  interruptedReason: string | null
  parkingLot: string[] // JSON array w DB, parsowany w repo
  createdAt: string
}

// ---- HISTORY ----

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
  area?: Area
  from?: string
  to?: string
}

// ---- RITUALS ----

export interface RitualLog {
  id: string
  type: RitualType
  date: string
  energyLevel: EnergyLevel | null
  notes: string | null
  wins: string[] // JSON array w DB
  completedAt: string
}

export interface RitualLogDTO {
  type: RitualType
  date: string
  energyLevel?: EnergyLevel
  notes?: string
  wins?: string[]
}

// ---- DECISIONS ----

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
  area: Area
  context?: string
  tagId?: string
}

// ---- STATS ----

export interface WeeklyThroughput {
  week: string // ISO date — poniedzialek tygodnia
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
  currentStreak: number
  longestStreak: number
  lastCompletedAt: string | null
}

// ---- SETTINGS ----

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
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
