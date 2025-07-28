import { OpenAI } from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' })

export async function generarSugerenciaConGPT(
  modulo: string,
  resumen: any,
  mensajeUsuario: string
): Promise<string> {
  const prompt = `
Sos un asesor empresarial que ayuda a interpretar datos reales de una empresa.

El usuario pidió información sobre ${modulo}.
Estos son los datos reales disponibles:

${JSON.stringify(resumen, null, 2)}

Ayudalo con una sugerencia natural para seguir analizando.
No repitas lo que ya se dijo. Usá un tono humano y profesional.
Devolvé 1 sola frase concreta.
`.trim()

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.6,
    messages: [
      { role: 'system', content: 'Sos un asesor empresarial argentino, cálido y claro.' },
      { role: 'user', content: prompt }
    ]
  })

  return completion.choices[0].message?.content?.trim() || ''
}
