-- Perfiles de la aplicación.
--
-- Se usa el esquema public (igual que Asistencias) para simplificar la
-- exposición de la API de Supabase. Cuando se consolide el núcleo compartido
-- se puede mover a un esquema core con una migración posterior.

create table if not exists public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  correo text not null unique,
  rol text not null default 'usuario'
    check (rol in ('admin', 'usuario', 'consulta')),
  activo boolean not null default false,
  area text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

alter table public.perfiles enable row level security;

-- Cada usuario puede leer su propio perfil.
drop policy if exists "perfil propio" on public.perfiles;
create policy "perfil propio"
  on public.perfiles
  for select
  using (auth.uid() = id);

-- Crea el perfil automáticamente cuando alguien se registra.
-- La cuenta nace inactiva: el administrador la aprueba después.
create or replace function public.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre, correo, rol, activo)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'nombre', ''),
      split_part(new.email, '@', 1)
    ),
    new.email,
    'usuario',
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.crear_perfil();
