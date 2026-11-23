-- Un trimestre siempre tiene sus 10 semanas.
--
-- Se elimina el concepto de trimestre "activo/inactivo": la configuración solo
-- guarda el lunes de la semana 1 y el sistema calcula las 10 semanas desde ahí.

drop function if exists public.guardar_trimestre_config(
  int,
  text,
  date,
  boolean,
  uuid
);

alter table public.trimestres_config
  drop column if exists activo;

create or replace function public.guardar_trimestre_config(
  p_anio int,
  p_trimestre text,
  p_fecha_inicio date,
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
    actualizado_por,
    actualizado_en
  )
  values (
    p_anio,
    p_trimestre,
    p_fecha_inicio,
    p_actualizado_por,
    now()
  )
  on conflict (anio, trimestre) do update
  set
    fecha_inicio = excluded.fecha_inicio,
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
  uuid
) from public, anon;

grant execute on function public.guardar_trimestre_config(
  int,
  text,
  date,
  uuid
) to service_role;
