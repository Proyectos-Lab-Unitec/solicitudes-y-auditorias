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
  codigo: string;
  href: string;
  titulo: string;
  descripcion: string;
  icono: IconType;
  listo: boolean;
};

const TARJETAS: Tarjeta[] = [
  {
    modulo: "usuarios",
    codigo: "USR",
    href: "/panel/usuarios",
    titulo: "Usuarios",
    descripcion: "Aprueba cuentas, asigna roles y administra el acceso.",
    icono: FiUsers,
    listo: true,
  },
  {
    modulo: "solicitudes",
    codigo: "SOL",
    href: "/panel/solicitudes",
    titulo: "Solicitudes",
    descripcion:
      "Revisa y aprueba las solicitudes de compra, mantenimiento y descarte.",
    icono: FiInbox,
    listo: false,
  },
  {
    modulo: "compras",
    codigo: "SC",
    href: "/panel/compras",
    titulo: "Solicitudes de compra",
    descripcion: "Solicita ítems, revisa cotizaciones y da seguimiento.",
    icono: FiShoppingCart,
    listo: false,
  },
  {
    modulo: "mantenimiento",
    codigo: "SM",
    href: "/panel/mantenimiento",
    titulo: "Mantenimiento",
    descripcion: "Reporta fallas y gestiona órdenes de trabajo.",
    icono: FiTool,
    listo: false,
  },
  {
    modulo: "descarte",
    codigo: "SD",
    href: "/panel/descarte",
    titulo: "Descarte",
    descripcion: "Solicita la baja de activos y genera la carta y el AF-02.",
    icono: FiTrash2,
    listo: false,
  },
  {
    modulo: "auditorias-5s",
    codigo: "A5S",
    href: "/panel/auditorias/5s",
    titulo: "Auditorías 5S",
    descripcion: "Ejecuta auditorías 5S con criterios editables.",
    icono: FiCheckSquare,
    listo: false,
  },
  {
    modulo: "auditorias-seguridad",
    codigo: "AS",
    href: "/panel/auditorias/seguridad",
    titulo: "Auditorías de seguridad",
    descripcion: "Audita actos y condiciones inseguras por laboratorio.",
    icono: FiShield,
    listo: false,
  },
  {
    modulo: "auditorias-computo",
    codigo: "AC",
    href: "/panel/auditorias/computo",
    titulo: "Auditorías de cómputo",
    descripcion:
      "Registra laboratorios, ítems revisados y auditorías diarias.",
    icono: FiMonitor,
    listo: true,
  },
];

export default async function PanelPage() {
  await connection();
  const perfil = await requirePerfil();

  const tarjetas = TARJETAS.filter((tarjeta) =>
    puedeVerModulo(perfil.rol, tarjeta.modulo)
  ).sort((a, b) => Number(b.listo) - Number(a.listo));

  const fecha = new Intl.DateTimeFormat("es-SV", {
    dateStyle: "long",
    timeZone: "America/El_Salvador",
  }).format(new Date());

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-xl bg-fondo p-6 text-white shadow-lg sm:p-8">
        <div aria-hidden className="absolute inset-0 rejilla-tecnica opacity-40" />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-acento/40 blur-3xl"
        />

        <div className="relative flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-2xl">
            <p className="etiqueta-tecnica text-[9px] text-acento-claro">
              Panel · {ETIQUETA_ROL[perfil.rol]}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Hola, {perfil.nombre}.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100/75">
              {DESCRIPCION_ROL[perfil.rol]}. Los módulos disponibles dependen de
              tu rol y se irán habilitando por fases.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-blue-100/80">
                {perfil.correo}
              </span>
              {perfil.area && (
                <span className="rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-blue-100/80">
                  {perfil.area}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-end gap-3">
            <p className="text-5xl leading-none font-semibold tracking-tight text-white">
              {String(tarjetas.length).padStart(2, "0")}
            </p>
            <p className="etiqueta-tecnica pb-1 text-[9px] leading-4 text-acento-claro">
              módulos
              <br />
              asignados
            </p>
          </div>
        </div>

        <p className="etiqueta-tecnica relative mt-6 border-t border-white/10 pt-4 text-[9px] text-blue-200/60">
          {fecha} · Coordinación de Laboratorios de Ingeniería
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tarjetas.map((tarjeta, indice) => {
          const Icono = tarjeta.icono;
          const destacada = indice === 0 && tarjetas.length > 1;

          return (
            <Link
              key={tarjeta.modulo}
              href={tarjeta.href}
              className={`group flex min-h-[200px] flex-col rounded-xl border border-borde bg-tarjeta p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-acento/40 hover:shadow-md ${
                destacada ? "sm:col-span-2" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="etiqueta-tecnica text-[9px] text-tenue">
                  {tarjeta.codigo}
                </span>
                <span
                  className={`etiqueta-tecnica text-[9px] ${
                    tarjeta.listo ? "text-green-700" : "text-tenue"
                  }`}
                >
                  {tarjeta.listo ? "Disponible" : "En preparación"}
                </span>
              </div>

              <div className="mt-6 flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-superficie-clara text-acento transition group-hover:bg-acento group-hover:text-white">
                  <Icono className="size-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-texto">
                    {tarjeta.titulo}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-tenue">
                    {tarjeta.descripcion}
                  </p>
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-borde pt-3">
                <span className="etiqueta-tecnica text-[9px] text-tenue">
                  {tarjeta.listo ? "Abrir módulo" : "Próximamente"}
                </span>
                <span className="text-sm text-acento transition group-hover:translate-x-0.5">
                  →
                </span>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
