-- Extiende el guardián de RLS a vistas y vistas materializadas.
--
-- Una vista creada en public por un rol con BYPASSRLS (como postgres) puede
-- saltarse las políticas de las tablas base si se consulta con la publishable
-- key. Para que eso no pase:
--   * toda vista nueva nace sin grants para anon/authenticated;
--   * las vistas normales usan security_invoker, así que respetan las políticas
--     de quien consulta;
--   * las vistas materializadas quedan cerradas (no admiten security_invoker).

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
    select n.nspname as esquema, c.relname as objeto, c.relkind as tipo
    from pg_event_trigger_ddl_commands() e
    join pg_class c on c.oid = e.objid
    join pg_namespace n on n.oid = c.relnamespace
    where e.schema_name = 'public'
      and e.command_tag in (
        'CREATE TABLE',
        'CREATE TABLE AS',
        'CREATE VIEW',
        'CREATE MATERIALIZED VIEW'
      )
      and c.relkind in ('r', 'p', 'v', 'm')
  loop
    if r.tipo in ('r', 'p') then
      execute format(
        'alter table %I.%I enable row level security',
        r.esquema, r.objeto
      );
      execute format(
        'revoke all on table %I.%I from anon, authenticated',
        r.esquema, r.objeto
      );
      raise notice 'RLS habilitado por defecto en %.%', r.esquema, r.objeto;
    elsif r.tipo = 'v' then
      execute format(
        'revoke all on table %I.%I from anon, authenticated',
        r.esquema, r.objeto
      );
      execute format(
        'alter view %I.%I set (security_invoker = true)',
        r.esquema, r.objeto
      );
      raise notice 'Vista %.% cerrada con security_invoker', r.esquema, r.objeto;
    else
      execute format(
        'revoke all on table %I.%I from anon, authenticated',
        r.esquema, r.objeto
      );
      raise notice 'Vista materializada %.% cerrada', r.esquema, r.objeto;
    end if;
  end loop;
end;
$$;

do $$
begin
  execute 'drop event trigger if exists rls_por_defecto';
  execute $sql$
    create event trigger rls_por_defecto
      on ddl_command_end
      when tag in (
        'CREATE TABLE',
        'CREATE TABLE AS',
        'CREATE VIEW',
        'CREATE MATERIALIZED VIEW'
      )
      execute function public.rls_por_defecto()
  $sql$;
  raise notice 'Event trigger rls_por_defecto actualizado.';
exception
  when insufficient_privilege then
    raise notice 'Sin privilegios para event triggers; usa public.auditar_rls().';
end;
$$;

revoke all on function public.rls_por_defecto() from public, anon, authenticated;
