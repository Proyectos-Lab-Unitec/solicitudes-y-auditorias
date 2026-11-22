-- Auditorías de cómputo semanales por computadora.
--
-- Un laboratorio tiene computadoras. Cada computadora se revisa con ítems de
-- hardware y software. La auditoría es semanal (lunes a viernes) y cada día
-- guarda el estado de cada ítem y las observaciones por computadora.

drop table if exists public.auditoria_computo_respuestas cascade;
drop table if exists public.auditorias_computo cascade;
drop table if exists public.checklist_items cascade;

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text not null check (categoria in ('Hardware', 'Software')),
  orden int not null default 0,
  activo boolean not null default true,
  creado_por uuid references public.perfiles (id) on delete set null,
  creado_en timestamptz not null default now()
);

create table public.computadoras (
  id uuid primary key default gen_random_uuid(),
  laboratorio_id uuid not null references public.labs_computo (id) on delete cascade,
  codigo text not null,
  nombre text,
  orden int not null default 0,
  activo boolean not null default true,
  creado_por uuid references public.perfiles (id) on delete set null,
  creado_en timestamptz not null default now(),
  unique (laboratorio_id, codigo)
);

create table public.auditorias_computo (
  id uuid primary key default gen_random_uuid(),
  laboratorio_id uuid not null references public.labs_computo (id) on delete restrict,
  semana_inicio date not null,
  estado text not null default 'borrador'
    check (estado in ('borrador', 'completada')),
  auditor_id uuid references public.perfiles (id) on delete set null,
  observaciones text,
  creado_en timestamptz not null default now(),
  completado_en timestamptz,
  unique (laboratorio_id, semana_inicio)
);

create table public.auditoria_computo_dias (
  id uuid primary key default gen_random_uuid(),
  auditoria_id uuid not null references public.auditorias_computo (id) on delete cascade,
  fecha date not null,
  observaciones text,
  unique (auditoria_id, fecha)
);

create table public.auditoria_computo_equipos (
  id uuid primary key default gen_random_uuid(),
  dia_id uuid not null references public.auditoria_computo_dias (id) on delete cascade,
  computadora_id uuid not null references public.computadoras (id) on delete cascade,
  observacion_hardware text,
  observacion_software text,
  unique (dia_id, computadora_id)
);

create table public.auditoria_computo_respuestas (
  id uuid primary key default gen_random_uuid(),
  dia_id uuid not null references public.auditoria_computo_dias (id) on delete cascade,
  computadora_id uuid not null references public.computadoras (id) on delete cascade,
  item_id uuid not null references public.checklist_items (id) on delete cascade,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'ok', 'falla', 'no_aplica')),
  unique (dia_id, computadora_id, item_id)
);

create index if not exists idx_computadoras_laboratorio
  on public.computadoras (laboratorio_id, orden);

create index if not exists idx_auditorias_computo_semana
  on public.auditorias_computo (semana_inicio desc);

create index if not exists idx_auditoria_computo_dias_fecha
  on public.auditoria_computo_dias (auditoria_id, fecha);

create index if not exists idx_respuestas_computo_dia
  on public.auditoria_computo_respuestas (dia_id);

alter table public.computadoras enable row level security;
alter table public.auditorias_computo enable row level security;
alter table public.auditoria_computo_dias enable row level security;
alter table public.auditoria_computo_equipos enable row level security;
alter table public.auditoria_computo_respuestas enable row level security;

drop policy if exists "lectura autenticada" on public.computadoras;
create policy "lectura autenticada"
  on public.computadoras for select
  using (auth.uid() is not null);

drop policy if exists "lectura autenticada" on public.checklist_items;
create policy "lectura autenticada"
  on public.checklist_items for select
  using (auth.uid() is not null);

drop policy if exists "lectura autenticada" on public.auditorias_computo;
create policy "lectura autenticada"
  on public.auditorias_computo for select
  using (auth.uid() is not null);

drop policy if exists "lectura autenticada" on public.auditoria_computo_dias;
create policy "lectura autenticada"
  on public.auditoria_computo_dias for select
  using (auth.uid() is not null);

drop policy if exists "lectura autenticada" on public.auditoria_computo_equipos;
create policy "lectura autenticada"
  on public.auditoria_computo_equipos for select
  using (auth.uid() is not null);

drop policy if exists "lectura autenticada" on public.auditoria_computo_respuestas;
create policy "lectura autenticada"
  on public.auditoria_computo_respuestas for select
  using (auth.uid() is not null);

insert into public.checklist_items (nombre, categoria, orden) values
  ('Teclado', 'Hardware', 1),
  ('Mouse', 'Hardware', 2),
  ('Monitor', 'Hardware', 3),
  ('Cable de red', 'Hardware', 4),
  ('Arranque correcto', 'Software', 5),
  ('Internet', 'Software', 6),
  ('Office sin problemas', 'Software', 7),
  ('Windows sin problemas', 'Software', 8);
