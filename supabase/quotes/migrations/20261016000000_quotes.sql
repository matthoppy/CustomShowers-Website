-- Quote → confirm → extras → pay → supplier order.
--
-- Nothing here is readable from the browser. Customers and the admin reach a
-- quote through edge functions that check a long random token from their
-- email link, so there are no logins and no RLS policies to get wrong.

create extension if not exists pgcrypto;

create type quote_status as enum (
  'submitted',         -- design in, waiting for a price
  'priced',            -- price emailed to the customer
  'change_requested',  -- customer says something is wrong
  'sizes_confirmed',   -- customer confirmed sizes, choosing extras / paying
  'paid',              -- paid; supplier order emailed to admin
  'ordered',           -- admin has placed the glass order
  'cancelled'
);

create table quotes (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique
    default ('CS-' || to_char(now() at time zone 'Europe/London', 'YYMMDD') || '-' ||
             upper(substr(encode(gen_random_bytes(3), 'hex'), 1, 4))),
  status quote_status not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- {name, email, phone, postcode, notes}
  customer jsonb not null,
  -- {state, spec, summary} from the designer
  design jsonb not null,
  -- The customer's raw site readings, as text for the workshop.
  site_record text,
  -- [{path, label, kind}] in the quote-files bucket
  files jsonb not null default '[]'::jsonb,

  -- Prices are pence. {lines:[{description, qty, unit_pence, total_pence, category}], ...}
  suggested_price jsonb,
  price jsonb,
  price_note text,
  price_sent_at timestamptz,

  change_request text,
  sizes_confirmed_at timestamptz,

  -- [{id, name, qty, unit_pence, total_pence}], priced server-side from extras_catalog
  extras jsonb not null default '[]'::jsonb,

  stripe_session_id text,
  amount_paid_pence integer,
  paid_at timestamptz,
  -- Delivery details captured by Stripe Checkout.
  delivery jsonb,
  ordered_at timestamptz,

  customer_token text not null default encode(gen_random_bytes(24), 'hex'),
  admin_token text not null default encode(gen_random_bytes(24), 'hex')
);

create index quotes_status_idx on quotes (status, created_at desc);
create index quotes_email_idx on quotes ((lower(customer->>'email')), created_at desc);

create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger quotes_touch before update on quotes
  for each row execute function touch_updated_at();

alter table quotes enable row level security;

-- What a customer can add at the confirmation step. Prices are shelf prices
-- in pence, VAT included. Edit prices and rows in the Supabase table editor;
-- inactive rows are hidden.
create table extras_catalog (
  id text primary key,
  name text not null,
  description text not null default '',
  price_pence integer not null check (price_pence >= 0),
  max_qty integer not null default 5,
  sort integer not null default 0,
  active boolean not null default true
);

alter table extras_catalog enable row level security;

insert into extras_catalog (id, name, description, price_pence, max_qty, sort) values
  ('silicone-clear',  'Clear sanitary silicone',  '310ml cartridge, anti-mould. Most showers need 1–2.', 899, 6, 10),
  ('silicone-gun',    'Silicone gun',             'Heavy-duty skeleton gun.',                              699, 2, 20),
  ('silicone-tool',   'Silicone finishing tool',  'For a neat, even bead.',                                399, 2, 30),
  ('suction-lifter',  'Glass suction lifter',     'Makes handling 10mm glass safer. Two recommended.',     1999, 4, 40),
  ('drill-bits',      'Tile & masonry drill bits','6mm and 8mm diamond-tipped bits for tiles.',            1499, 2, 50),
  ('fixings-kit',     'Wall fixings kit',         'Plugs and stainless screws for channel or clamps.',     999, 3, 60),
  ('glass-cleaner',   'Glass protection & cleaner','Keeps easy-clean glass clear for longer.',             1299, 3, 70);

-- Drawings, site photos and the readings file, private to the functions.
insert into storage.buckets (id, name, public)
values ('quote-files', 'quote-files', false)
on conflict (id) do nothing;
