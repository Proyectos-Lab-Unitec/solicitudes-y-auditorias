import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Perfil, Rol } from "@/lib/types";
import { NuevoUsuarioForm } from "./nuevo-usuario";
import { UsuarioAcciones } from "./usuario-acciones";

export const instant = false;

export const metadata = { title: "Usuarios | Gestión de Laboratorios" };

type UsuarioAdmin = Perfil & { creado_en: string | null };

const ETIQUETA_ROL: Record<Rol, string> = {
  admin: "Administrador",
  usuario: "Usuario",
  consulta: "Consulta",
};

function BadgeRol({ rol }: { rol: Rol }) {
  const estilos: Record<Rol, string> = {
    admin: "bg-blue-50 text-blue-700 ring-blue-100",
    usuario: "bg-slate-100 text-slate-700 ring-slate-200",
    consulta: "bg-purple-50 text-purple-700 ring-purple-100",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${estilos[rol]}`}
    >
      {ETIQUETA_ROL[rol]}
    </span>
  );
}

function BadgeEstado({ activo }: { activo: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
        activo
          ? "bg-green-50 text-green-700 ring-green-100"
          : "bg-amber-50 text-amber-700 ring-amber-100"
      }`}
    >
      {activo ? "Activo" : "Pendiente"}
    </span>
  );
}

function formatearFecha(valor: string | null) {
  if (!valor) return "—";

  return new Intl.DateTimeFormat("es-SV", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(valor));
}

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; rol?: string }>;
}) {
  await connection();
  const adminActual = await requireAdmin();
  const params = await searchParams;

  const busqueda = (params.q ?? "").trim();
  const rolFiltro: Rol | "" =
    params.rol === "admin" || params.rol === "usuario" || params.rol === "consulta"
      ? params.rol
      : "";

  let todos: UsuarioAdmin[] = [];
  let errorCarga = "";

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("perfiles")
      .select("id, nombre, correo, rol, activo, area, creado_en")
      .order("creado_en", { ascending: false });

    if (error) {
      errorCarga = error.message;
    } else {
      todos = (data ?? []) as UsuarioAdmin[];
    }
  } catch (error) {
    errorCarga =
      error instanceof Error
        ? error.message
        : "No se pudo conectar con la administración de usuarios.";
  }

  const q = busqueda.toLowerCase();
  const usuarios = todos.filter((usuario) => {
    const coincideTexto =
      !q ||
      usuario.nombre.toLowerCase().includes(q) ||
      usuario.correo.toLowerCase().includes(q);
    const coincideRol = !rolFiltro || usuario.rol === rolFiltro;
    return coincideTexto && coincideRol;
  });

  const resumen = {
    total: todos.length,
    activos: todos.filter((usuario) => usuario.activo).length,
    pendientes: todos.filter((usuario) => !usuario.activo).length,
    admins: todos.filter((usuario) => usuario.rol === "admin").length,
  };

  const hayFiltros = Boolean(busqueda || rolFiltro);

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-acento uppercase">
            Administración
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-texto">
            Usuarios
          </h1>
          <p className="mt-1 text-sm text-tenue">
            Aprueba cuentas, asigna roles y controla el acceso al sistema.
          </p>
        </div>
        <p className="text-sm text-tenue">
          Mostrando <strong className="text-texto">{usuarios.length}</strong> de{" "}
          {resumen.total}
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { etiqueta: "Total", valor: resumen.total },
          { etiqueta: "Activos", valor: resumen.activos },
          { etiqueta: "Pendientes", valor: resumen.pendientes },
          { etiqueta: "Administradores", valor: resumen.admins },
        ].map((item) => (
          <div
            key={item.etiqueta}
            className="rounded-xl bg-tarjeta px-4 py-3 shadow-sm ring-1 ring-borde"
          >
            <p className="text-[11px] font-semibold tracking-wider text-tenue uppercase">
              {item.etiqueta}
            </p>
            <p className="mt-1 text-2xl font-bold text-texto">{item.valor}</p>
          </div>
        ))}
      </section>

      {errorCarga && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          No se pudieron cargar los usuarios: {errorCarga}
        </p>
      )}

      <NuevoUsuarioForm />

      <form className="flex flex-col gap-3 rounded-2xl bg-tarjeta p-4 shadow-sm ring-1 ring-borde sm:flex-row sm:items-center">
        <input
          name="q"
          defaultValue={busqueda}
          placeholder="Buscar por nombre o correo"
          className="w-full flex-1 rounded-lg border border-borde bg-white px-3 py-2.5 text-sm text-texto outline-none transition focus:border-superficie-azul focus:ring-2 focus:ring-superficie-azul/20"
        />
        <select
          name="rol"
          defaultValue={rolFiltro}
          className="rounded-lg border border-borde bg-white px-3 py-2.5 text-sm text-texto outline-none transition focus:border-superficie-azul focus:ring-2 focus:ring-superficie-azul/20"
        >
          <option value="">Todos los roles</option>
          <option value="admin">Administrador</option>
          <option value="usuario">Usuario</option>
          <option value="consulta">Consulta</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-superficie-azul px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-acento"
        >
          Buscar
        </button>
        {hayFiltros && (
          <a
            href="/panel/usuarios"
            className="text-center text-sm font-medium text-acento hover:text-superficie-azul"
          >
            Limpiar
          </a>
        )}
      </form>

      <div className="overflow-hidden rounded-2xl bg-tarjeta shadow-sm ring-1 ring-borde">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-superficie-clara text-[11px] tracking-wider text-tenue uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Correo</th>
                <th className="px-4 py-3 font-semibold">Rol</th>
                <th className="px-4 py-3 font-semibold">Área</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Creado</th>
                <th className="px-4 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr
                  key={usuario.id}
                  className="border-t border-borde transition-colors hover:bg-superficie-clara/60"
                >
                  <td className="px-4 py-3 font-medium text-texto">
                    {usuario.nombre}
                  </td>
                  <td className="px-4 py-3 text-tenue">{usuario.correo}</td>
                  <td className="px-4 py-3">
                    <BadgeRol rol={usuario.rol} />
                  </td>
                  <td className="px-4 py-3 text-tenue">
                    {usuario.area || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <BadgeEstado activo={usuario.activo} />
                  </td>
                  <td className="px-4 py-3 text-xs text-tenue">
                    {formatearFecha(usuario.creado_en)}
                  </td>
                  <td className="px-4 py-3">
                    <UsuarioAcciones
                      id={usuario.id}
                      nombre={usuario.nombre}
                      rol={usuario.rol}
                      activo={usuario.activo}
                      esPropio={usuario.id === adminActual.id}
                    />
                  </td>
                </tr>
              ))}

              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <p className="text-sm font-medium text-texto">
                      No hay usuarios que coincidan
                    </p>
                    <p className="mt-1 text-sm text-tenue">
                      Prueba con otra búsqueda o limpia los filtros.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
