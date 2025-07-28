// 🔹 lib/cache/cache.ts
// Módulo de Cache Inteligente - Controla la memoria temporal de respuestas IA

type CacheEntry = {
  value: string;         // La respuesta generada (ej: "Vendiste $123M")
  expiresAt: number;     // Timestamp en milisegundos cuando expira
}

// 📌 Cache simple en memoria (puede reemplazarse por Redis en producción)
const cache: Record<string, CacheEntry> = {}

/**
 * Guarda un valor en cache con una clave única y duración personalizada.
 * @param key Clave única del cache (ej: "ventas:emp_002:2025-07")
 * @param value Respuesta que se quiere guardar
 * @param ttl Tiempo de vida en milisegundos (ej: 600000 = 10 min)
 */
export function setCache(key: string, value: string, ttl: number) {
  const expiresAt = Date.now() + ttl
  cache[key] = { value, expiresAt }
}

/**
 * Recupera un valor del cache si no está vencido.
 * @param key Clave que se quiere consultar
 * @returns string | null
 */
export function getCache(key: string): string | null {
  const entry = cache[key]
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    delete cache[key] // Expiró, se borra
    return null
  }
  return entry.value
}

/**
 * Borra manualmente un valor del cache.
 * @param key Clave a eliminar
 */
export function invalidateCache(key: string) {
  delete cache[key]
}
