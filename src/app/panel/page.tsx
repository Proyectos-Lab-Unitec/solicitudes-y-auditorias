import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BotonSalir } from "./boton-salir";

// Lee la sesión (cookies) en cada request; se permite bloquear el prerender.
export const instant = false;

export default async function PanelPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("nombre, rol, activo")
    .eq("id", user.id)
    .single();

  if (!perfil || !perfil.activo) {
    redirect("/login?inactivo=1");
  }

  return (
    <div className="min-h-dvh bg-superficie-clara">
      <header className="bg-superficie-azul text-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/unitec-logo.png"
              alt="UNITEC"
              width={32}
              height={32}
              className="size-8 rounded-md bg-white/10 p-1"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight">
                Gestión de Laboratorios
              </p>
              <p className="truncate text-[11px] text-acento-claro">
                Coordinación de Laboratorios de Ingeniería
              </p>
            </div>
          </div>
          <BotonSalir />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 py-10">
        <section className="rounded-2xl bg-tarjeta p-6 shadow-sm ring-1 ring-borde sm:p-8">
          <p className="text-xs font-semibold tracking-[0.16em] text-acento uppercase">
            Sesión iniciada
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-texto">
            Hola, {perfil.nombre}
          </h1>
          <p className="mt-2 text-sm text-tenue">
            Rol: <strong className="text-texto">{perfil.rol}</strong> · Correo:{" "}
            {user.email}
          </p>

          <div className="mt-8 rounded-xl border border-dashed border-borde bg-superficie-clara p-6">
            <p className="text-sm font-semibold text-texto">
              Panel en construcción
            </p>
            <p className="mt-1 text-sm leading-6 text-tenue">
              Aquí se agregarán los módulos de solicitudes de compra,
              mantenimiento, descarte y las auditorías 5S, de seguridad y de
              cómputo.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
