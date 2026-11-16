/**
 * Dominio institucional permitido para el registro.
 *
 * Se puede cambiar con NEXT_PUBLIC_DOMINIO_INSTITUCIONAL sin tocar el código.
 */
export const DOMINIO_INSTITUCIONAL =
  process.env.NEXT_PUBLIC_DOMINIO_INSTITUCIONAL?.trim() || "unitec.edu";

export function esCorreoInstitucional(correo: string) {
  return correo
    .trim()
    .toLowerCase()
    .endsWith(`@${DOMINIO_INSTITUCIONAL.toLowerCase()}`);
}
