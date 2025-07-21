// lib/conversation-memory.ts
// 📚 SISTEMA DE MEMORIA CONVERSACIONAL AVANZADO

interface ConversationEntry {
  timestamp: Date
  userMessage: string
  botResponse: string
  context: string
}

interface UserSession {
  userId: string
  conversation: ConversationEntry[]
  lastActivity: Date
}

const conversationMemory = new Map<string, UserSession>()

export class ConversationMemoryManager {
  
  // Guardar nueva entrada en memoria
  static saveInteraction(userId: string, userMessage: string, botResponse: string, context: string) {
    const session = conversationMemory.get(userId) || {
      userId,
      conversation: [],
      lastActivity: new Date()
    }

    session.conversation.push({
      timestamp: new Date(),
      userMessage,
      botResponse,
      context
    })

    // Solo guardar las últimas 15 interacciones
    if (session.conversation.length > 15) {
      session.conversation = session.conversation.slice(-15)
    }

    session.lastActivity = new Date()
    conversationMemory.set(userId, session)
  }

  // Contexto de las últimas interacciones
  static getConversationContext(userId: string): string {
    const session = conversationMemory.get(userId)
    if (!session || session.conversation.length === 0) {
      return "Esta es una nueva conversación."
    }

    const recent = session.conversation.slice(-3)
    let context = "\n=== CONTEXTO DE CONVERSACIÓN ===\n"
    recent.forEach((entry, index) => {
      context += `${index + 1}. Usuario: "${entry.userMessage}" (Tema: ${entry.context})\n`
    })
    return context
  }

  // Último mensaje del usuario
  static getLastUserMessage(userId: string): string | null {
    const session = conversationMemory.get(userId)
    if (!session || session.conversation.length === 0) return null
    return session.conversation[session.conversation.length - 1].userMessage
  }

  // Último tema detectado
  static getLastTopic(userId: string): string {
    const session = conversationMemory.get(userId)
    if (!session || session.conversation.length === 0) return 'general'
    return session.conversation[session.conversation.length - 1].context
  }

  // Clasificar tema por palabras clave o contexto previo
  static detectContext(message: string, userId?: string): string {
    const msg = message.toLowerCase()

    const reglas = [
      { keywords: ['vendí', 'vendimos', 'facturé', 'ingresos'], context: 'ventas' },
      { keywords: ['lote', 'hectárea', 'campo'], context: 'lotes' },
      { keywords: ['máquina', 'maquina', 'tractor', 'cosechadora'], context: 'maquinas' },
      { keywords: ['empleado', 'sueldo', 'personal'], context: 'personal' },
      { keywords: ['cheque', 'vencimiento'], context: 'cheques' }
    ]

    for (const regla of reglas) {
      if (regla.keywords.some(k => msg.includes(k))) {
        return regla.context
      }
    }

    // Si la pregunta es contextual (“y el mes pasado?”, “dame más”)
    if (msg.includes('y el') || msg.includes('anterior') || msg.includes('otro') || msg.includes('más')) {
      return userId ? this.getLastTopic(userId) : 'general'
    }

    return 'general'
  }

  static getLastContext(userId: string): string {
  const session = conversationMemory.get(userId)
  if (!session || session.conversation.length === 0) return 'general'
  return session.conversation[session.conversation.length - 1].context
}

  
  // Función para modo aprendizaje: guardar nuevas palabras aprendidas (opcional)
  static async learnNewTerm(palabra: string, definicion: string) {
    console.log(`🧠 Aprendido: ${palabra} = ${definicion}`)
    // Futuro: insertar en Supabase
  }
}
