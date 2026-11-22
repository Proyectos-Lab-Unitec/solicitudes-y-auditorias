-- Una sola revisión por semana y laboratorio.
--
-- Antes cada auditoría semanal tenía cinco filas en `auditoria_computo_dias`
-- (lunes a viernes) y los equipos/respuestas colgaban de cada día. Como la
-- revisión es semanal y no diaria, se elimina el nivel "día": equipos y
-- respuestas referencian directamente `auditorias_computo`, y las notas de la
-- semana se guardan en `auditorias_computo.observaciones`.

-- 1. Columnas nuevas (nacen NULL para poder migrar las filas existentes).
alter table public.auditoria_computo_equipos
  add column if not exists auditoria_id uuid;

alter table public.auditoria_computo_respuestas
  add column if not exists auditoria_id uuid;

-- 2. Día representativo de cada auditoría: el que más respuestas tiene y, en
--    empate, el más reciente. Así se conserva la revisión más completa.
create temp table revision_elegida on commit drop as
with conteo as (
  select
    d.id as dia_id,
    d.auditoria_id,
    d.fecha,
    count(r.id) as respuestas
  from public.auditoria_computo_dias d
  left join public.auditoria_computo_respuestas r on r.dia_id = d.id
  group by d.id, d.auditoria_id, d.fecha
)
select distinct on (auditoria_id) dia_id, auditoria_id
from conteo
order by auditoria_id, respuestas desc, fecha desc;

update public.auditoria_computo_equipos e
set auditoria_id = re.auditoria_id
from revision_elegida re
where e.dia_id = re.dia_id;

update public.auditoria_computo_respuestas r
set auditoria_id = re.auditoria_id
from revision_elegida re
where r.dia_id = re.dia_id;

-- Las filas de los días no elegidos se descartan.
delete from public.auditoria_computo_equipos where auditoria_id is null;
delete from public.auditoria_computo_respuestas where auditoria_id is null;

-- 3. Las observaciones de los días se conservan en la auditoría semanal.
with notas as (
  select
    d.auditoria_id,
    string_agg(nullif(btrim(d.observaciones), ''), E'\n' order by d.fecha) as texto
  from public.auditoria_computo_dias d
  where nullif(btrim(d.observaciones), '') is not null
  group by d.auditoria_id
)
update public.auditorias_computo a
set observaciones = case
  when nullif(btrim(a.observaciones), '') is null then n.texto
  when n.texto is null then a.observaciones
  else a.observaciones || E'\n' || n.texto
end
from notas n
where a.id = n.auditoria_id;

-- 4. Equipos: deja de depender del día y pasa a depender de la auditoría.
alter table public.auditoria_computo_equipos
  drop constraint if exists auditoria_computo_equipos_dia_id_computadora_id_key,
  drop constraint if exists auditoria_computo_equipos_dia_id_fkey,
  drop column if exists dia_id,
  alter column auditoria_id set not null,
  add constraint auditoria_computo_equipos_auditoria_id_fkey
    foreign key (auditoria_id) references public.auditorias_computo (id)
    on delete cascade,
  add constraint auditoria_computo_equipos_auditoria_id_computadora_id_key
    unique (auditoria_id, computadora_id);

-- 5. Respuestas: ídem, una sola respuesta por (semana, computadora, ítem).
alter table public.auditoria_computo_respuestas
  drop constraint if exists auditoria_computo_respuestas_dia_id_computadora_id_item_id_key,
  drop constraint if exists auditoria_computo_respuestas_dia_id_fkey,
  drop column if exists dia_id,
  alter column auditoria_id set not null,
  add constraint auditoria_computo_respuestas_auditoria_id_fkey
    foreign key (auditoria_id) references public.auditorias_computo (id)
    on delete cascade,
  add constraint auditoria_computo_respuestas_audit_comp_item_key
    unique (auditoria_id, computadora_id, item_id);

-- 6. Índices acordes al nuevo modelo.
drop index if exists public.idx_auditoria_computo_dias_fecha;
drop index if exists public.idx_respuestas_computo_dia;

create index if not exists idx_equipos_computo_auditoria
  on public.auditoria_computo_equipos (auditoria_id);

create index if not exists idx_respuestas_computo_auditoria
  on public.auditoria_computo_respuestas (auditoria_id);

-- 7. La tabla de días desaparece junto con sus políticas y grants.
drop table if exists public.auditoria_computo_dias cascade;
