import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con la service role key. Bypassa RLS.
 *
 * Solo se usa en Server Components y Server Actions. Nunca debe importarse
 * desde un componente cliente.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Falta configurar NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
