# ⚙️ Archivos de Configuración del Sistema – SinercIA ERP + IA

Este documento explica los archivos de configuración ubicados en la raíz del proyecto. Son fundamentales para el correcto funcionamiento del frontend (Next.js + TailwindCSS), backend (TypeScript + Prisma), y herramientas auxiliares.

---

## 📁 Archivos Principales

| Archivo | Descripción |
|--------|-------------|
| `tsconfig.json` | Configura el compilador TypeScript (importaciones, validaciones, alias `@/`). |
| `postcss.config.mjs` | Carga los plugins de PostCSS como TailwindCSS. Necesario para estilos. |
| `tailwind.config.ts` | Define colores, fuentes, breakpoints y otras utilidades de diseño. |
| `next.config.ts` | Configuración general de Next.js (dominios de imágenes, rutas, SSR, etc.). |
| `eslint.config.mjs` | Reglas de linting para mantener código limpio y consistente. |

---

## 🧠 ¿Por qué están todos en la raíz?

Next.js, Tailwind, TypeScript y ESLint buscan sus archivos de configuración directamente en el root del proyecto. Si los movés, puede que dejen de funcionar o requieran configuración extra no recomendada.

---

## 📝 Recomendación

No mover ninguno de estos archivos a `/config/`.  
Sí se puede documentarlos aquí o referenciarlos desde un README por tema si el equipo crece.

---

## 🚀 ¿Qué hacen juntos?

- `tsconfig.json` → controla el lenguaje (cómo se interpreta tu código).
- `tailwind.config.ts` + `postcss.config.mjs` → controlan el diseño visual.
- `eslint.config.mjs` → controla la calidad y estilo del código.
- `next.config.ts` → controla cómo se comporta tu sistema al compilar y servir.

---

Este conjunto de archivos es el “motor invisible” que hace que todo compile, se vea bien, y funcione con velocidad y buenas prácticas.

