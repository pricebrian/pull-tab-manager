-- Add game_type to deals: 'instant' or 'seal'
alter table deals add column game_type text not null default 'instant'
  check (game_type in ('instant', 'seal'));
