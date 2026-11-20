import Link from "next/link";
import { connection } from "next/server";
import {
  FiCheckSquare,
  FiInbox,
  FiMonitor,
  FiShield,
  FiShoppingCart,
  FiTool,
  FiTrash2,
  FiUsers,
} from "react-icons/fi";
import type { IconType } from "react-icons";
import { requirePerfil } from "@/lib/auth";
import {
  DESCRIPCION_ROL,
  ETIQUETA_ROL,
  puedeVerModulo,
  type Modulo,
} from "@/lib/roles";

export const instant = false;

type Tarjeta = {
  modulo: Modulo;
  href: string;
  titulo: string;
  descripcion: string;
  icono: IconType;
  listo: boolean;
};

const TARJETAS: Tarjeta[] = [
  {
    modulo: "usuarios",
    href: "/panel/usuarios",
    titulo: "Usuarios",
    descripcion: "Aprueba cuentas, asigna roles y administra el acceso.",
    icono: FiUsers,
    listo: true,
  },
  {
    modulo: "solicitudes",
    href: "/panel/solicitudes",
    titulo: "Solicitudes",
    descripcion:
      "Revisa y aprueba las solicitudes de compra, mantenimiento y descarte.",
    icono: FiInbox,
    listo: false,
  },
  {
    modulo: "compras",
    href: "/panel/compras",
    titulo: "Solicitudes de compra",
    descripcion: "Solicita ítems, revisa cotizaciones y da seguimiento.",
    icono: FiShoppingCart,
    listo: false,
  },
  {
    modulo: "mantenimiento",
    href: "/panel/mantenimiento",
    titulo: "Mantenimiento",
    descripcion: "Reporta fallas y gestiona órdenes de trabajo.",
    icono: FiTool,
    listo: false,
  },
  {
    modulo: "descarte",
    href: "/panel/descarte",
    titulo: "Descarte",
    descripcion: "Solicita la baja de activos y genera la carta y el AF-02.",
    icono: FiTrash2,
    listo: false,
  },
  {
    modulo: "auditorias-5s",
    href: "/panel/auditorias/5s",
    titulo: "Auditorías 5S",
    descripcion: "Ejecuta auditorías 5S con criterios editables.",
    icono: FiCheckSquare,
    listo: false,
  },
  {
    modulo: "auditorias-seguridad",
    href: "/panel/auditorias/seguridad",
    titulo: "Auditorías de seguridad",
    descripcion: "Audita actos y condiciones inseguras por laboratorio.",
    icono: FiShield,
    listo: false,
  },
  {
    modulo: "auditorias-computo",
    href: "/panel/auditorias/computo",
    titulo: "Auditorías de cómputo",
    descripcion:
      "Registra laboratorios, ítems revisados y auditorías diarias.",
    icono: FiMonitor,
    listo: false,
  },
];

export default async function PanelPage() {
  await connection();
  const perfil = await requirePerfil();

  const tarjetas = TARJETAS.filter((tarjeta) =>
    puedeVerModulo(perfil.rol, tarjeta.modulo)
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-tarjeta p-6 shadow-sm ring-1 ring-borde sm:p-8">
        <p className="text-xs font-semibold tracking-[0.16em] text-acento uppercase">
          Panel
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-texto">
          Hola, {perfil.nombre}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-tenue">
          {DESCRIPCION_ROL[perfil.rol]}. Los módulos disponibles dependen de tu
          rol y se irán habilitando por fases.
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-superficie-clara px-3 py-1 text-tenue">
            Correo: {perfil.correo}
          </span>
          <span className="rounded-full bg-superficie-clara px-3 py-1 text-tenue">
            Rol: {ETIQUETA_ROL[perfil.rol]}
          </span>
          {perfil.area && (
            <span className="rounded-full bg-superficie-clara px-3 py-1 text-tenue">
              Área: {perfil.area}
            </span>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tarjetas.map((tarjeta) => {
          const Icono = tarjeta.icono;

          return (
            <Link
              key={tarjeta.modulo}
              href={tarjeta.href}
              className="group flex flex-col rounded-2xl bg-tarjeta p-5 shadow-sm ring-1 ring-borde transition hover:-translate-y-0.5 hover:shadow-md hover:ring-acento/40"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-superficie-clara text-acento transition group-hover:bg-acento group-hover:text-white">
                  <Icono className="size-5" />
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase ${
                    tarjeta.listo
                      ? "bg-green-50 text-green-700"
                      : "bg-superficie-clara text-tenue"
                  }`}
                >
                  {tarjeta.listo ? "Disponible" : "Pronto"}
                </span>
              </div>
              <h2 className="mt-4 text-base font-semibold text-texto">
                {tarjeta.titulo}
              </h2>
              <p className="mt-1 text-sm leading-6 text-tenue">
                {tarjeta.descripcion}
              </p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
