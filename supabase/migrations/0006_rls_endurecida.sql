-- Endurecimiento de RLS.
--
-- Modelo tomado de Proyectos/proyectoReserva:
--   * Helpers security definer para leer el rol sin recursión en las políticas.
--   * Una política por tabla y por acción, siempre con "to authenticated".
--   * anon sin ningún privilegio: toda la app exige sesión.
--   * Fail-closed: toda tabla nueva nace sin grants para anon/authenticated.
--   * Las tablas de auditoría (append-only) se documentan en README.
--
-- Importante: la app usa la service_role key desde el servidor, que bypassa
-- RLS. Estas políticas son la segunda capa: protegen la API REST pública
-- (publishable key) de llamadas directas sin pasar por la app.

-- ============================================================================
-- 1. Helpers
-- ============================================================================

-- Rol del usuario autenticado (sin filtrar por activo: es el dato crudo).
create or replace function public.mi_rol()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.rol
  from public.perfiles p
  where p.id = auth.uid();
$$;

-- ¿La cuenta del usuario autenticado está aprobada?
create or replace function public.mi_cuenta_activa()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select p.activo from public.perfiles p where p.id = auth.uid()),
    false
  );
$$;

-- Autorización base: rol permitido Y cuenta activa.
-- security definer evita la recursión al consultar perfiles desde sus políticas.
create or replace function public.tiene_rol(variadic p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.perfiles p
    where p.id = auth.uid()
      and p.activo
      and p.rol = any (p_roles)
  );
$$;

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$ select public.tiene_rol('admin'); $$;

create or replace function public.es_usuario()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$ select public.tiene_rol('usuario'); $$;

create or replace function public.es_consultor()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$ select public.tiene_rol('consultor'); $$;

create or replace function public.es_checklist()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$ select public.tiene_rol('checklist'); $$;

-- Matriz de módulos (espejo de src/lib/roles.ts).
-- Admin y consultor leen cómputo; solo checklist escribe.
create or replace function public.puede_leer_computo()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$ select public.tiene_rol('admin', 'consultor', 'checklist'); $$;

create or replace function public.puede_escribir_computo()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$ select public.tiene_rol('checklist'); $$;

-- Reservadas para los módulos de solicitudes (compras/mantenimiento/descarte).
create or replace function public.puede_leer_solicitudes()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$ select public.tiene_rol('admin', 'consultor', 'usuario'); $$;

create or replace function public.puede_escribir_solicitudes()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$ select public.tiene_rol('usuario'); $$;

-- Las políticas se evalúan con los privilegios del que llama: solo
-- authenticated necesita EXECUTE. anon no tiene sesión ni acceso.
revoke all on function public.mi_rol() from public, anon;
revoke all on function public.mi_cuenta_activa() from public, anon;
revoke all on function public.tiene_rol(text[]) from public, anon;
revoke all on function public.es_admin() from public, anon;
revoke all on function public.es_usuario() from public, anon;
revoke all on function public.es_consultor() from public, anon;
revoke all on function public.es_checklist() from public, anon;
revoke all on function public.puede_leer_computo() from public, anon;
revoke all on function public.puede_escribir_computo() from public, anon;
revoke all on function public.puede_leer_solicitudes() from public, anon;
revoke all on function public.puede_escribir_solicitudes() from public, anon;

grant execute on function public.mi_rol() to authenticated, service_role;
grant execute on function public.mi_cuenta_activa() to authenticated, service_role;
grant execute on function public.tiene_rol(text[]) to authenticated, service_role;
grant execute on function public.es_admin() to authenticated, service_role;
grant execute on function public.es_usuario() to authenticated, service_role;
grant execute on function public.es_consultor() to authenticated, service_role;
grant execute on function public.es_checklist() to authenticated, service_role;
grant execute on function public.puede_leer_computo() to authenticated, service_role;
grant execute on function public.puede_escribir_computo() to authenticated, service_role;
grant execute on function public.puede_leer_solicitudes() to authenticated, service_role;
grant execute on function public.puede_escribir_solicitudes() to authenticated, service_role;

-- ============================================================================
-- 2. perfiles
-- ============================================================================
-- El perfil nace por trigger (security definer) al registrarse: no hay INSERT.
-- Cada quien lee su fila (incluso inactiva, para ver "pendiente de aprobación").
-- El admin lee y administra todas. Nadie puede cambiarse el rol ni activarse.

alter table public.perfiles enable row level security;

drop policy if exists "perfil propio" on public.perfiles;
drop policy if exists "perfiles_select_propio" on public.perfiles;
drop policy if exists "perfiles_select_admin" on public.perfiles;
drop policy if exists "perfiles_update_admin" on public.perfiles;
drop policy if exists "perfiles_update_propio" on public.perfiles;
drop policy if exists "perfiles_delete_admin" on public.perfiles;

create policy "perfiles_select_propio"
  on public.perfiles for select
  to authenticated
  using (auth.uid() = id);

create policy "perfiles_select_admin"
  on public.perfiles for select
  to authenticated
  using (public.es_admin());

create policy "perfiles_update_propio"
  on public.perfiles for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and public.mi_rol() = rol
    and public.mi_cuenta_activa() = activo
  );

create policy "perfiles_update_admin"
  on public.perfiles for update
  to authenticated
  using (public.es_admin())
  with check (public.es_admin());

create policy "perfiles_delete_admin"
  on public.perfiles for delete
  to authenticated
  using (public.es_admin());

-- ============================================================================
-- 3. Auditorías de cómputo
-- ============================================================================
-- Lectura: admin (solo lectura), consultor (solo lectura) y checklist.
-- Escritura: únicamente checklist. Admin NO escribe cómputo.
-- Esto corrige además checklist_items, que tenía RLS deshabilitado por error
-- en la migración 0004 (drop + create sin "enable row level security").

alter table public.labs_computo enable row level security;
alter table public.computadoras enable row level security;
alter table public.checklist_items enable row level security;
alter table public.auditorias_computo enable row level security;
alter table public.auditoria_computo_dias enable row level security;
alter table public.auditoria_computo_equipos enable row level security;
alter table public.auditoria_computo_respuestas enable row level security;

-- labs_computo
drop policy if exists "lectura autenticada" on public.labs_computo;
drop policy if exists "labs_computo_select" on public.labs_computo;
drop policy if exists "labs_computo_insert" on public.labs_computo;
drop policy if exists "labs_computo_update" on public.labs_computo;
drop policy if exists "labs_computo_delete" on public.labs_computo;

create policy "labs_computo_select"
  on public.labs_computo for select
  to authenticated
  using (public.puede_leer_computo());

create policy "labs_computo_insert"
  on public.labs_computo for insert
  to authenticated
  with check (public.puede_escribir_computo());

create policy "labs_computo_update"
  on public.labs_computo for update
  to authenticated
  using (public.puede_escribir_computo())
  with check (public.puede_escribir_computo());

create policy "labs_computo_delete"
  on public.labs_computo for delete
  to authenticated
  using (public.puede_escribir_computo());

-- computadoras
drop policy if exists "lectura autenticada" on public.computadoras;
drop policy if exists "computadoras_select" on public.computadoras;
drop policy if exists "computadoras_insert" on public.computadoras;
drop policy if exists "computadoras_update" on public.computadoras;
drop policy if exists "computadoras_delete" on public.computadoras;

create policy "computadoras_select"
  on public.computadoras for select
  to authenticated
  using (public.puede_leer_computo());

create policy "computadoras_insert"
  on public.computadoras for insert
  to authenticated
  with check (public.puede_escribir_computo());

create policy "computadoras_update"
  on public.computadoras for update
  to authenticated
  using (public.puede_escribir_computo())
  with check (public.puede_escribir_computo());

create policy "computadoras_delete"
  on public.computadoras for delete
  to authenticated
  using (public.puede_escribir_computo());

-- checklist_items
drop policy if exists "lectura autenticada" on public.checklist_items;
drop policy if exists "checklist_items_select" on public.checklist_items;
drop policy if exists "checklist_items_insert" on public.checklist_items;
drop policy if exists "checklist_items_update" on public.checklist_items;
drop policy if exists "checklist_items_delete" on public.checklist_items;

create policy "checklist_items_select"
  on public.checklist_items for select
  to authenticated
  using (public.puede_leer_computo());

create policy "checklist_items_insert"
  on public.checklist_items for insert
  to authenticated
  with check (public.puede_escribir_computo());

create policy "checklist_items_update"
  on public.checklist_items for update
  to authenticated
  using (public.puede_escribir_computo())
  with check (public.puede_escribir_computo());

create policy "checklist_items_delete"
  on public.checklist_items for delete
  to authenticated
  using (public.puede_escribir_computo());

-- auditorias_computo
drop policy if exists "lectura autenticada" on public.auditorias_computo;
drop policy if exists "auditorias_computo_select" on public.auditorias_computo;
drop policy if exists "auditorias_computo_insert" on public.auditorias_computo;
drop policy if exists "auditorias_computo_update" on public.auditorias_computo;
drop policy if exists "auditorias_computo_delete" on public.auditorias_computo;

create policy "auditorias_computo_select"
  on public.auditorias_computo for select
  to authenticated
  using (public.puede_leer_computo());

create policy "auditorias_computo_insert"
  on public.auditorias_computo for insert
  to authenticated
  with check (public.puede_escribir_computo());

create policy "auditorias_computo_update"
  on public.auditorias_computo for update
  to authenticated
  using (public.puede_escribir_computo())
  with check (public.puede_escribir_computo());

create policy "auditorias_computo_delete"
  on public.auditorias_computo for delete
  to authenticated
  using (public.puede_escribir_computo());

-- auditoria_computo_dias
drop policy if exists "lectura autenticada" on public.auditoria_computo_dias;
drop policy if exists "auditoria_computo_dias_select" on public.auditoria_computo_dias;
drop policy if exists "auditoria_computo_dias_insert" on public.auditoria_computo_dias;
drop policy if exists "auditoria_computo_dias_update" on public.auditoria_computo_dias;
drop policy if exists "auditoria_computo_dias_delete" on public.auditoria_computo_dias;

create policy "auditoria_computo_dias_select"
  on public.auditoria_computo_dias for select
  to authenticated
  using (public.puede_leer_computo());

create policy "auditoria_computo_dias_insert"
  on public.auditoria_computo_dias for insert
  to authenticated
  with check (public.puede_escribir_computo());

create policy "auditoria_computo_dias_update"
  on public.auditoria_computo_dias for update
  to authenticated
  using (public.puede_escribir_computo())
  with check (public.puede_escribir_computo());

create policy "auditoria_computo_dias_delete"
  on public.auditoria_computo_dias for delete
  to authenticated
  using (public.puede_escribir_computo());

-- auditoria_computo_equipos
drop policy if exists "lectura autenticada" on public.auditoria_computo_equipos;
drop policy if exists "auditoria_computo_equipos_select" on public.auditoria_computo_equipos;
drop policy if exists "auditoria_computo_equipos_insert" on public.auditoria_computo_equipos;
drop policy if exists "auditoria_computo_equipos_update" on public.auditoria_computo_equipos;
drop policy if exists "auditoria_computo_equipos_delete" on public.auditoria_computo_equipos;

create policy "auditoria_computo_equipos_select"
  on public.auditoria_computo_equipos for select
  to authenticated
  using (public.puede_leer_computo());

create policy "auditoria_computo_equipos_insert"
  on public.auditoria_computo_equipos for insert
  to authenticated
  with check (public.puede_escribir_computo());

create policy "auditoria_computo_equipos_update"
  on public.auditoria_computo_equipos for update
  to authenticated
  using (public.puede_escribir_computo())
  with check (public.puede_escribir_computo());

create policy "auditoria_computo_equipos_delete"
  on public.auditoria_computo_equipos for delete
  to authenticated
  using (public.puede_escribir_computo());

-- auditoria_computo_respuestas
drop policy if exists "lectura autenticada" on public.auditoria_computo_respuestas;
drop policy if exists "auditoria_computo_respuestas_select" on public.auditoria_computo_respuestas;
drop policy if exists "auditoria_computo_respuestas_insert" on public.auditoria_computo_respuestas;
drop policy if exists "auditoria_computo_respuestas_update" on public.auditoria_computo_respuestas;
drop policy if exists "auditoria_computo_respuestas_delete" on public.auditoria_computo_respuestas;

create policy "auditoria_computo_respuestas_select"
  on public.auditoria_computo_respuestas for select
  to authenticated
  using (public.puede_leer_computo());

create policy "auditoria_computo_respuestas_insert"
  on public.auditoria_computo_respuestas for insert
  to authenticated
  with check (public.puede_escribir_computo());

create policy "auditoria_computo_respuestas_update"
  on public.auditoria_computo_respuestas for update
  to authenticated
  using (public.puede_escribir_computo())
  with check (public.puede_escribir_computo());

create policy "auditoria_computo_respuestas_delete"
  on public.auditoria_computo_respuestas for delete
  to authenticated
  using (public.puede_escribir_computo());

-- ============================================================================
-- 4. Grants explícitos (defensa en profundidad)
-- ============================================================================
-- Se parte de cero para anon y authenticated y se vuelve a conceder lo mínimo.
-- RLS sigue filtrando filas; los grants solo dicen qué operaciones se intentan.

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- anon: nada. La app entera exige sesión.
-- authenticated: según la matriz de roles.
grant select, update, delete on public.perfiles to authenticated;

grant select, insert, update, delete on
  public.labs_computo,
  public.computadoras,
  public.checklist_items,
  public.auditorias_computo,
  public.auditoria_computo_dias,
  public.auditoria_computo_equipos,
  public.auditoria_computo_respuestas
to authenticated;

-- El backend (service_role) conserva acceso total.
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- ============================================================================
-- 5. Defaults para tablas futuras: fail-closed
-- ============================================================================
-- Toda tabla nueva nace sin grants para anon/authenticated. Si una migración
-- olvida conceder permisos, la app falla con "permission denied" en vez de
-- quedar expuesta. Cada migración debe conceder lo suyo explícitamente.

alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;

-- ============================================================================
-- 6. Cinturón y tirantes: RLS automático en tablas nuevas
-- ============================================================================
-- Event trigger que habilita RLS y quita grants en cada CREATE TABLE dentro de
-- public. Si el rol de migraciones no puede crear event triggers (p. ej. en
-- algún entorno gestionado), se avisa y queda la verificación del punto 7.

create or replace function public.rls_por_defecto()
returns event_trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r record;
begin
  for r in
    select n.nspname as esquema, c.relname as tabla
    from pg_event_trigger_ddl_commands() e
    join pg_class c on c.oid = e.objid
    join pg_namespace n on n.oid = c.relnamespace
    where e.command_tag = 'CREATE TABLE'
      and e.schema_name = 'public'
      and c.relkind in ('r', 'p')
  loop
    execute format(
      'alter table %I.%I enable row level security',
      r.esquema, r.tabla
    );
    execute format(
      'revoke all on table %I.%I from anon, authenticated',
      r.esquema, r.tabla
    );
    raise notice 'RLS habilitado por defecto en %.%', r.esquema, r.tabla;
  end loop;
end;
$$;

do $$
begin
  execute 'drop event trigger if exists rls_por_defecto';
  execute $sql$
    create event trigger rls_por_defecto
      on ddl_command_end
      when tag in ('CREATE TABLE')
      execute function public.rls_por_defecto()
  $sql$;
  raise notice 'Event trigger rls_por_defecto creado.';
exception
  when insufficient_privilege then
    raise notice 'Sin privilegios para event triggers; usa public.auditar_rls().';
end;
$$;

revoke all on function public.rls_por_defecto() from public, anon, authenticated;

-- ============================================================================
-- 7. Verificación
-- ============================================================================
-- Devuelve una fila por cada problema detectado. Lo ideal es que no devuelva
-- nada. Se ejecuta con service_role: npm run db:rls

create or replace function public.auditar_rls()
returns table (tabla text, problema text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with tablas as (
    select c.oid, c.relname::text as tabla, c.relrowsecurity as rls
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
  ),
  pol as (
    select p.tablename::text as tabla, count(*) as total
    from pg_policies p
    where p.schemaname = 'public'
    group by p.tablename
  )
  select t.tabla, 'RLS deshabilitado'::text
  from tablas t
  where not t.rls

  union all

  select t.tabla, 'sin políticas'::text
  from tablas t
  left join pol on pol.tabla = t.tabla
  where t.rls
    and coalesce(pol.total, 0) = 0

  union all

  select t.tabla, 'anon conserva privilegios'::text
  from tablas t
  where has_table_privilege('anon', t.oid, 'SELECT')
     or has_table_privilege('anon', t.oid, 'INSERT')
     or has_table_privilege('anon', t.oid, 'UPDATE')
     or has_table_privilege('anon', t.oid, 'DELETE')

  order by 1, 2;
$$;

revoke all on function public.auditar_rls() from public, anon, authenticated;
grant execute on function public.auditar_rls() to service_role;
