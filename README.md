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

Las migraciones viven en `supabase/migrations/` y son la fuente de verdad:

| Migración | Contenido |
| --- | --- |
| `0001_perfiles.sql` | `perfiles`, alta automática y cuenta inactiva |
| `0002_roles.sql` | roles `admin`, `usuario`, `consultor`, `checklist` |
| `0003_auditorias_computo.sql` | laboratorios, ítems y auditorías |
| `0004_auditorias_semanales.sql` | computadoras, días, equipos y respuestas |
| `0005_trimestres_semanas.sql` | trimestre y número de semana (Q1–Q4) |
| `0006_rls_endurecida.sql` | políticas RLS por rol y cierre de la API |
| `0007_rls_vistas.sql` | cierre automático de vistas y vistas materializadas |
| `0008_anio_auditorias.sql` | año del trimestre en las auditorías de cómputo |
| `0009_revision_semanal_unica.sql` | una sola revisión por semana (sin días) |
| `0010_estados_checkbox.sql` | estados `pendiente`/`ok` y conteo de problemas |

En local:

```bash
supabase start
supabase migration up
```

En producción:

```bash
supabase db push
```

La cuenta se crea **inactiva** (`activo = false`) hasta que el administrador la
apruebe.

## Seguridad de la base (RLS)

La API REST de Supabase queda expuesta con la publishable key, así que RLS es la
barrera que impide leer o escribir sin pasar por la app. El modelo está en
`supabase/migrations/0006_rls_endurecida.sql` y sigue el patrón de
`Proyectos/proyectoReserva`:

- `anon` no tiene **ningún** privilegio: todo el sistema exige sesión.
- `authenticated` recibe permisos por tabla; RLS filtra las filas.
- El backend usa `service_role` (bypassa RLS) y es el único que escribe en la
  práctica.
- Una tabla nueva nace **cerrada**: sin grants para `anon`/`authenticated`.
  Además, un event trigger (`rls_por_defecto`) habilita RLS automáticamente en
  cada `CREATE TABLE` dentro de `public`.
- Las vistas nuevas también nacen cerradas y con `security_invoker = true`,
  porque una vista creada por un rol con BYPASSRLS podría saltarse las políticas
  de sus tablas base.

### Helpers

| Función | Qué hace |
| --- | --- |
| `mi_rol()` | Rol del usuario autenticado. |
| `mi_cuenta_activa()` | Si su cuenta está aprobada. |
| `tiene_rol(...)` | Rol permitido **y** cuenta activa. |
| `es_admin()`, `es_usuario()`, `es_consultor()`, `es_checklist()` | Atajos. |
| `puede_leer_computo()` / `puede_escribir_computo()` | Matriz de cómputo. |
| `puede_leer_solicitudes()` / `puede_escribir_solicitudes()` | Solicitudes. |

Son `security definer` con `search_path` fijo para leer `perfiles` sin
recursión en las políticas.

### Matriz aplicada

| Tabla | SELECT | INSERT / UPDATE / DELETE |
| --- | --- | --- |
| `perfiles` | propio o admin | propio (sin cambiar rol ni `activo`) o admin |
| `labs_computo`, `computadoras`, `checklist_items`, auditorías, equipos y respuestas | admin, consultor, checklist | solo checklist |

Admin y consultor son **solo lectura** en cómputo; `checklist` es el único que
escribe. Una cuenta inactiva no pasa ninguna política aunque tenga sesión.

### Cómo agregar una tabla nueva

1. `create table public.mi_tabla (...)` — el event trigger activa RLS y quita
   grants automáticamente.
2. Crea políticas explícitas (`select`, `insert`, `update`, `delete`) con
   `to authenticated` y los helpers de arriba.
3. Concede lo mínimo: `grant select, insert, update, delete on public.mi_tabla
   to authenticated;` (RLS sigue filtrando).
4. Verifica con `npm run db:rls`.

Si creas una función `security definer`, recuerda que PostgreSQL le da
`EXECUTE` a `PUBLIC` por defecto: haz `revoke all on function ... from public,
anon;` y concede solo a quien corresponda.

### Tablas de auditoría (append-only)

Para tablas como `audit_logs`, replica el patrón de `proyectoReserva`:

- `grant select` a `authenticated`, sin `insert/update/delete`.
- Una sola política `select` para admin.
- Los inserts los hace un trigger `security definer` o la `service_role`.
- Sin políticas de `update`/`delete`, la tabla es inmutable desde el cliente.

Por eso una tabla con "una sola política" puede estar **completa**: la ausencia
de políticas de escritura es intencional.

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

## Roles

| Rol | Acceso |
| --- | --- |
| `admin` | Panel de administración (usuarios y bandeja de solicitudes), auditorías 5S, de seguridad y de cómputo. |
| `usuario` | Jefe de área / Instructor: solicitudes de compra, mantenimiento y descarte. |
| `consultor` | Solo lectura de los módulos. |
| `checklist` | Solo auditorías de cómputo: laboratorios, ítems y registro diario. |

El auto-registro crea la cuenta como `usuario` inactivo. El administrador la
activa y, si corresponde, cambia el rol a `consultor` o `checklist`. La
navegación y el acceso a cada módulo se validan en el servidor con la matriz de
`src/lib/roles.ts`.

## Panel de administración

El panel tiene un layout con sidebar, navegación por rol y cierre de sesión.
La sección **Usuarios** (solo para `admin`) permite:

- Buscar por nombre o correo y filtrar por rol.
- Ver el resumen de cuentas: total, activas, pendientes y administradores.
- Crear usuarios con nombre, correo, área, rol y contraseña temporal.
- Cambiar el rol: administrador, usuario, consultor o checklist.
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
| `/panel/solicitudes` | Bandeja de aprobación (solo admin) |
| `/panel/compras` | Solicitudes de compra (usuario) |
| `/panel/mantenimiento` | Solicitudes de mantenimiento (usuario) |
| `/panel/descarte` | Solicitudes de descarte (usuario) |
| `/panel/auditorias/5s` | Auditorías 5S (admin y consultor) |
| `/panel/auditorias/seguridad` | Auditorías de seguridad (admin y consultor) |
| `/panel/auditorias/computo` | Auditorías de cómputo (admin, consultor y checklist) |
| `/panel/auditorias/computo/laboratorios/[id]` | Detalle del laboratorio: computadoras y edición (solo checklist escribe) |
| `/auth/confirm` | Confirmación de correo de Supabase |

### Flujo de auditorías de cómputo

El rol `checklist` registra la revisión en tres pasos:

1. Elige el laboratorio de la lista.
2. Elige el trimestre (`Q1`–`Q4`).
3. Elige la semana (1–10). Al abrirla se cargan las computadoras del
   laboratorio con sus ítems de Hardware y Software.

La revisión es **semanal, no diaria**: hay una sola lista por semana y
laboratorio, sin días individuales. La semana se crea la primera vez que se abre
y queda en `borrador`. Cada ítem es un checkbox: por defecto está `pendiente` y
solo se marca si está OK. Al completar la semana se cuentan automáticamente todos
los checkboxes sin marcar como problemas; el total se guarda en
`auditorias_computo.problemas` y la semana pasa a `completada` (ya no se edita).
Las observaciones por computadora viven en `auditoria_computo_equipos` y las
generales en `auditorias_computo.observaciones`. El año se guarda en
`auditorias_computo.anio`, así que el mismo trimestre puede repetirse en años
distintos. Admin y consultor ven el mismo asistente en modo lectura.

El rango lunes–viernes se usa solo como **etiqueta** de la semana; no se guarda
ninguna fecha de revisión por día.

Las computadoras ya no tienen una lista global: se administran desde el
**detalle del laboratorio** (enlace "Abrir" en la lista de laboratorios).
Ahí el rol `checklist` puede editar los datos del laboratorio, agregar, editar,
activar/desactivar y eliminar computadoras. Los ítems del checklist también se
pueden editar desde la pestaña `Ítems`. Admin y consultor solo leen.

### Descarga de Excel

En `/panel/auditorias/computo` hay un formulario **Descargar checklist en Excel**
para admin, checklist y consultor. Permite elegir año, trimestre, semana y modo:

- **Resultados guardados**: incluye los checks y las observaciones de la semana.
- **Plantilla en blanco**: hojas listas para imprimir o llenar fuera del sistema.

El endpoint es `GET /api/auditorias/computo/excel?anio=2026&trimestre=Q4&semana=6&modo=resultados`.
Solo acepta años válidos, trimestres `Q1`–`Q4`, semanas `1`–`10` y los dos modos
anteriores. Valida sesión activa y rol en servidor; sin sesión responde `401` y
con un rol sin acceso responde `403`.

El archivo trae una hoja por **laboratorio activo**, con el mismo bloque
HARDWARE/SOFTWARE del formato usado hasta ahora, más encabezado con trimestre,
semana y rango lunes–viernes, columnas y filas dinámicas, observaciones por
computadora, resumen de problemas, encabezados congelados y ajuste de impresión.
Antes de descargar se muestra un aviso con la lista de laboratorios activos que
todavía no tienen registro para la semana elegida; esas hojas se exportan como
plantilla.

## Integración con LabHub

Cada módulo se publica como una **tarjeta individual** en LabHub. La tarjeta
debe apuntar a la ruta del módulo:

| Tarjeta | Ruta |
| --- | --- |
| Compras | `/panel/compras` |
| Mantenimiento | `/panel/mantenimiento` |
| Descarte | `/panel/descarte` |
| Auditorías 5S | `/panel/auditorias/5s` |
| Auditorías de seguridad | `/panel/auditorias/seguridad` |
| Auditorías de cómputo | `/panel/auditorias/computo` |

Si la persona no tiene sesión, el proxy la envía a:

```text
/login?next=<ruta original>
```

Después del login, la aplicación valida que el rol tenga acceso y la devuelve al
módulo solicitado. Si no tiene acceso, la manda a `/panel`.

El parámetro `next` solo acepta rutas internas que empiecen con `/panel`;
cualquier otro valor se descarta para evitar redirecciones abiertas.

## Scripts

```bash
npm run dev      # desarrollo
npm run lint     # ESLint
npm run build    # build de producción
npm run start    # producción local
npm run db:rls   # audita RLS; falla si una tabla quedó expuesta
```

Verificación antes de cerrar una tarea:

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run db:rls
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
- [x] Auditorías de cómputo
