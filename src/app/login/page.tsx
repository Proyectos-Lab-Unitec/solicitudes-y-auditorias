import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { destinoSeguro } from "@/lib/rutas";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión | Gestión de Laboratorios",
};

// Lee searchParams (aviso de cuenta inactiva o correo confirmado) en cada
// request; se permite bloquear el prerender.
export const instant = false;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    inactivo?: string;
    confirmado?: string;
    error?: string;
    next?: string;
  }>;
}) {
  const params = await searchParams;
  const next = destinoSeguro(params.next);

  const avisoInicial = params.confirmado
    ? {
        tipo: "exito" as const,
        texto:
          "Correo confirmado. Tu cuenta sigue pendiente de aprobación por el administrador.",
      }
    : params.error === "confirmacion"
      ? {
          tipo: "error" as const,
          texto:
            "No se pudo confirmar el correo. Intenta de nuevo o solicita ayuda al administrador.",
        }
      : params.inactivo
        ? {
            tipo: "info" as const,
            texto:
              "Tu cuenta no está activa o no tiene perfil. Contacta al administrador.",
          }
        : undefined;

  return (
    <AuthShell>
      <LoginForm avisoInicial={avisoInicial} next={next} />
    </AuthShell>
  );
}
