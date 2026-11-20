import { connection } from "next/server";
import { requirePerfil } from "@/lib/auth";
import { PanelShell } from "@/components/panel-shell";

// El layout lee la sesión en cada request.
export const instant = false;

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Supabase usa Date.now() al validar la sesión; forzamos request time.
  await connection();

  const perfil = await requirePerfil();

  return <PanelShell perfil={perfil}>{children}</PanelShell>;
}
