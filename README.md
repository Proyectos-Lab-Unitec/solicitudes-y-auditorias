# Solicitudes y Auditorías — Gestión de Laboratorios

Sistema interno de la **Coordinación de Laboratorios de Ingeniería de UNITEC**
para gestionar solicitudes de compra, mantenimiento, descarte y auditorías 5S,
de seguridad y de cómputo.

## Stack

- **Next.js 16** (App Router, Turbopack)
- **TypeScript**
- **Tailwind CSS 4**
- **Supabase**: autenticación, base de datos y Storage
- **Vercel** para el despliegue

## Identidad visual

Se reutiliza la paleta de LabHub y Asistencias de Laboratorios:

| Token | Valor | Uso |
| --- | --- | --- |
| `--fondo` | `#07065d` | Fondo de acceso |
| `--fondo-profundo` | `#04042e` | Overlay del fondo |
| `--superficie-azul` | `#06065c` | Botones y cabeceras |
| `--acento` | `#0f49b6` | Hover, enlaces y énfasis |
| `--acento-claro` | `#6ea2ff` | Texto secundario sobre azul |
| `--superficie-clara` | `#f3f4f6` | Fondo de contenido |
| `--tarjeta` | `#ffffff` | Tarjetas y formularios |
| `--borde` | `#e3e8f2` | Bordes |
| `--texto` | `#0a1633` | Texto principal |
| `--tenue` | `#56648a` | Texto secundario |

## Requisitos

- Node.js 20 o superior
- npm
- Un proyecto de Supabase

## Puesta en marcha

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abre `http://localhost:3000`.

## Variables de entorno

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_DOMINIO_INSTITUCIONAL=unitec.edu
SUPABASE_SERVICE_ROLE_KEY=
```

- Las variables `NEXT_PUBLIC_*` se inlinean en el build: deben existir antes de
  `npm run build`.
- `SUPABASE_SERVICE_ROLE_KEY` es **solo de servidor**. Se usará para el CRUD de
  usuarios y tareas administrativas.
- Sin las variables públicas, la pantalla de login funciona pero avisa que
  falta configurar Supabase.

## Base de datos

Aplica la migración inicial en el SQL Editor de Supabase o con la CLI:

```bash
supabase db push
```

La migración `supabase/migrations/0001_perfiles.sql`:

- crea `public.perfiles`;
- activa RLS y permite que cada usuario lea su propio perfil;
- crea automáticamente el perfil al registrarse;
- deja la cuenta **inactiva** (`activo = false`) hasta que el administrador la
  apruebe.

## Prueba local

Con Supabase local (`supabase start`) y la migración aplicada:

```bash
npm run dev
```

| Servicio | URL |
| --- | --- |
| Aplicación | http://localhost:3000 |
| Supabase Studio | http://127.0.0.1:54323 |
| Mailpit (correos) | http://127.0.0.1:54324 |

Para probar el flujo de aprobación, regístrate en `/registro` y luego activa la
cuenta desde el Studio o con SQL:

```sql
update public.perfiles
set activo = true, rol = 'usuario'
where correo = 'jefe@unitec.edu';
```

> `supabase db reset` borra los usuarios y vuelve a aplicar las migraciones.
> Después hay que registrar de nuevo las cuentas de prueba.

## Flujo de acceso

1. La persona se registra en `/registro` con su correo institucional.
2. Supabase envía el correo de confirmación (si está activado).
3. El perfil se crea con rol `usuario` y `activo = false`.
4. El administrador revisa la cuenta, la activa y le asigna el rol.
5. La persona inicia sesión en `/login`.

El administrador puede **aprobar** las cuentas registradas o **crear usuarios
directamente** desde el panel, con una contraseña temporal y el rol asignado.

## Panel de administración

El panel tiene un layout con sidebar, navegación por rol y cierre de sesión.
La sección **Usuarios** (solo para `admin`) permite:

- Buscar por nombre o correo y filtrar por rol.
- Ver el resumen de cuentas: total, activas, pendientes y administradores.
- Crear usuarios con nombre, correo, área, rol y contraseña temporal.
- Cambiar el rol: administrador, usuario o consulta.
- Activar o desactivar cuentas.
- Eliminar usuarios.
- Protecciones: no puedes cambiar tu propio rol, desactivarte, eliminarte ni
  dejar el sistema sin administradores activos.

Requiere `SUPABASE_SERVICE_ROLE_KEY` en el servidor, porque el CRUD bypassa RLS.

### Configuración recomendada en Supabase

- **Auth → Providers → Email**: habilitado.
- **Auth → Settings → Confirm email**: activado.
- **Auth → Settings → Allowed email domains**: agregar el dominio
  institucional como segunda barrera.

El registro también valida el dominio en el navegador con
`NEXT_PUBLIC_DOMINIO_INSTITUCIONAL`.

## Rutas actuales

| Ruta | Descripción |
| --- | --- |
| `/` | Redirige a `/login` o `/panel` según la sesión |
| `/login` | Inicio de sesión |
| `/registro` | Registro con correo institucional |
| `/panel` | Panel con módulos y estado de la cuenta |
| `/panel/usuarios` | CRUD de usuarios (solo admin) |
| `/panel/compras` | Módulo en construcción |
| `/panel/mantenimiento` | Módulo en construcción |
| `/panel/descarte` | Módulo en construcción |
| `/panel/auditorias` | Módulo en construcción |
| `/auth/confirm` | Confirmación de correo de Supabase |

## Scripts

```bash
npm run dev      # desarrollo
npm run lint     # ESLint
npm run build    # build de producción
npm run start    # producción local
```

Verificación antes de cerrar una tarea:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Estado

- [x] Proyecto Next.js inicializado
- [x] Login y registro con Supabase
- [x] Perfiles con aprobación del administrador
- [x] Layout del panel con sidebar, navegación por rol y logout
- [x] CRUD de usuarios (crear, rol, activar/desactivar, eliminar)
- [ ] Módulo de solicitudes de compra
- [ ] Módulo de mantenimiento
- [ ] Módulo de descarte
- [ ] Auditorías 5S
- [ ] Auditorías de seguridad
- [ ] Auditorías de cómputo
