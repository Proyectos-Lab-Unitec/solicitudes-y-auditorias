import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { RegistroForm } from "./registro-form";

export const metadata: Metadata = {
  title: "Crear cuenta | Gestión de Laboratorios",
};

export default function RegistroPage() {
  return (
    <AuthShell>
      <RegistroForm />
    </AuthShell>
  );
}
