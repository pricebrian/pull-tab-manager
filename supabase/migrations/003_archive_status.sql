-- Add archived flag to jobs table
-- Archived jobs remain at their last pipeline stage but are hidden from default view
alter table jobs
  add column archived boolean not null default false;

create index idx_jobs_archived on jobs(archived);
