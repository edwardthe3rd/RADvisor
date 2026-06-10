-- RADvisor — security hardening: defense-in-depth on table grants
-- Applied to Supabase project RADvisor-uswest1 (us-west-1).
--
-- Rationale: the public-facing PostgREST roles (anon, authenticated) never
-- write directly. All writes go through the service_role key, server-side
-- only — a separate privileged role that is unaffected by these revokes.
-- RLS already blocked writes (no permissive write policy exists), but
-- revoking the underlying grants removes reliance on RLS as the single
-- layer. Public read (SELECT) is preserved so the consumer site keeps
-- working unchanged.
--
-- Sprint 2 note: when per-operator write features land, grant the specific
-- privileges back to `authenticated` and pair them with scoped RLS policies
-- (operator can write only their own rows). Do NOT grant writes to `anon`.

revoke insert, update, delete, truncate, references, trigger
  on public.operators, public.equipment
  from anon, authenticated;

revoke insert, update, delete, truncate, references, trigger
  on public.operators, public.equipment
  from public;
