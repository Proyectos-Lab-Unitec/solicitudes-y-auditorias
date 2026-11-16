import Image from "next/image";

/**
 * Marco visual compartido por las pantallas de acceso.
 *
 * Replica la identidad de LabHub y Asistencias: fondo azul institucional,
 * tarjeta blanca centrada y tipografía Geist.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-fondo px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 90% at 85% 0%, rgba(15, 73, 182, 0.65), transparent 60%), radial-gradient(55% 75% at 10% 100%, rgba(4, 4, 46, 0.9), transparent 65%)",
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
            <Image
              src="/unitec-logo.png"
              alt="UNITEC"
              width={36}
              height={36}
              priority
              className="size-9"
            />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Gestión de Laboratorios
          </h1>
          <p className="mt-2 text-sm text-acento-claro">
            Coordinación de Laboratorios de Ingeniería · UNITEC
          </p>
        </div>

        <div className="rounded-2xl bg-tarjeta p-6 shadow-2xl shadow-black/30 sm:p-8">
          {children}
        </div>

        <p className="mt-6 text-center text-xs text-acento-claro/80">
          Acceso exclusivo con correo institucional
        </p>
      </div>
    </div>
  );
}
