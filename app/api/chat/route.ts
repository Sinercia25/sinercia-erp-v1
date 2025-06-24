import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { PrismaClient } from '@prisma/client'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const prisma = new PrismaClient()

// Función para obtener contexto de la base de datos
async function obtenerContextoEmpresa() {
  try {
    // Obtener datos básicos de la empresa
    const empresa = await prisma.empresa.findFirst({
      include: {
        usuarios: true,
        lotes: {
          include: {
            cultivos: {
              include: {
                cosechas: true
              }
            }
          }
        },
        maquinas: {
          include: {
            trabajos: {
              take: 10,
              orderBy: { fecha: 'desc' }
            }
          }
        },
        productos: true,
        cheques: {
          where: {
            estado: 'pendiente'
          },
          orderBy: { fechaVencimiento: 'asc' }
        }
      }
    })

    if (!empresa) return "No hay datos de empresa disponibles."

    // Calcular métricas
    const totalCosechas = empresa.lotes.reduce((total, lote) => {
      return total + lote.cultivos.reduce((subtotal, cultivo) => {
        return subtotal + cultivo.cosechas.reduce((sum, cosecha) => sum + cosecha.toneladas, 0)
      }, 0)
    }, 0)

    const tchPromedio = empresa.lotes.reduce((total, lote) => {
      const cosechas = lote.cultivos.flatMap(c => c.cosechas)
      const avgTch = cosechas.length > 0 
        ? cosechas.reduce((sum, c) => sum + (c.tch || 0), 0) / cosechas.length 
        : 0
      return total + avgTch
    }, 0) / empresa.lotes.length

    return `
INFORMACIÓN DE LA EMPRESA:
- Nombre: ${empresa.nombre}
- CUIT: ${empresa.cuit}
- Ubicación: ${empresa.direccion}
- Condición Fiscal: ${empresa.condicionFiscal}

RESUMEN PRODUCTIVO:
- Total lotes: ${empresa.lotes.length}
- Superficie total: ${empresa.lotes.reduce((sum, l) => sum + l.superficieHectareas, 0)} hectáreas
- Producción total: ${totalCosechas.toFixed(0)} toneladas
- TCH promedio: ${tchPromedio.toFixed(1)}

LOTES:
${empresa.lotes.map(lote => `
- ${lote.nombre || lote.numero}: ${lote.superficieHectareas} ha
  Cultivos: ${lote.cultivos.map(c => `${c.tipoCultivo} (${c.variedad})`).join(', ')}
  Estado: ${lote.cultivos.map(c => c.estado).join(', ')}
`).join('')}

MAQUINARIA:
${empresa.maquinas.map(maq => `
- ${maq.nombre} (${maq.tipo}): ${maq.estado}
  Últimos trabajos: ${maq.trabajos.length} registros
`).join('')}

PRODUCTOS EN STOCK:
${empresa.productos.map(prod => `
- ${prod.nombre}: ${prod.categoria} (${prod.unidadMedida})
  Stock mínimo: ${prod.stockMinimo}
`).join('')}

CHEQUES PENDIENTES:
${empresa.cheques.map(cheque => `
- ${cheque.banco} #${cheque.numero}: $${cheque.importe.toLocaleString()}
  Vence: ${cheque.fechaVencimiento.toLocaleDateString()}
`).join('')}
`
  } catch (error) {
    console.error('Error obteniendo contexto:', error)
    return "Error al obtener datos de la empresa."
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 })
    }

    // Obtener contexto actualizado de la base de datos
    const contextoEmpresa = await obtenerContextoEmpresa()

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Eres SinercIA, un asistente IA especializado en gestión agrícola para productores cañeros y sojeros en Argentina. 

Tu personalidad:
- Profesional pero cercano y amigable
- Usás terminología argentina del sector agrícola
- Respondés de forma práctica y accionable
- Conocés bien el manejo de caña de azúcar y soja

DATOS ACTUALES DE LA EMPRESA:
${contextoEmpresa}

INSTRUCCIONES:
1. Respondé SOLO con información de la base de datos actual
2. Si no tenés el dato específico, decí que necesitás más información
3. Usá terminología técnica apropiada (TCH, zafra, hectáreas, etc.)
4. Proporcioná números específicos cuando estén disponibles
5. Sugerí acciones concretas cuando sea apropiado
6. Mantené un tono profesional pero accesible

EJEMPLOS DE RESPUESTAS:
- "Según los datos actuales, tenés X toneladas producidas esta zafra..."
- "El TCH promedio de tus lotes es X, lo cual está Y comparado con el promedio regional..."
- "Te sugiero revisar el lote X porque..."
`
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    })

    const respuesta = completion.choices[0]?.message?.content || "Lo siento, no pude procesar tu consulta."

    return NextResponse.json({ 
      message: respuesta,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error en chat API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
}

// Limpiar conexión de Prisma
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})