-- Laboratorios de cómputo, ítems de checklist y auditorías diarias.
-- El rol Checklist crea y edita; Admin y Consultor solo leen.

create table if not exists public.labs_computo (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nombre text not null,
  ubicacion text,
  activo boolean not null default true,
  creado_por uuid references public.perfiles (id) on delete set null,
  creado_en timestamptz not null default now()
);

create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text not null default 'Otros',
  orden int not null default 0,
  activo boolean not null default true,
  creado_por uuid references public.perfiles (id) on delete set null,
  creado_en timestamptz not null default now()
);

create table if not exists public.auditorias_computo (
  id uuid primary key default gen_random_uuid(),
  laboratorio_id uuid not null references public.labs_computo (id) on delete restrict,
  fecha date not null,
  estado text not null default 'borrador'
    check (estado in ('borrador', 'completada')),
  auditor_id uuid references public.perfiles (id) on delete set null,
  observaciones text,
  creado_en timestamptz not null default now(),
  completado_en timestamptz,
  unique (laboratorio_id, fecha)
);

create table if not exists public.auditoria_computo_respuestas (
  id uuid primary key default gen_random_uuid(),
  auditoria_id uuid not null references public.auditorias_computo (id) on delete cascade,
  item_id uuid not null references public.checklist_items (id) on delete cascade,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'ok', 'falla', 'no_aplica')),
  observacion text,
  unique (auditoria_id, item_id)
);

create index if not exists idx_auditorias_computo_fecha
  on public.auditorias_computo (fecha desc);

create index if not exists idx_respuestas_computo_auditoria
  on public.auditoria_computo_respuestas (auditoria_id);

create index if not exists idx_items_computo_orden
  on public.checklist_items (categoria, orden);

alter table public.labs_computo enable row level security;
alter table public.checklist_items enable row level security;
alter table public.auditorias_computo enable row level security;
alter table public.auditoria_computo_respuestas enable row level security;

drop policy if exists "lectura autenticada" on public.labs_computo;
create policy "lectura autenticada"
  on public.labs_computo for select
  using (auth.uid() is not null);

drop policy if exists "lectura autenticada" on public.checklist_items;
create policy "lectura autenticada"
  on public.checklist_items for select
  using (auth.uid() is not null);

drop policy if exists "lectura autenticada" on public.auditorias_computo;
create policy "lectura autenticada"
  on public.auditorias_computo for select
  using (auth.uid() is not null);

drop policy if exists "lectura autenticada" on public.auditoria_computo_respuestas;
create policy "lectura autenticada"
  on public.auditoria_computo_respuestas for select
  using (auth.uid() is not null);

-- Ítems iniciales de referencia. Solo se insertan si la tabla está vacía.
insert into public.checklist_items (nombre, categoria, orden)
select v.nombre, v.categoria, v.orden
from (
  values
    ('CPU funcional', 'Hardware', 1),
    ('Monitor encendido y sin daños', 'Hardware', 2),
    ('Teclado funcional', 'Hardware', 3),
    ('Mouse funcional', 'Hardware', 4),
    ('Sistema operativo inicia sin errores', 'Software', 5),
    ('Navegador y ofimática funcionan', 'Software', 6),
    ('Conexión a red e internet', 'Conectividad', 7),
    ('Cableado y tomacorrientes en buen estado', 'Seguridad física', 8)
) as v(nombre, categoria, orden)
where not exists (select 1 from public.checklist_items);
