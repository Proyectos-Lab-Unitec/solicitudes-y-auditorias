-- Año del trimestre en las auditorías de cómputo.
--
-- Antes, (laboratorio, trimestre, número de semana) identificaba una semana de
-- forma única, sin año. Eso impide registrar el mismo trimestre en dos años
-- distintos. Se agrega `anio` y la unicidad pasa a incluir el año.

alter table public.auditorias_computo
  add column if not exists anio int;

-- El año del trimestre es el de su semana 1. Si no existe la semana 1, se usa
-- el año de la propia semana.
with anclas as (
  select
    laboratorio_id,
    trimestre,
    extract(year from min(semana_inicio))::int as anio
  from public.auditorias_computo
  group by laboratorio_id, trimestre
)
update public.auditorias_computo a
set anio = anclas.anio
from anclas
where a.laboratorio_id = anclas.laboratorio_id
  and a.trimestre = anclas.trimestre
  and a.anio is null;

update public.auditorias_computo
set anio = extract(year from semana_inicio)::int
where anio is null;

alter table public.auditorias_computo
  alter column anio set not null;

alter table public.auditorias_computo
  alter column anio
  set default extract(year from (now() at time zone 'America/El_Salvador'))::int;

alter table public.auditorias_computo
  add constraint auditorias_computo_anio_check check (anio between 2000 and 2100);

drop index if exists public.auditorias_computo_lab_trimestre_semana;

create unique index if not exists auditorias_computo_lab_anio_trimestre_semana
  on public.auditorias_computo (laboratorio_id, anio, trimestre, numero_semana);
