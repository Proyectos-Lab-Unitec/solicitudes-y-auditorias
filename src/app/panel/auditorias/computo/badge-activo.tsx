export function BadgeActivo({ activo }: { activo: boolean }) {
  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-[10px] font-semibold tracking-[0.08em] uppercase ring-1 ring-inset ${
        activo
          ? "bg-green-50 text-green-700 ring-green-100"
          : "bg-amber-50 text-amber-700 ring-amber-100"
      }`}
    >
      {activo ? "Activo" : "Inactivo"}
    </span>
  );
}
