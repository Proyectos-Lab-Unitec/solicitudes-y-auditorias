import Link from "next/link";
import { FiInbox, FiShoppingCart, FiTool, FiTrash2 } from "react-icons/fi";
import type { IconType } from "react-icons";
import { requireModulo } from "@/lib/auth";

export const metadata = {
  title: "Solicitudes | Gestión de Laboratorios",
};

type Tipo = {
  titulo: string;
  descripcion: string;
  icono: IconType;
};

const TIPOS: Tipo[] = [
  {
    titulo: "Compras",
    descripcion: "Revisa, cotiza y aprueba las solicitudes de compra.",
    icono: FiShoppingCart,
  },
  {
    titulo: "Mantenimiento",
    descripcion: "Convierte solicitudes en órdenes y da seguimiento.",
    icono: FiTool,
  },
  {
    titulo: "Descarte",
    descripcion: "Revisa las solicitudes de baja y sus documentos.",
    icono: FiTrash2,
  },
];

export default async function SolicitudesPage() {
  await requireModulo("solicitudes");

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-tarjeta p-6 shadow-sm ring-1 ring-borde sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-superficie-clara text-acento">
            <FiInbox className="size-6" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.16em] text-acento uppercase">
              Administración
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-texto">
              Bandeja de solicitudes
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-tenue">
              Aquí el administrador revisa, aprueba, devuelve o rechaza las
              solicitudes que generan los usuarios.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {TIPOS.map((tipo) => {
          const Icono = tipo.icono;

          return (
            <div
              key={tipo.titulo}
              className="rounded-2xl bg-tarjeta p-5 shadow-sm ring-1 ring-borde"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-superficie-clara text-acento">
                  <Icono className="size-5" />
                </span>
                <span className="rounded-full bg-superficie-clara px-2.5 py-1 text-[10px] font-semibold tracking-wider text-tenue uppercase">
                  Pronto
                </span>
              </div>
              <h2 className="mt-4 text-base font-semibold text-texto">
                {tipo.titulo}
              </h2>
              <p className="mt-1 text-sm leading-6 text-tenue">
                {tipo.descripcion}
              </p>
            </div>
          );
        })}
      </section>

      <p className="text-sm text-tenue">
        Mientras tanto, las cuentas se administran en{" "}
        <Link
          href="/panel/usuarios"
          className="font-semibold text-acento transition hover:text-superficie-azul"
        >
          Usuarios
        </Link>
        .
      </p>
    </div>
  );
}
