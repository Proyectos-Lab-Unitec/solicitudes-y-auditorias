-- Checklist de cómputo con checkbox: solo "pendiente" y "ok".
--
-- Antes cada ítem podía marcarse como "falla" o "no_aplica". Ahora el check
-- solo indica que está OK; todo lo demás cuenta como problema al completar la
-- semana. Las respuestas antiguas se convierten a "pendiente" y el conteo de
-- problemas se guarda en la auditoría.

-- 1. Normaliza los estados existentes: cualquier cosa que no sea "ok" cuenta
--    como sin marcar.
update public.auditoria_computo_respuestas
set estado = 'pendiente'
where estado <> 'ok';

alter table public.auditoria_computo_respuestas
  drop constraint if exists auditoria_computo_respuestas_estado_check,
  add constraint auditoria_computo_respuestas_estado_check
    check (estado in ('pendiente', 'ok'));

-- 2. Total de ítems sin marcar al completar cada semana.
alter table public.auditorias_computo
  add column if not exists problemas int not null default 0;

-- Para semanas ya completadas, calcula el conteo a partir de lo que quedó en
-- la base (ahora pendiente = problema).
update public.auditorias_computo a
set problemas = conteo.problemas
from (
  select
    auditoria_id,
    count(*)::int as problemas
  from public.auditoria_computo_respuestas
  where estado = 'pendiente'
  group by auditoria_id
) conteo
where a.id = conteo.auditoria_id
  and a.estado = 'completada';
