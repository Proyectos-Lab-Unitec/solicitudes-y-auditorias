/**
 * Verifica que ninguna tabla de `public` quede expuesta.
 *
 * Llama a la función SQL `public.auditar_rls()` con la service role key.
 * Sale con código 1 si encuentra problemas, para poder usarlo como gate
 * antes de desplegar.
 *
 * Uso:
 *   npm run db:rls
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local"
  );
  process.exitCode = 2;
} else {
  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.rpc("auditar_rls");

  if (error) {
    console.error(`No se pudo ejecutar auditar_rls(): ${error.message}`);
    process.exitCode = 2;
  } else {
    const problemas = data ?? [];

    if (problemas.length === 0) {
      console.log(
        "RLS OK: todas las tablas de public tienen RLS y políticas."
      );
    } else {
      console.error(`RLS con problemas (${problemas.length}):`);
      for (const fila of problemas) {
        console.error(`  - ${fila.tabla}: ${fila.problema}`);
      }
      process.exitCode = 1;
    }
  }
}
