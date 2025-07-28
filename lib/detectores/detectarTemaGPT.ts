import { OpenAI } from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ""
})

/**
 * 🧠 detectarTemaConGPT
 * Usa GPT para detectar el módulo principal al que pertenece el mensaje del usuario.
 * Solo devuelve el nombre del módulo (ventas, finanzas, rrhh, etc.)
 */
export async function detectarTemaConGPT(mensaje: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `
Sos un clasificador experto dentro de un sistema ERP argentino.

Tu función es analizar el mensaje del usuario y asignarlo a **uno solo** de los siguientes módulos:

ventas, finanzas, ingresos, egresos, rrhh, maquinaria, stock, cheques, documentos, reportes, compras, clientes, afip, predicciones, soporte, general

📌 Reglas importantes:

- Respondé SOLO con el nombre del módulo, en minúsculas, sin comillas.
- Si no estás seguro, devolvé: general
- NO expliques tu decisión.

🔍 CASOS COMUNES:

• ventas → si el mensaje menciona:
  "vendimos", "ventas", "venta", "facturación", "cuánto facturamos", 
  "ticket promedio", "comparación de ventas", 
  "análisis de ventas", "cómo me fue en ventas", "resumen de ventas", 
  "¿cuánto vendimos este mes?", "ventas del mes pasado", "¿me podés hacer un resumen comercial?"

• finanzas → si menciona:
  "pagos", "gastos", "caja", "flujo de caja", "ingresos", "egresos"

• stock → si habla de:
  "inventario", "stock", "faltantes", "productos sin stock", "bajo mínimo"

• rrhh → si menciona:
  "empleados", "sueldos", "f931", "personal"

        `.trim()
      },
      {
        role: "user",
        content: mensaje
      }
    ]
  })

  return completion.choices[0].message?.content?.trim() || "general"
}
