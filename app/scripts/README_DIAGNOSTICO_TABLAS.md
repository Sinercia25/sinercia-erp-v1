# 📊 Diagnóstico de Tablas – Supabase vs Data Warehouse

Este módulo contiene dos scripts clave para auditar la integridad de los datos entre la base operativa (**Supabase**) y el Data Warehouse (**DWH**) de análisis.

---

## 📁 Ubicación sugerida
```
/scripts/diagnostico/sync/
```

---

## 🧪 Scripts disponibles

### 1. `verificarTablasSync.js` (diagnóstico rápido)
**Objetivo:** Comparación general entre Supabase y DWH.

- Conecta a ambas bases.
- Lista todas las tablas de Supabase.
- Verifica si existen en el DWH.
- Muestra cantidad de registros en ambas.
- Detecta desfases o faltantes simples.

**Uso:**
```bash
node verificarTablasSync.js
```

**Cuándo usarlo:** Diagnóstico rápido, validaciones diarias o en procesos automáticos.

---

### 2. `verificarIntegridadTablas.js` (análisis profundo)
**Objetivo:** Validación exhaustiva de sincronización.

- Analiza tabla por tabla con filtros por `empresaId`.
- Detecta faltantes, diferencias, desincronización.
- Muestra campos clave si es tabla crítica (ej: facturas).
- Clasifica las faltantes en críticas vs secundarias.
- Sugiere próximas acciones.

**Uso:**
```bash
node verificarIntegridadTablas.js
```

**Cuándo usarlo:** Antes de demos, revisiones técnicas, control de calidad semanal o auditorías.

---

## 🔐 Seguridad

Ambos scripts requieren tener configurado un archivo `.env` con las siguientes variables:

```env
# Supabase
SUPABASE_HOST=
SUPABASE_PORT=
SUPABASE_DB=
SUPABASE_USER=
SUPABASE_PASS=

# Data Warehouse
DWH_HOST=
DWH_PORT=
DWH_NAME=
DWH_USER=
DWH_PASSWORD=
```

---

## 📌 Recomendaciones

- Ejecutar `verificarIntegridadTablas.js` al menos una vez por semana.
- Automatizar `verificarTablasSync.js` cada día o antes de sincronizar.
- Mantener logs de los resultados para trazabilidad.

