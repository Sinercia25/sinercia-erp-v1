// lib/conversation-memory.ts
// TÍTULO: SISTEMA DE MEMORIA CONVERSACIONAL

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
  
  // TÍTULO: GUARDAR CADA INTERACCIÓN
  static saveInteraction(
    userId: string, 
    userMessage: string, 
    botResponse: string, 
    context: string
  ) {
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
    
    // Mantener solo últimas 10 conversaciones
    if (session.conversation.length > 10) {
      session.conversation = session.conversation.slice(-10)
    }
    
    session.lastActivity = new Date()
    conversationMemory.set(userId, session)
  }
  
  // TÍTULO: OBTENER CONTEXTO PARA LA IA
  static getConversationContext(userId: string): string {
    const session = conversationMemory.get(userId)
    if (!session || session.conversation.length === 0) {
      return "Esta es una nueva conversación."
    }
    
    const recent = session.conversation.slice(-3)
    let context = "\n=== CONTEXTO CONVERSACIÓN RECIENTE ===\n"
    
    recent.forEach((entry, index) => {
      context += `${index + 1}. Usuario: "${entry.userMessage}" (Tema: ${entry.context})\n`
    })
    
    return context
  }
  
  // TÍTULO: DETECTAR CONTEXTO DE LA PREGUNTA
  static detectContext(message: string): string {
    const msg = message.toLowerCase()
    
    if (msg.includes('vendí') || msg.includes('vendimos') || msg.includes('facturé') || msg.includes('ingresos')) {
      return 'ventas'
    }
    if (msg.includes('lotes') || msg.includes('hectáreas') || msg.includes('campo')) {
      return 'lotes'
    }
  if (msg.includes('máquina') || msg.includes('maquina') || msg.includes('maquinas') ||
    msg.includes('tractor') || msg.includes('tractores') || msg.includes('implemento') ||
    msg.includes('equipos') || msg.includes('equipo') || msg.includes('cosechadora') ||
    msg.includes('cuanta maquina') || msg.includes('cuantas maquina')) {
  return 'maquinas'
   }
    if (msg.includes('empleado') || msg.includes('personal') || msg.includes('sueldo')) {
      return 'personal'
    }
    if (msg.includes('cheque')) {
      return 'cheques'
    }
    
    return 'general'
  }
}