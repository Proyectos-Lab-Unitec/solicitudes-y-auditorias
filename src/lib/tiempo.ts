export const TIMEOUT_MS = 20_000;

/**
 * Evita que un botón quede bloqueado para siempre si Supabase no responde.
 */
export async function conTimeout<T>(
  promesa: PromiseLike<T>,
  ms: number = TIMEOUT_MS
): Promise<T> {
  const real = Promise.resolve(promesa);
  let timer: ReturnType<typeof setTimeout> | undefined;

  const expira = new Promise<never>((_ok, ko) => {
    timer = setTimeout(
      () =>
        ko(
          new Error(
            "El servidor de autenticación no responde. Intenta nuevamente."
          )
        ),
      ms
    );
  });

  real.catch(() => {});

  try {
    return await Promise.race([real, expira]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
