import Image from "next/image";

const MODULOS = [
  { codigo: "SC", nombre: "Compras" },
  { codigo: "SM", nombre: "Mantenimiento" },
  { codigo: "SD", nombre: "Descarte" },
  { codigo: "A5S", nombre: "Auditorías 5S" },
  { codigo: "AS", nombre: "Seguridad" },
  { codigo: "AC", nombre: "Cómputo" },
];

/**
 * Marco visual compartido por las pantallas de acceso.
 *
 * En escritorio es una mesa de trabajo: contexto institucional a la izquierda
 * y el formulario a la derecha. En móvil se reduce a la tarjeta.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-fondo text-white">
      <div aria-hidden className="absolute inset-0 rejilla-tecnica opacity-50" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 90% at 85% 0%, rgba(15, 73, 182, 0.55), transparent 58%), radial-gradient(55% 75% at 5% 100%, rgba(4, 4, 46, 0.92), transparent 62%)",
        }}
      />

      <div className="relative mx-auto grid min-h-dvh w-full max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8">
        {/* Contexto institucional */}
        <section className="hidden lg:block">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
              <Image
                src="/unitec-logo.png"
                alt="UNITEC"
                width={32}
                height={32}
                priority
                className="size-8"
              />
            </span>
            <div>
              <p className="etiqueta-tecnica text-[9px] text-acento-claro">
                UNITEC · Laboratorios de Ingeniería
              </p>
              <p className="text-sm text-blue-100/70">
                Coordinación de Laboratorios
              </p>
            </div>
          </div>

          <p className="etiqueta-tecnica mt-20 text-[9px] text-acento-claro">
            Sistema interno · 2026
          </p>
          <h1 className="mt-4 max-w-lg text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-white xl:text-5xl">
            El registro técnico de los laboratorios.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-blue-100/70 sm:text-base">
            Solicitudes de compra, mantenimiento y descarte. Auditorías 5S, de
            seguridad y de cómputo. Un solo acceso institucional.
          </p>

          <div className="mt-12 max-w-lg border-t border-white/15 pt-6">
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {MODULOS.map((modulo) => (
                <div
                  key={modulo.codigo}
                  className="flex items-baseline gap-3 border-b border-white/5 pb-2"
                >
                  <span className="etiqueta-tecnica w-8 shrink-0 text-[9px] text-acento-claro">
                    {modulo.codigo}
                  </span>
                  <span className="text-xs text-blue-100/70">
                    {modulo.nombre}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Formulario */}
        <section className="mx-auto w-full max-w-md">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <Image
              src="/unitec-logo.png"
              alt="UNITEC"
              width={36}
              height={36}
              priority
              className="size-9 rounded-lg bg-white/10 p-1 ring-1 ring-white/15"
            />
            <div>
              <p className="text-sm font-semibold text-white">
                Gestión de Laboratorios
              </p>
              <p className="etiqueta-tecnica text-[9px] text-acento-claro">
                UNITEC · Coordinación
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-tarjeta p-6 text-texto shadow-2xl shadow-black/30 sm:p-8">
            <div className="mb-5 flex items-center justify-between">
              <span className="h-0.5 w-10 bg-acento" />
              <span className="etiqueta-tecnica text-[9px] text-tenue">
                Acceso
              </span>
            </div>
            {children}
          </div>

          <p className="etiqueta-tecnica mt-5 text-center text-[9px] text-blue-200/60">
            Acceso institucional · UNITEC
          </p>
        </section>
      </div>
    </div>
  );
}
