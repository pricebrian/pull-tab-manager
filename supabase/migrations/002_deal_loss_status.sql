-- Replace sheet damage counts with per-deal loss status
-- Each deal (serial) can now be individually flagged as lost at a specific stage

-- Add status column: 'active', 'lost_gluer', or 'lost_die_cut'
alter table deals
  add column status text not null default 'active'
  check (status in ('active', 'lost_gluer', 'lost_die_cut'));

-- Drop the old damage count columns
alter table deals drop column sheets_in;
alter table deals drop column glue_damage;
alter table deals drop column cut_damage;
