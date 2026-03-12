'use server'

import Anthropic from '@anthropic-ai/sdk'
import { getJobs } from '@/lib/queries'
import {
  updateJobStage,
  updateDealStatuses,
  archiveJob,
  unarchiveJob,
} from './jobs'
import { revalidatePath } from 'next/cache'
import { STAGES } from '@/lib/constants'
import type { Job } from '@/types/database'
import type { Stage, DealStatus } from '@/types/database'
import type { InterpretResult, ProposedAction } from '@/types/quick-update'

// Build compact job context for the LLM + a key→UUID map
function buildJobContext(jobs: Job[]) {
  const idMap: Record<string, string> = {}
  const jobsByKey: Record<string, Job> = {}
  const lines: string[] = ['JOBS:']

  jobs.forEach((job, i) => {
    const jKey = `J${i + 1}`
    idMap[jKey] = job.id
    jobsByKey[jKey] = job

    const dealParts = (job.deals || []).map((d, di) => {
      const dKey = `${jKey}D${di + 1}`
      idMap[dKey] = d.id
      return `${dKey}:#${d.serial} "${d.game_name}" ${d.status}`
    })

    const archiveTag = job.archived ? ' [ARCHIVED]' : ''
    lines.push(
      `${jKey}: ${job.job_number} | "${job.customer}" | Stage: ${job.stage}${archiveTag} | Deals: [${dealParts.join(', ')}]`
    )
  })

  return { contextText: lines.join('\n'), idMap, jobsByKey }
}

const SYSTEM_PROMPT = `You are an assistant for a pull-tab ticket production management system. You interpret natural language updates about jobs and deals and return structured JSON actions.

VALID STAGES (in production order): ${STAGES.join(' → ')}

VALID ACTIONS:
1. move_stage — Change a job's production stage.
2. mark_deal_lost — Mark a deal as lost. lostAt must be "lost_gluer" or "lost_die_cut".
3. mark_deal_active — Reactivate a previously lost deal.
4. archive_job — Archive a completed job.
5. unarchive_job — Unarchive a job.

RULES:
- Users may refer to jobs by number (e.g. "Job 4" matches JOB-2026-0004), customer name, or full job number. Match flexibly.
- Users may refer to deals by serial number (e.g. "deal 1409130" or just "1409130").
- "Move to gluing" means set stage to "Gluing".
- "Lost at the die cut" or "lost at die cut" means mark_deal_lost with lostAt "lost_die_cut".
- "Lost at the gluer" or "lost at gluer" means mark_deal_lost with lostAt "lost_gluer".
- If you cannot confidently match a reference to a job or deal, return success:false with an error explaining what was unclear.
- Return ONLY valid JSON. No markdown fences. No explanation outside the JSON.

RESPONSE FORMAT (use short keys like J1, J1D3 from the context):
{
  "success": true,
  "actions": [
    { "type": "move_stage", "key": "J1", "fromStage": "Printing", "toStage": "Gluing" },
    { "type": "mark_deal_lost", "key": "J1D3", "lostAt": "lost_die_cut" }
  ],
  "summary": "Human-readable summary of all actions"
}

Or if unclear:
{ "success": false, "error": "Could not find a job matching 'Job 99'" }`

export async function interpretUpdate(
  text: string
): Promise<InterpretResult> {
  if (!text.trim()) {
    return { success: false, error: 'Please enter an update.' }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { success: false, error: 'AI service not configured.' }
  }

  const jobs = await getJobs()
  const { contextText, idMap, jobsByKey } = buildJobContext(jobs)

  const client = new Anthropic({ apiKey })

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `${contextText}\n\nUPDATE: ${text}`,
        },
      ],
    })

    const rawText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')

    // Strip markdown fences and any surrounding whitespace
    const responseText = rawText
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim()

    console.log('Quick Update raw response:', rawText.substring(0, 200))

    const parsed = JSON.parse(responseText)

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error || 'Could not interpret the update.',
      }
    }

    // Resolve short keys to real UUIDs + display data
    const resolvedActions: ProposedAction[] = []

    for (const action of parsed.actions) {
      const key = action.key as string

      if (action.type === 'move_stage') {
        const job = jobsByKey[key]
        if (!job)
          return {
            success: false,
            error: `Could not resolve reference "${key}". Try rephrasing.`,
          }
        resolvedActions.push({
          type: 'move_stage',
          jobId: job.id,
          jobNumber: job.job_number,
          fromStage: action.fromStage as Stage,
          toStage: action.toStage as Stage,
        })
      } else if (
        action.type === 'mark_deal_lost' ||
        action.type === 'mark_deal_active'
      ) {
        const dealId = idMap[key]
        if (!dealId)
          return {
            success: false,
            error: `Could not resolve deal "${key}". Try rephrasing.`,
          }
        const deal = jobs
          .flatMap((j) => j.deals || [])
          .find((d) => d.id === dealId)
        if (!deal)
          return { success: false, error: `Deal not found for "${key}".` }
        const parentJob = jobs.find((j) =>
          (j.deals || []).some((d) => d.id === dealId)
        )

        if (action.type === 'mark_deal_lost') {
          resolvedActions.push({
            type: 'mark_deal_lost',
            dealId,
            serial: deal.serial,
            gameName: deal.game_name,
            jobNumber: parentJob?.job_number || '',
            lostAt: action.lostAt as 'lost_gluer' | 'lost_die_cut',
          })
        } else {
          resolvedActions.push({
            type: 'mark_deal_active',
            dealId,
            serial: deal.serial,
            gameName: deal.game_name,
            jobNumber: parentJob?.job_number || '',
          })
        }
      } else if (
        action.type === 'archive_job' ||
        action.type === 'unarchive_job'
      ) {
        const job = jobsByKey[key]
        if (!job)
          return {
            success: false,
            error: `Could not resolve reference "${key}". Try rephrasing.`,
          }
        resolvedActions.push({
          type: action.type,
          jobId: job.id,
          jobNumber: job.job_number,
        })
      }
    }

    return {
      success: true,
      actions: resolvedActions,
      summary: parsed.summary,
    }
  } catch (err) {
    console.error('Quick Update AI error:', err)
    const message =
      err instanceof Error ? err.message : 'Unknown error'
    return {
      success: false,
      error: `AI error: ${message}`,
    }
  }
}

export async function executeActions(
  actions: ProposedAction[]
): Promise<{ error?: string }> {
  const dealUpdates: { id: string; status: DealStatus }[] = []

  for (const action of actions) {
    switch (action.type) {
      case 'move_stage': {
        const result = await updateJobStage(action.jobId, action.toStage)
        if (result?.error) return { error: result.error }
        break
      }
      case 'mark_deal_lost': {
        dealUpdates.push({ id: action.dealId, status: action.lostAt })
        break
      }
      case 'mark_deal_active': {
        dealUpdates.push({ id: action.dealId, status: 'active' })
        break
      }
      case 'archive_job': {
        const result = await archiveJob(action.jobId)
        if (result?.error) return { error: result.error }
        break
      }
      case 'unarchive_job': {
        const result = await unarchiveJob(action.jobId)
        if (result?.error) return { error: result.error }
        break
      }
    }
  }

  if (dealUpdates.length > 0) {
    const result = await updateDealStatuses(dealUpdates)
    if (result?.error) return { error: result.error }
  }

  revalidatePath('/')
  return {}
}
