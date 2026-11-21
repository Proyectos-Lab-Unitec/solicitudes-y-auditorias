"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiCheckSquare,
  FiHome,
  FiInbox,
  FiLogOut,
  FiMenu,
  FiMonitor,
  FiShield,
  FiShoppingCart,
  FiTool,
  FiTrash2,
  FiUsers,
  FiX,
} from "react-icons/fi";
import type { IconType } from "react-icons";
import { ETIQUETA_ROL, puedeVerModulo, type Modulo } from "@/lib/roles";
import { createClient } from "@/lib/supabase/client";
import { conTimeout } from "@/lib/tiempo";
import type { Perfil } from "@/lib/types";

type Item = {
  href: string;
  label: string;
  icono: IconType;
  modulo?: Modulo;
  exacto?: boolean;
  pronto?: boolean;
};

export function PanelShell({
  perfil,
  children,
}: {
  perfil: Perfil;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  const todos: Item[] = [
    { href: "/panel", label: "Panel", icono: FiHome, exacto: true },
    {
      modulo: "usuarios",
      href: "/panel/usuarios",
      label: "Usuarios",
      icono: FiUsers,
    },
    {
      modulo: "solicitudes",
      href: "/panel/solicitudes",
      label: "Solicitudes",
      icono: FiInbox,
      pronto: true,
    },
    {
      modulo: "compras",
      href: "/panel/compras",
      label: "Compras",
      icono: FiShoppingCart,
      pronto: true,
    },
    {
      modulo: "mantenimiento",
      href: "/panel/mantenimiento",
      label: "Mantenimiento",
      icono: FiTool,
      pronto: true,
    },
    {
      modulo: "descarte",
      href: "/panel/descarte",
      label: "Descarte",
      icono: FiTrash2,
      pronto: true,
    },
    {
      modulo: "auditorias-5s",
      href: "/panel/auditorias/5s",
      label: "Auditorías 5S",
      icono: FiCheckSquare,
      pronto: true,
    },
    {
      modulo: "auditorias-seguridad",
      href: "/panel/auditorias/seguridad",
      label: "Auditorías de seguridad",
      icono: FiShield,
      pronto: true,
    },
    {
      modulo: "auditorias-computo",
      href: "/panel/auditorias/computo",
      label: "Auditorías de cómputo",
      icono: FiMonitor,
      pronto: true,
    },
  ];

  const items = todos.filter(
    (item) => !item.modulo || puedeVerModulo(perfil.rol, item.modulo)
  );

  async function salir() {
    if (saliendo) return;
    setSaliendo(true);

    try {
      const supabase = createClient();

      try {
        await conTimeout(supabase.auth.signOut(), 5_000);
      } catch {
        // Si el servidor no responde, al menos se limpia la sesión local.
        await supabase.auth.signOut({ scope: "local" }).catch(() => {});
      }
    } catch {
      // Si ni siquiera se pudo crear el cliente, igual se sale de la vista.
    } finally {
      // Recarga completa: evita que el layout anterior quede en "Saliendo…".
      window.location.replace("/login");
    }
  }

  function estaActivo(item: Item) {
    return item.exacto ? pathname === item.href : pathname.startsWith(item.href);
  }

  return (
    <div className="min-h-dvh bg-superficie-clara">
      {abierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setAbierto(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-superficie-azul text-white transition-transform duration-200 lg:translate-x-0 ${
          abierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
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
              Coordinación de Ingeniería
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAbierto(false)}
            className="ml-auto rounded-md p-1 text-blue-200 hover:bg-white/10 lg:hidden"
            aria-label="Cerrar menú"
          >
            <FiX className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => {
            const Icono = item.icono;
            const actual = estaActivo(item);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setAbierto(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  actual
                    ? "bg-white/15 font-semibold text-white"
                    : "text-blue-200 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icono className="size-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.pronto && (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-acento-claro">
                    Pronto
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="mb-2 rounded-lg bg-white/5 p-3">
            <p className="truncate text-sm font-semibold">{perfil.nombre}</p>
            <p className="truncate text-[11px] text-acento-claro">
              {perfil.correo}
            </p>
            <p className="mt-1 text-[10px] font-medium tracking-wider text-blue-300 uppercase">
              {ETIQUETA_ROL[perfil.rol]}
            </p>
          </div>
          <button
            type="button"
            onClick={salir}
            disabled={saliendo}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-blue-200 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-60"
          >
            <FiLogOut className="size-4" />
            {saliendo ? "Saliendo…" : "Cerrar sesión"}
          </button>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-borde bg-tarjeta px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setAbierto(true)}
            className="rounded-lg p-2 text-tenue hover:bg-superficie-clara lg:hidden"
            aria-label="Abrir menú"
          >
            <FiMenu className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-texto">
              Panel de gestión
            </p>
            <p className="truncate text-[11px] text-tenue">
              Coordinación de Laboratorios de Ingeniería · UNITEC
            </p>
          </div>
          <span className="hidden rounded-full bg-superficie-clara px-3 py-1 text-xs font-medium text-tenue sm:inline">
            Rol: {ETIQUETA_ROL[perfil.rol]}
          </span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
