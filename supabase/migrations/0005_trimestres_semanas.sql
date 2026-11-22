-- Trimestre y número de semana por auditoría.
-- Cada trimestre tiene 10 semanas de clases (lunes a viernes).

alter table public.auditorias_computo
  add column if not exists trimestre text not null default 'Q1'
    check (trimestre in ('Q1', 'Q2', 'Q3', 'Q4'));

alter table public.auditorias_computo
  add column if not exists numero_semana int not null default 1
    check (numero_semana between 1 and 10);

-- Los registros existentes se acomodan como Q4 para no chocar con el índice.
with ordenadas as (
  select
    id,
    row_number() over (
      partition by laboratorio_id
      order by semana_inicio
    ) as rn
  from public.auditorias_computo
)
update public.auditorias_computo a
set
  trimestre = 'Q4',
  numero_semana = least(o.rn, 10)
from ordenadas o
where a.id = o.id;

create unique index if not exists auditorias_computo_lab_trimestre_semana
  on public.auditorias_computo (laboratorio_id, trimestre, numero_semana);
