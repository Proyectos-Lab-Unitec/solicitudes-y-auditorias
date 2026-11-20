-- Nuevo modelo de roles:
--   admin     -> administración, 5S y seguridad
--   usuario   -> jefe de área / instructor: compras, mantenimiento y descarte
--   consultor -> solo lectura
--   checklist -> auditorías de cómputo
--
-- "consulta" se reemplaza por "consultor".

update public.perfiles
set rol = 'consultor'
where rol = 'consulta';

alter table public.perfiles
  drop constraint if exists perfiles_rol_check;

alter table public.perfiles
  add constraint perfiles_rol_check
  check (rol in ('admin', 'usuario', 'consultor', 'checklist'));
