import { AppShell } from '@/components/layout/app-shell'
import { StatsBar } from '@/components/jobs/stats-bar'
import { JobFilters } from '@/components/jobs/job-filters'
import { getJobs, getJobStats } from '@/lib/queries'

export default async function HomePage() {
  const [jobs, stats] = await Promise.all([getJobs(), getJobStats()])

  return (
    <AppShell>
      <StatsBar
        total={stats.total}
        active={stats.active}
        shipped={stats.shipped}
        archived={stats.archived}
        totalDeals={stats.totalDeals}
      />
      <JobFilters jobs={jobs} />
    </AppShell>
  )
}
