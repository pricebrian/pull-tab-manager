'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { STAGES } from '@/lib/constants'
import type { Job } from '@/types/database'
import { JobCard } from './job-card'
import { QuickUpdate } from './quick-update'

interface JobFiltersProps {
  jobs: Job[]
}

const FILTER_OPTIONS = ['All', ...STAGES, 'Archived']

export function JobFilters({ jobs }: JobFiltersProps) {
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<string>('All')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return jobs.filter((j) => {
      const matchSearch =
        !q ||
        j.customer.toLowerCase().includes(q) ||
        j.job_number.toLowerCase().includes(q) ||
        j.deals?.some((d) => d.game_name.toLowerCase().includes(q))

      let matchStage: boolean
      if (stageFilter === 'All') {
        matchStage = !j.archived
      } else if (stageFilter === 'Archived') {
        matchStage = j.archived
      } else {
        matchStage = j.stage === stageFilter && !j.archived
      }

      return matchSearch && matchStage
    })
  }, [jobs, search, stageFilter])

  return (
    <>
      {/* Filter bar */}
      <div className="no-print flex items-center gap-3 px-7 py-3.5 bg-ptm-bg2 border-b border-ptm-border flex-wrap">
        <input
          className="bg-ptm-bg3 border border-ptm-border text-ptm-text font-[family-name:var(--font-barlow)] text-sm px-3.5 py-1.5 rounded-lg w-[260px] outline-none transition-colors focus:border-ptm-accent placeholder:text-ptm-text3"
          placeholder="Search jobs, customers, games..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <QuickUpdate />
        <div className="flex gap-1 flex-wrap">
          {FILTER_OPTIONS.map((s) => (
            <button
              key={s}
              className={cn(
                'font-[family-name:var(--font-barlow-condensed)] font-semibold text-xs tracking-wide uppercase px-2.5 py-1 rounded-full border cursor-pointer transition-all',
                stageFilter === s
                  ? s === 'Archived'
                    ? 'text-ptm-text2 bg-ptm-bg4 border-ptm-border2'
                    : 'text-ptm-accent bg-ptm-accent/10 border-ptm-accent/30'
                  : 'text-ptm-text3 bg-transparent border-ptm-border hover:text-ptm-text hover:border-ptm-border2'
              )}
              onClick={() => setStageFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs grid */}
      <main className="grid grid-cols-1 xl:grid-cols-[repeat(auto-fill,minmax(560px,1fr))] gap-4 p-5 px-7">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-20 text-ptm-text3 text-[15px]">
            {jobs.length === 0 ? (
              <>
                <div className="text-4xl text-ptm-accent mb-3 opacity-40">
                  ◈
                </div>
                <div>No jobs yet. Create your first job to get started.</div>
              </>
            ) : stageFilter === 'Archived' ? (
              <div>No archived jobs.</div>
            ) : (
              <div>No jobs match your filter.</div>
            )}
          </div>
        ) : (
          filtered.map((job) => <JobCard key={job.id} job={job} />)
        )}
      </main>
    </>
  )
}
