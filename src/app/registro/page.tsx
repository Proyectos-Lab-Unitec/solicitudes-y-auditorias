import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { destinoSeguro } from "@/lib/rutas";
import { RegistroForm } from "./registro-form";

export const instant = false;

export const metadata: Metadata = {
  title: "Crear cuenta | Gestión de Laboratorios",
};

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = destinoSeguro(params.next);

  return (
    <AuthShell>
      <RegistroForm next={next} />
    </AuthShell>
  );
}
