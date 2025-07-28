// 📁 /lib/memoriaConversacional/guardarContexto.ts

// 🧠 Manejador simple de memoria conversacional por usuario
type Registro = {
  mensaje: string;
  respuesta: string;
  contexto: string;
  timestamp: number;
};

// 🧠 Estructura temporal en memoria (en reemplazo de Redis o BD)
const memoriaPorUsuario: Record<string, Registro[]> = {};

// ✅ Guarda la interacción completa del usuario
export function guardarInteraccion(
  userId: string,
  mensaje: string,
  respuesta: string,
  contexto: string
) {
  const nuevoRegistro: Registro = {
    mensaje,
    respuesta,
    contexto,
    timestamp: Date.now()
  };

  if (!memoriaPorUsuario[userId]) {
    memoriaPorUsuario[userId] = [];
  }

  // Solo guarda los últimos 10 registros por usuario
  memoriaPorUsuario[userId].unshift(nuevoRegistro);
  memoriaPorUsuario[userId] = memoriaPorUsuario[userId].slice(0, 10);
}

// ✅ Devuelve el último mensaje del usuario
export function obtenerUltimoMensaje(userId: string): string | null {
  return memoriaPorUsuario[userId]?.[0]?.mensaje ?? null;
}

// ✅ Devuelve el último contexto registrado
export function obtenerUltimoTema(userId: string): string | null {
  return memoriaPorUsuario[userId]?.[0]?.contexto ?? null;
}
