<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Seguridad de la base (obligatorio)

Toda tabla nueva en `public` debe quedar con RLS y políticas explícitas. El
event trigger `rls_por_defecto` activa RLS y quita grants a
`anon`/`authenticated` en cada `CREATE TABLE`, pero **no crea políticas**.

1. Crea la tabla.
2. Agrega políticas `select`, `insert`, `update`, `delete` con
   `to authenticated` y los helpers `public.es_admin()`,
   `public.es_usuario()`, `public.es_consultor()`, `public.es_checklist()`,
   `public.puede_leer_computo()`, `public.puede_escribir_computo()`,
   `public.puede_leer_solicitudes()` o `public.puede_escribir_solicitudes()`.
3. Concede solo lo necesario a `authenticated` (RLS sigue filtrando).
4. Ejecuta `npm run db:rls`; debe responder `RLS OK`.

Reglas:

- `anon` no tiene acceso a ninguna tabla: todo exige sesión.
- Las cuentas con `activo = false` no pasan ninguna política.
- El backend usa `service_role` (solo servidor); nunca lo expongas al cliente.
- Tablas append-only (por ejemplo `audit_logs`): solo `grant select` y una
  política `select` para admin, sin políticas de escritura.
- Las vistas nuevas nacen con `security_invoker = true` y sin grants.
- Las funciones `security definer` deben hacer
  `revoke all on function ... from public, anon` y conceder `execute` solo a
  quien corresponda.
