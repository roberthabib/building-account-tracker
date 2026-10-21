-- Phase 2j live checks — run AFTER phase2j-v167.sql.
--
-- Everything happens inside one transaction that is rolled back at the end:
-- made-up phones (a concierge, a tenant, a view-only admin and a second
-- owner) and a few made-up items (a job, a supply, a space, another flat's
-- booking and posts) are created, used through the same functions the app
-- calls, and thrown away with every change they made.
--
-- Run in: SQL Editor -> paste -> Run. If the editor warns about a table
-- without RLS, that is the temporary results table: "Run without RLS".
-- Every row of the result should say ok = true.

begin;

create temp table r (n serial, name text, ok boolean);
grant all on r to authenticated;
grant usage on sequence r_n_seq to authenticated;

create function pg_temp.fails(p_sql text) returns boolean language plpgsql as $$
begin
  execute p_sql;
  return false;
exception when others then
  return true;
end;
$$;

insert into auth.users (id, aud, role, email, is_anonymous)
values ('00000000-0000-4000-a000-0000000000d1', 'authenticated', 'authenticated', 'check-concierge@example.invalid', true),
       ('00000000-0000-4000-a000-0000000000d2', 'authenticated', 'authenticated', 'check-tenant@example.invalid', true),
       ('00000000-0000-4000-a000-0000000000d3', 'authenticated', 'authenticated', 'check-viewer@example.invalid', false),
       ('00000000-0000-4000-a000-0000000000d4', 'authenticated', 'authenticated', 'check-owner@example.invalid', false);

insert into public.profiles (auth_user_id, role, tenant_id)
values ('00000000-0000-4000-a000-0000000000d1', 'concierge', null),
       ('00000000-0000-4000-a000-0000000000d2', 'tenant',
        (select t->>'id' from public.building_state, jsonb_array_elements(state->'tenants') t
          where id = 'building' and coalesce((t->>'active')::boolean, true) limit 1)),
       ('00000000-0000-4000-a000-0000000000d3', 'viewer', null),
       ('00000000-0000-4000-a000-0000000000d4', 'owner', null)
on conflict (auth_user_id) do update set role = excluded.role, tenant_id = excluded.tenant_id;

-- Made-up items (rolled back with everything else).
update public.building_state set state =
  jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(state,
    '{routineTasks}', coalesce(state->'routineTasks', '[]'::jsonb) || '[{"id":"job-check","title":"check job","days":[],"active":true}]'::jsonb, true),
    '{supplies}', coalesce(state->'supplies', '[]'::jsonb) || '[{"id":"sup-check","name":"check bulbs","qty":5,"lowAt":1}]'::jsonb, true),
    '{settings,spaces}', coalesce(state->'settings'->'spaces', '[]'::jsonb) || '[{"id":"sp-check","name":"check roof"}]'::jsonb, true),
    '{bookings}', coalesce(state->'bookings', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
      'id', 'bk-other', 'spaceId', 'sp-check', 'date', to_char(current_date + 3, 'YYYY-MM-DD'), 'from', '10:00', 'to', '12:00',
      'tenantId', 'zz-other', 'unit', '9Z', 'note', 'secret note', 'status', 'booked')), true),
    '{boardPosts}', coalesce(state->'boardPosts', '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object('id', 'post-other-pending', 'tenantId', 'zz-other', 'authorName', 'Other', 'title', 'pending other', 'status', 'pending', 'createdAt', public.now_iso(), 'updatedAt', public.now_iso()),
      jsonb_build_object('id', 'post-other-ok', 'tenantId', 'zz-other', 'authorName', 'Other', 'title', 'approved other', 'status', 'approved', 'createdAt', public.now_iso(), 'updatedAt', public.now_iso())), true)
 where id = 'building';

update public.building_state set state =
  jsonb_set(jsonb_set(jsonb_set(state,
    '{settings,approvalOverUsd}', '50'::jsonb, true),
    '{deposits}', coalesce(state->'deposits', '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object('id', 'dep-other', 'tenantId', 'zz-other', 'amountUsd', 100, 'status', 'held'),
      jsonb_build_object('id', 'dep-mine', 'tenantId', (select t->>'id' from jsonb_array_elements(state->'tenants') t
                                                        where coalesce((t->>'active')::boolean, true) limit 1), 'amountUsd', 200, 'status', 'held')), true),
    '{pendingExpenses}', coalesce(state->'pendingExpenses', '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object('id', 'apr-viewer-own', 'transactions', '[]'::jsonb, 'amountUsd', 60, 'requestedBy', 'check-viewer@example.invalid', 'status', 'pending')), true)
 where id = 'building';

-- A real flat, looked up now: once acting as a phone, the building row is hidden.
select set_config('check.flat', (select t->>'id' from public.building_state, jsonb_array_elements(state->'tenants') t where id = 'building' limit 1), true);

-- ── As the concierge ────────────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-0000000000d1","role":"authenticated","is_anonymous":true}', true);
set local role authenticated;

insert into r (name, ok) select 'concierge: ticks a job', public.concierge_tick_task('job-check', to_char(current_date, 'YYYY-MM-DD')) = true;
insert into r (name, ok) select 'concierge: ticking again unticks it', public.concierge_tick_task('job-check', to_char(current_date, 'YYYY-MM-DD')) = false;
insert into r (name, ok) select 'concierge: cannot tick a job from last month', pg_temp.fails($$select public.concierge_tick_task('job-check', to_char(current_date - 30, 'YYYY-MM-DD'))$$);
insert into r (name, ok) select 'concierge: counts supplies', public.concierge_adjust_supply('sup-check', -2) = 3;
insert into r (name, ok) select 'concierge: stock never goes below zero', public.concierge_adjust_supply('sup-check', -50) = 0;
select public.concierge_log_visitor('check plumber', 'Repair', '1A');
insert into r (name, ok) select 'concierge: notes a visitor',
  exists (select 1 from jsonb_array_elements(public.get_my_state()->'visitorLog') v where v->>'name' = 'check plumber');
select public.concierge_save_water_readings(to_char(current_date + 40, 'YYYY-MM') || '-01',
  jsonb_build_object(current_setting('check.flat'),
                     jsonb_build_object('previousReading', 10, 'currentReading', 14)));
insert into r (name, ok) select 'concierge: saves water meter readings',
  exists (select 1 from jsonb_array_elements(public.get_my_state()->'serviceReadings') x
           where x->>'serviceType' = 'water' and left(x->>'forMonth', 7) = to_char(current_date + 40, 'YYYY-MM'));
insert into r (name, ok) select 'concierge: sees jobs and supplies',
  jsonb_array_length(public.get_my_state()->'routineTasks') > 0 and jsonb_array_length(public.get_my_state()->'supplies') > 0;
insert into r (name, ok) select 'concierge: sees bookings without who booked or why',
  exists (select 1 from jsonb_array_elements(public.get_my_state()->'bookings') b where b->>'id' = 'bk-other')
  and not exists (select 1 from jsonb_array_elements(public.get_my_state()->'bookings') b where b ? 'tenantId' or b ? 'note');
insert into r (name, ok) select 'concierge: an expense over the limit is accepted (to wait for approval)',
  public.concierge_add_expense('{"description":"check big","date":"2099-01-15","amountUsd":100}'::jsonb) like 'cx-%';
insert into r (name, ok) select 'concierge: sees no deposits or approvals list',
  not (s ? 'deposits' or s ? 'pendingExpenses') from (select public.get_my_state() as s) x;
insert into r (name, ok) select 'concierge: cannot approve expenses', pg_temp.fails($$select public.approve_expense('apr-viewer-own', true)$$);
insert into r (name, ok) select 'concierge: cannot book a space', pg_temp.fails($$select public.book_space('sp-check', to_char(current_date + 3, 'YYYY-MM-DD'), '15:00', '16:00')$$);
insert into r (name, ok) select 'concierge: cannot post on the board', pg_temp.fails($$select public.post_to_board('x')$$);
insert into r (name, ok) select 'concierge: cannot mark a month checked', pg_temp.fails($$select public.mark_month_checked('chk-abcd1', '2026-01', 'x')$$);
insert into r (name, ok) select 'concierge: cannot step down an owner', pg_temp.fails($$select public.step_down(true)$$);
insert into r (name, ok) select 'concierge: cannot change tenant details', pg_temp.fails($$select public.update_my_details('70 1', 'en')$$);

-- ── As a tenant phone ───────────────────────────────────────────────────────
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-0000000000d2","role":"authenticated","is_anonymous":true}', true);
set local role authenticated;

insert into r (name, ok) select 'tenant: books a free slot',
  public.book_space('sp-check', to_char(current_date + 3, 'YYYY-MM-DD'), '18:00', '20:00', 'check booking') like 'bk-%';
insert into r (name, ok) select 'tenant: an overlapping booking is refused',
  pg_temp.fails($$select public.book_space('sp-check', to_char(current_date + 3, 'YYYY-MM-DD'), '19:00', '21:00')$$);
insert into r (name, ok) select 'tenant: another flat''s slot is refused',
  pg_temp.fails($$select public.book_space('sp-check', to_char(current_date + 3, 'YYYY-MM-DD'), '11:00', '13:00')$$);
insert into r (name, ok) select 'tenant: end time must be after the start',
  pg_temp.fails($$select public.book_space('sp-check', to_char(current_date + 4, 'YYYY-MM-DD'), '20:00', '18:00')$$);
insert into r (name, ok) select 'tenant: sees other flats'' bookings without who or why',
  exists (select 1 from jsonb_array_elements(public.get_my_state()->'bookings') b
           where b->>'id' = 'bk-other' and not (b ? 'tenantId' or b ? 'note' or b ? 'unit'));
select public.cancel_my_booking((select b->>'id' from jsonb_array_elements(public.get_my_state()->'bookings') b where b->>'note' = 'check booking'));
insert into r (name, ok) select 'tenant: cancels their own booking',
  exists (select 1 from jsonb_array_elements(public.get_my_state()->'bookings') b where b->>'note' = 'check booking' and b->>'status' = 'cancelled');
insert into r (name, ok) select 'tenant: cannot cancel another flat''s booking', pg_temp.fails($$select public.cancel_my_booking('bk-other')$$);
insert into r (name, ok) select 'tenant: posts on the board (waiting for approval)',
  public.post_to_board('check sofa', 'for sale') like 'post-%';
insert into r (name, ok) select 'tenant: sees their own pending post',
  exists (select 1 from jsonb_array_elements(public.get_my_state()->'boardPosts') p where p->>'title' = 'check sofa' and p->>'status' = 'pending');
insert into r (name, ok) select 'tenant: another flat''s pending post is hidden',
  not exists (select 1 from jsonb_array_elements(public.get_my_state()->'boardPosts') p where p->>'id' = 'post-other-pending');
insert into r (name, ok) select 'tenant: approved posts show, without the other flat''s id',
  exists (select 1 from jsonb_array_elements(public.get_my_state()->'boardPosts') p where p->>'id' = 'post-other-ok' and not (p ? 'tenantId'));
insert into r (name, ok) select 'tenant: a photo in someone else''s folder is refused',
  pg_temp.fails($$select public.post_to_board('x', null, 'board/zz-other/a.jpg')$$);
select public.remove_my_post((select p->>'id' from jsonb_array_elements(public.get_my_state()->'boardPosts') p where p->>'title' = 'check sofa'));
insert into r (name, ok) select 'tenant: removes their own post',
  not exists (select 1 from jsonb_array_elements(public.get_my_state()->'boardPosts') p where p->>'title' = 'check sofa');
insert into r (name, ok) select 'tenant: cannot remove another flat''s post', pg_temp.fails($$select public.remove_my_post('post-other-ok')$$);
select public.update_my_details('70 123 456', 'ar');
insert into r (name, ok) select 'tenant: updates their phone and language',
  exists (select 1 from jsonb_array_elements(public.get_my_state()->'tenants') t
           where t->>'id' = public.my_tenant_id() and t->>'phone' = '70 123 456' and t->>'language' = 'ar' and t ? 'detailsAt');
insert into r (name, ok) select 'tenant: language must be en or ar', pg_temp.fails($$select public.update_my_details('70 1', 'fr')$$);
insert into r (name, ok) select 'tenant: a phone number must look like one', pg_temp.fails($$select public.update_my_details('<script>', 'en')$$);
insert into r (name, ok) select 'tenant: no jobs, supplies, visitors or month checks',
  not (s ? 'routineTasks' or s ? 'routineLog' or s ? 'supplies' or s ? 'visitorLog' or s ? 'monthChecks') from (select public.get_my_state() as s) x;
insert into r (name, ok) select 'tenant: which flats share a cost stays private',
  not exists (select 1 from jsonb_array_elements(public.get_my_state()->'transactions') t where t ? 'onlyFlats')
  and not exists (select 1 from jsonb_array_elements(public.get_my_state()->'buildingProjects') p where p ? 'onlyFlats');
insert into r (name, ok) select 'tenant: sees their own deposit only',
  exists (select 1 from jsonb_array_elements(public.get_my_state()->'deposits') d where d->>'id' = 'dep-mine')
  and not exists (select 1 from jsonb_array_elements(public.get_my_state()->'deposits') d where d->>'id' = 'dep-other');
insert into r (name, ok) select 'tenant: nothing about expenses waiting for approval',
  not (s ? 'pendingExpenses') from (select public.get_my_state() as s) x;
insert into r (name, ok) select 'tenant: cannot approve expenses', pg_temp.fails($$select public.approve_expense('apr-viewer-own', true)$$);
insert into r (name, ok) select 'tenant: cannot tick jobs', pg_temp.fails($$select public.concierge_tick_task('job-check', to_char(current_date, 'YYYY-MM-DD'))$$);
insert into r (name, ok) select 'tenant: cannot change supplies', pg_temp.fails($$select public.concierge_adjust_supply('sup-check', 1)$$);
insert into r (name, ok) select 'tenant: cannot mark a month checked', pg_temp.fails($$select public.mark_month_checked('chk-abcd1', '2026-01', 'x')$$);
insert into r (name, ok) select 'tenant: cannot step down an owner', pg_temp.fails($$select public.step_down(false)$$);
insert into r (name, ok) select 'tenant: cannot send the late reminders', pg_temp.fails($$select public.send_late_reminders()$$);

-- ── As a view-only administrator ────────────────────────────────────────────
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-0000000000d3","role":"authenticated","email":"check-viewer@example.invalid"}', true);
set local role authenticated;
select public.mark_month_checked('chk-check01', '2026-09', 'abc123');
insert into r (name, ok) select 'viewer: marks a month as checked, with their email',
  exists (select 1 from jsonb_array_elements(public.get_my_state()->'monthChecks') c
           where c->>'id' = 'chk-check01' and c->>'by' = 'check-viewer@example.invalid' and c->>'month' = '2026-09');
insert into r (name, ok) select 'viewer: the concierge''s big expense waits, outside the accounts',
  exists (select 1 from jsonb_array_elements(public.get_my_state()->'pendingExpenses') p where p->>'description' = 'check big' and p->>'status' = 'pending')
  and not exists (select 1 from jsonb_array_elements(public.get_my_state()->'transactions') t where t->>'description' = 'check big');
select public.approve_expense((select p->>'id' from jsonb_array_elements(public.get_my_state()->'pendingExpenses') p where p->>'description' = 'check big'), true);
insert into r (name, ok) select 'viewer: approving it moves it into the accounts',
  exists (select 1 from jsonb_array_elements(public.get_my_state()->'transactions') t
           where t->>'description' = 'check big' and t->>'approvedBy' = 'check-viewer@example.invalid');
insert into r (name, ok) select 'viewer: a decided expense cannot be decided again',
  pg_temp.fails(format('select public.approve_expense(%L, false)', (select p->>'id' from jsonb_array_elements(public.get_my_state()->'pendingExpenses') p where p->>'description' = 'check big')));
insert into r (name, ok) select 'viewer: cannot approve their own request', pg_temp.fails($$select public.approve_expense('apr-viewer-own', true)$$);
insert into r (name, ok) select 'viewer: a malformed check is refused', pg_temp.fails($$select public.mark_month_checked('x', '2026-09', 'a')$$);
insert into r (name, ok) select 'viewer: cannot step down an owner', pg_temp.fails($$select public.step_down(true)$$);

-- ── As a second owner handing over ──────────────────────────────────────────
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-0000000000d4","role":"authenticated","email":"check-owner@example.invalid"}', true);
set local role authenticated;
select public.step_down(true);
insert into r (name, ok) select 'owner: steps down to view-only once another owner exists',
  public.is_viewer() and not public.is_owner();

-- ── Set-up ──────────────────────────────────────────────────────────────────
reset role;
insert into r (name, ok) select 'late reminders job runs every morning',
  exists (select 1 from cron.job where jobname = 'late-reminders' and schedule = '0 6 * * *');
insert into r (name, ok) select 'late reminders run without error', public.send_late_reminders() >= 0;
insert into r (name, ok) select 'reminder log is private',
  not has_table_privilege('authenticated', 'public.late_reminder_log', 'select')
  and not has_table_privilege('anon', 'public.late_reminder_log', 'select');
insert into r (name, ok) select 'storage: tenants may upload only into their own board folder',
  exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'tenant upload own board photos');
insert into r (name, ok) select 'anonymous key cannot call the new functions',
  not has_function_privilege('anon', 'public.book_space(text, text, text, text, text)', 'execute')
  and not has_function_privilege('anon', 'public.post_to_board(text, text, text)', 'execute')
  and not has_function_privilege('anon', 'public.step_down(boolean)', 'execute')
  and not has_function_privilege('anon', 'public.concierge_tick_task(text, text)', 'execute')
  and not has_function_privilege('anon', 'public.approve_expense(text, boolean)', 'execute');

select n, name, ok from r order by n;
rollback;

-- Afterwards, as a separate query, confirm nothing was left behind (expect 0):
--   select count(*) from auth.users where email like 'check-%@example.invalid';
