-- Readable views over the JSON state document.
--
-- The app stores everything as one jsonb document in building_state, which is
-- awkward to read in the Table Editor. These views unpack it into normal
-- browsable tables so you can sort/filter in the Supabase dashboard.
--
-- Deliberately RAW data only: no balances or totals. Those depend on the app's
-- expense-share / services / coefficient logic, and duplicating it here would
-- eventually disagree with the app. The app remains the source of truth for
-- computed figures.
--
-- Run in: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run (create or replace).

-- Tenants -------------------------------------------------------------------
create or replace view public.v_tenants as
select
  t->>'id'                                as tenant_id,
  t->>'name'                              as name,
  t->>'unit'                              as unit,
  nullif(t->>'coefficient', '')::numeric  as coefficient,
  nullif(t->>'breakerAmps', '')::numeric  as breaker_amps,
  nullif(t->>'phone', '')                 as phone,
  coalesce((t->>'active')::boolean, true) as active,
  (t->>'pinHash') <> ''                   as has_pin
from public.building_state,
     jsonb_array_elements(coalesce(state->'tenants', '[]'::jsonb)) as t
where id = 'building';

-- Transactions --------------------------------------------------------------
-- forMonth is trimmed to YYYY-MM; dates stay text (ISO sorts correctly and a
-- cast would fail on any legacy blank/odd value).
create or replace view public.v_transactions as
select
  tx->>'id'                                          as tx_id,
  tx->>'date'                                        as tx_date,
  left(tx->>'forMonth', 7)                           as for_month,
  tx->>'category'                                    as category,
  tx->>'serviceType'                                 as service_type,
  tx->>'servicePart'                                 as service_part,
  tx->>'description'                                 as description,
  tx->>'expenseCategory'                             as expense_category,
  tx->>'supplier'                                    as supplier,
  tx->>'invoice'                                     as invoice,
  tx->>'project'                                     as project,
  (select tt->>'name'
     from jsonb_array_elements(coalesce(bs.state->'tenants', '[]'::jsonb)) tt
    where tt->>'id' = tx->>'tenantId')               as tenant,
  coalesce(nullif(tx->>'creditUsd', '')::numeric, 0) as credit_usd,
  coalesce(nullif(tx->>'debitUsd',  '')::numeric, 0) as debit_usd,
  coalesce(nullif(tx->>'creditLbp', '')::numeric, 0) as credit_lbp,
  coalesce(nullif(tx->>'debitLbp',  '')::numeric, 0) as debit_lbp,
  coalesce(tx->'invoiceAttachment'->>'url',
           tx->'invoiceAttachment'->>'driveUrl')     as invoice_photo_url
from public.building_state bs,
     jsonb_array_elements(coalesce(bs.state->'transactions', '[]'::jsonb)) tx
where bs.id = 'building';

-- Monthly budget ------------------------------------------------------------
create or replace view public.v_monthly_expected as
select
  left(m->>'month', 7)                        as month,
  nullif(m->>'expectedUsd', '')::numeric      as expected_usd
from public.building_state,
     jsonb_array_elements(coalesce(state->'monthlyExpected', '[]'::jsonb)) as m
where id = 'building';

-- Building projects ---------------------------------------------------------
create or replace view public.v_projects as
select
  p->>'id'                                   as project_id,
  p->>'name'                                 as name,
  p->>'description'                          as description,
  nullif(p->>'totalBudget', '')::numeric     as total_budget,
  p->>'dueDate'                              as due_date,
  p->>'distribution'                         as distribution,
  p->>'status'                               as status
from public.building_state,
     jsonb_array_elements(coalesce(state->'buildingProjects', '[]'::jsonb)) as p
where id = 'building';

-- Generator / water meter readings -----------------------------------------
create or replace view public.v_service_readings as
select
  r->>'serviceType'                             as service_type,
  left(r->>'forMonth', 7)                       as for_month,
  (select tt->>'name'
     from jsonb_array_elements(coalesce(bs.state->'tenants', '[]'::jsonb)) tt
    where tt->>'id' = line.key)                 as tenant,
  nullif(line.value->>'previousReading','')::numeric as previous_reading,
  nullif(line.value->>'currentReading','')::numeric  as current_reading,
  nullif(line.value->>'breakerAmps','')::numeric     as breaker_amps
from public.building_state bs,
     jsonb_array_elements(coalesce(bs.state->'serviceReadings', '[]'::jsonb)) r,
     jsonb_each(coalesce(r->'lines', '{}'::jsonb)) as line
where bs.id = 'building';

-- Snapshot metadata ---------------------------------------------------------
create or replace view public.v_state_info as
select
  id,
  rev,
  updated_at,
  jsonb_array_length(state->'tenants')      as tenant_count,
  jsonb_array_length(state->'transactions') as transaction_count,
  state->'building'->>'name'                as building_name,
  state->'settings'->>'collectionMode'      as collection_mode,
  state->'settings'->>'language'            as language
from public.building_state;
