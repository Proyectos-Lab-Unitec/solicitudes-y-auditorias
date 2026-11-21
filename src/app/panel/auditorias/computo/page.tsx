import { FiMonitor } from "react-icons/fi";
import { requireModulo } from "@/lib/auth";

export const instant = false;

export const metadata = {
  title: "Auditorías de cómputo | Gestión de Laboratorios",
};

const CAPACIDADES = [
  "Registrar los laboratorios de cómputo existentes.",
  "Definir los ítems que se revisan: hardware, software, conectividad y seguridad física.",
  "Crear el registro de auditoría de cada día para cada laboratorio.",
  "Marcar cada ítem y adjuntar evidencias.",
  "Consultar el histórico por laboratorio y por fecha.",
];

export default async function AuditoriasComputoPage() {
  await requireModulo("auditorias-computo");

  return (
    <section className="rounded-2xl bg-tarjeta p-6 shadow-sm ring-1 ring-borde sm:p-8">
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-superficie-clara text-acento">
          <FiMonitor className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.16em] text-acento uppercase">
            Módulo del rol Checklist
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-texto">
            Auditorías de cómputo
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-tenue">
            Aquí el rol <strong>Checklist</strong> administra los laboratorios de
            cómputo y registra la revisión diaria de cada uno.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {CAPACIDADES.map((capacidad) => (
          <div
            key={capacidad}
            className="flex items-start gap-3 rounded-xl border border-borde bg-superficie-clara p-4"
          >
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-acento text-[11px] font-bold text-white">
              ✓
            </span>
            <p className="text-sm leading-6 text-texto">{capacidad}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-borde bg-superficie-clara p-6 text-center">
        <p className="text-sm font-semibold text-texto">
          Este módulo está en la siguiente fase
        </p>
        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-tenue">
          Solo el rol Checklist podrá crear y editar. Los roles Admin y
          Consultor podrán revisar los reportes en modo lectura.
        </p>
      </div>
    </section>
  );
}
