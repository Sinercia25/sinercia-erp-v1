# 📚 Manual Técnico – SinercIA ERP + IA

Este documento actúa como índice maestro para la arquitectura del sistema. Cada módulo o carpeta técnica relevante contiene su propio `README.md` con explicaciones detalladas.

---

## 🔍 Índice de Carpetas Documentadas

| Carpeta | Descripción | Enlace |
|--------|-------------|--------|
| `/lib/dwh/` | Consultas estructuradas al Data Warehouse: ventas, finanzas, stock, etc. | [Ver README](../lib/dwh/README.md) |
| `/lib/cache/` | Cacheo con Redis de respuestas recientes (acelera IA) | [Ver README](../lib/cache/README.md) |
| `/lib/prompts/` | Prompts de IA por rubro, rol y módulo (base del CeoBot) | [Ver README](../lib/prompts/README.md) |
| `/scripts/diagnostico/` | Scripts para verificar integridad, tablas sincronizadas, etc. | [Ver README](../scripts/diagnostico/README.md) |
| `/scripts/sync/` | Automatización de sincronización Supabase → DWH | [Ver README](../scripts/sync/README.md) |
| `/scripts/seeds/` | Carga de datos de ejemplo para testing y demo | [Ver README](../scripts/seeds/README.md) |
| `/config/` | Configuraciones del sistema (`tsconfig`, ESLint, etc.) | [Ver README](../config/README.md) |
| `/app/api/chat-premium/` | API CeoBot con DWH + Redis (respuesta IA inteligente) | [Ver README](../app/api/chat-premium/README.md) |

---

## 📌 ¿Cómo usar esta documentación?

1. Ingresá a la carpeta que quieras consultar.
2. Abrí su archivo `README.md` para ver:
   - Qué hace esa parte del sistema.
   - Cómo usarla.
   - Qué archivos contiene.
   - Qué recomendaciones aplicar.

3. Si modificás funcionalidades, solo actualizá el README de **esa carpeta**.

---

## 🧠 Filosofía de Documentación

- Cada módulo se explica donde se encuentra.
- Este README sirve de guía general para navegar el sistema.
- Evitamos duplicar contenido para mantenerlo siempre actualizado.

---

## 📝 ¿Qué hacer si agregás una carpeta nueva?

1. Agregá un `README.md` en esa carpeta.
2. Sumá la entrada aquí arriba en la tabla de índice.

---

