import { redirect } from "next/navigation";
import { connection } from "next/server";
import { requirePerfil } from "@/lib/auth";
import { puedeVerModulo } from "@/lib/roles";

export const instant = false;

export default async function AuditoriasPage() {
  await connection();
  const perfil = await requirePerfil();

  if (puedeVerModulo(perfil.rol, "auditorias-5s")) {
    redirect("/panel/auditorias/5s");
  }

  if (puedeVerModulo(perfil.rol, "auditorias-computo")) {
    redirect("/panel/auditorias/computo");
  }

  redirect("/panel");
}
