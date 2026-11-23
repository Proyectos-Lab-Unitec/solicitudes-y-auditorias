-- Configuración de trimestres por año.
--
-- Hasta ahora la semana 1 de cada trimestre se calculaba en código (primer
-- lunes de enero/abril/julio/octubre) y el año salía de la fecha del servidor.
-- Esta tabla permite que admin y checklist definan el lunes de la semana 1 de
-- cada trimestre y que las 10 semanas se calculen desde ahí.
--
-- Al guardar una configuración, la función `guardar_trimestre_config` también
-- mueve `semana_inicio` de todas las auditorías registradas de ese año y
-- trimestre, para que la decisión "recalcular al editar" quede consistente.

create table if not exists public.trimestres_config (
  id uuid primary key default gen_random_uuid(),
  anio int not null check (anio between 2000 and 2100),
  trimestre text not null check (trimestre in ('Q1', 'Q2', 'Q3', 'Q4')),
  fecha_inicio date not null,
  activo boolean not null default true,
  actualizado_por uuid references public.perfiles (id) on delete set null,
  actualizado_en timestamptz not null default now(),
  creado_en timestamptz not null default now(),
  unique (anio, trimestre),
  constraint trimestres_config_lunes_check
    check (extract(isodow from fecha_inicio) = 1)
);

-- Admin y checklist pueden configurar; el resto solo lectura o sin acceso.
create or replace function public.puede_configurar_trimestres()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$ select public.tiene_rol('admin', 'checklist'); $$;

revoke all on function public.puede_configurar_trimestres() from public, anon;
grant execute on function public.puede_configurar_trimestres()
  to authenticated, service_role;

alter table public.trimestres_config enable row level security;

create policy "trimestres_config_select"
  on public.trimestres_config
  for select
  to authenticated
  using (public.puede_leer_computo());

create policy "trimestres_config_insert"
  on public.trimestres_config
  for insert
  to authenticated
  with check (public.puede_configurar_trimestres());

create policy "trimestres_config_update"
  on public.trimestres_config
  for update
  to authenticated
  using (public.puede_configurar_trimestres())
  with check (public.puede_configurar_trimestres());

create policy "trimestres_config_delete"
  on public.trimestres_config
  for delete
  to authenticated
  using (public.puede_configurar_trimestres());

grant select, insert, update, delete on public.trimestres_config
  to authenticated;

-- Guarda la configuración y recalcula las semanas ya registradas.
-- Solo el backend (service_role) la ejecuta; la autorización real se valida en
-- la Server Action con el rol del perfil.
create or replace function public.guardar_trimestre_config(
  p_anio int,
  p_trimestre text,
  p_fecha_inicio date,
  p_activo boolean,
  p_actualizado_por uuid
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_afectadas int;
begin
  if p_anio is null or p_anio < 2000 or p_anio > 2100 then
    raise exception 'El año no es válido.' using errcode = '22023';
  end if;

  if p_trimestre not in ('Q1', 'Q2', 'Q3', 'Q4') then
    raise exception 'El trimestre no es válido.' using errcode = '22023';
  end if;

  if p_fecha_inicio is null
    or extract(isodow from p_fecha_inicio)::int <> 1 then
    raise exception 'La fecha de inicio debe ser un lunes.'
      using errcode = '22023';
  end if;

  insert into public.trimestres_config (
    anio,
    trimestre,
    fecha_inicio,
    activo,
    actualizado_por,
    actualizado_en
  )
  values (
    p_anio,
    p_trimestre,
    p_fecha_inicio,
    coalesce(p_activo, true),
    p_actualizado_por,
    now()
  )
  on conflict (anio, trimestre) do update
  set
    fecha_inicio = excluded.fecha_inicio,
    activo = excluded.activo,
    actualizado_por = excluded.actualizado_por,
    actualizado_en = now();

  update public.auditorias_computo
  set semana_inicio = p_fecha_inicio + ((numero_semana - 1) * 7)
  where anio = p_anio
    and trimestre = p_trimestre;

  get diagnostics v_afectadas = row_count;
  return v_afectadas;
end;
$$;

revoke all on function public.guardar_trimestre_config(
  int,
  text,
  date,
  boolean,
  uuid
) from public, anon;

grant execute on function public.guardar_trimestre_config(
  int,
  text,
  date,
  boolean,
  uuid
) to service_role;

-- Deja listos el año actual y el siguiente con el calendario canónico. Si ya
-- existe una fila, no se toca.
with anos as (
  select extract(year from (now() at time zone 'America/El_Salvador'))::int as anio
  union
  select extract(year from (now() at time zone 'America/El_Salvador'))::int + 1
),
opciones as (
  select *
  from (values
    ('Q1', 1),
    ('Q2', 4),
    ('Q3', 7),
    ('Q4', 10)
  ) as t(trimestre, mes)
),
fechas as (
  select
    a.anio,
    o.trimestre,
    make_date(a.anio, o.mes, 1) as primer_dia
  from anos a
  cross join opciones o
)
insert into public.trimestres_config (anio, trimestre, fecha_inicio)
select
  anio,
  trimestre,
  primer_dia + ((8 - extract(isodow from primer_dia))::int % 7)
from fechas
on conflict (anio, trimestre) do nothing;
