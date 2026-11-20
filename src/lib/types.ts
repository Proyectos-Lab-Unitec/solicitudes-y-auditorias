export type Rol = "admin" | "usuario" | "consultor" | "checklist";

export type Perfil = {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  activo: boolean;
  area: string | null;
};

export type EstadoAccion = {
  ok: boolean;
  error?: string;
  mensaje?: string;
};
