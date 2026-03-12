import type { Stage, DealStatus } from './database'

export type ProposedAction =
  | {
      type: 'move_stage'
      jobId: string
      jobNumber: string
      fromStage: Stage
      toStage: Stage
    }
  | {
      type: 'mark_deal_lost'
      dealId: string
      serial: number
      gameName: string
      jobNumber: string
      lostAt: Extract<DealStatus, 'lost_gluer' | 'lost_die_cut'>
    }
  | {
      type: 'mark_deal_active'
      dealId: string
      serial: number
      gameName: string
      jobNumber: string
    }
  | {
      type: 'archive_job'
      jobId: string
      jobNumber: string
    }
  | {
      type: 'unarchive_job'
      jobId: string
      jobNumber: string
    }

export type InterpretResult =
  | { success: true; actions: ProposedAction[]; summary: string }
  | { success: false; error: string }
