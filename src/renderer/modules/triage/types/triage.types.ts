// src/renderer/modules/triage/types/triage.types.ts
import type { TaskModel } from '@/shared/types/global.types'

export interface TriageTask extends TaskModel {
  /** Wyliczony score do sortowania: important(40) + urgent(30) + pain(1-10 skalowany do 30) */
  score: number
}

export type TriageMode = 'matrix' | 'pairs'
