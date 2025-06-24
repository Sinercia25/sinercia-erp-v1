'use client'

import { 
  Tractor, DollarSign, Users, BarChart3, AlertTriangle,
  ShoppingCart, Package, Wrench, Calculator, Wheat, UserPlus, Building,
  MessageCircle, Send, Mic, Filter
} from 'lucide-react'
import { useState } from 'react'

interface ChatMessage {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

export default function DashboardConChatFuncional() {
  const [filtroActivo, setFiltroActivo] = useState('todos')
  const [mensajes, setMensajes] = useState<ChatMessage[]>([
    {
      id: '1',
      text: '¡Hola! 👋 Soy SinercIA, tu asistente IA especializado en caña y soja. Puedo ayudarte con consultas sobre tu operación agrícola. ¿En qué puedo ayudarte?',
      isUser: false,
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const enviarMensaje = async () => {
    if (!inputMessage.trim() || isLoading) return

    // Agregar mensaje del usuario
    const mensajeUsuario: ChatMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    }

    setMensajes(prev => [...prev, mensajeUsuario])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputMessage }),
      })

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor')
      }

      const data = await response.json()

      // Agregar respuesta de la IA
      const mensajeIA: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: data.message,
        isUser: false,
        timestamp: new Date()
      }

      setMensajes(prev => [...prev, mensajeIA])
    } catch (error) {
      console.error('Error sending message:', error)
      const mensajeError: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Lo siento, hubo un error al procesar tu consulta. Por favor, intentá de nuevo.',
        isUser: false,
        timestamp: new Date()
      }
      setMensajes(prev => [...prev, mensajeError])
    } finally {
      setIsLoading(false)
    }
  }

  const manejarEnvio = (e: React.FormEvent) => {
    e.preventDefault()
    enviarMensaje()
  }

  const usarEjemplo = (ejemplo: string) => {
    setInputMessage(ejemplo)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-3">
              <div className="bg-slate-700 p-2 rounded-lg">
                <Tractor className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">SinercIA</h1>
                <p className="text-xs text-slate-500 hidden sm:block">ERP Cañero - La Ramada</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-xs sm:text-sm text-slate-600">Zafra 2024</span>
              <div className="h-7 w-7 bg-slate-100 rounded-full flex items-center justify-center">
                <Users className="h-3 w-3 text-slate-600" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Menú de Navegación */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex space-x-1 sm:space-x-4 py-2 overflow-x-auto">
            <button className="flex items-center space-x-1 px-2 sm:px-3 py-2 rounded-lg bg-slate-700 text-white text-xs sm:text-sm font-medium whitespace-nowrap">
              <BarChart3 className="h-3 w-3" />
              <span>Dashboard</span>
            </button>
            <button className="flex items-center space-x-1 px-2 sm:px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs sm:text-sm font-medium whitespace-nowrap">
              <ShoppingCart className="h-3 w-3" />
              <span>Ventas</span>
            </button>
            <button className="flex items-center space-x-1 px-2 sm:px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs sm:text-sm font-medium whitespace-nowrap">
              <Package className="h-3 w-3" />
              <span>Compras</span>
            </button>
            <button className="flex items-center space-x-1 px-2 sm:px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs sm:text-sm font-medium whitespace-nowrap">
              <Package className="h-3 w-3" />
              <span>Stock</span>
            </button>
            <button className="flex items-center space-x-1 px-2 sm:px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs sm:text-sm font-medium whitespace-nowrap">
              <Wrench className="h-3 w-3" />
              <span>Maquinaria</span>
            </button>
            <button className="flex items-center space-x-1 px-2 sm:px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs sm:text-sm font-medium whitespace-nowrap">
              <Calculator className="h-3 w-3" />
              <span>Finanzas</span>
            </button>
            <button className="flex items-center space-x-1 px-2 sm:px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs sm:text-sm font-medium whitespace-nowrap">
              <Wheat className="h-3 w-3" />
              <span>Cosecha</span>
            </button>
            <button className="flex items-center space-x-1 px-2 sm:px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs sm:text-sm font-medium whitespace-nowrap">
              <UserPlus className="h-3 w-3" />
              <span>Servicios</span>
            </button>
            <button className="flex items-center space-x-1 px-2 sm:px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs sm:text-sm font-medium whitespace-nowrap">
              <Building className="h-3 w-3" />
              <span>Campos</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Layout Principal */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex gap-4 py-4">
        
        {/* Contenido Principal */}
        <div className="flex-1 space-y-4">
          
          {/* Bienvenida */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-1">¡Buen día! 👋</h2>
                <p className="text-xs sm:text-sm text-slate-600">Establecimiento La Ramada - Chat IA Activado</p>
              </div>
              
              {/* Filtros */}
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-slate-500" />
                <div className="flex bg-slate-100 rounded-lg p-1">
                  <button 
                    onClick={() => setFiltroActivo('todos')}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      filtroActivo === 'todos' 
                        ? 'bg-white text-slate-800 shadow-sm' 
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    Todos
                  </button>
                  <button 
                    onClick={() => setFiltroActivo('cana')}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      filtroActivo === 'cana' 
                        ? 'bg-green-500 text-white shadow-sm' 
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    🌾 Caña
                  </button>
                  <button 
                    onClick={() => setFiltroActivo('soja')}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      filtroActivo === 'soja' 
                        ? 'bg-amber-500 text-white shadow-sm' 
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    🌱 Soja
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Métricas Rápidas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600">Lotes Totales</p>
                  <p className="text-lg font-bold text-slate-800">3</p>
                  <p className="text-xs text-slate-500">75.9 hectáreas</p>
                </div>
                <div className="bg-green-100 p-2 rounded-lg">
                  <Building className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600">Máquinas</p>
                  <p className="text-lg font-bold text-slate-800">3</p>
                  <p className="text-xs text-green-600">Todas operativas</p>
                </div>
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Wrench className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600">Productos</p>
                  <p className="text-lg font-bold text-slate-800">3</p>
                  <p className="text-xs text-slate-500">En inventario</p>
                </div>
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <Package className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600">Chat IA</p>
                  <p className="text-lg font-bold text-green-600">Activo</p>
                  <p className="text-xs text-green-600">Datos reales</p>
                </div>
                <div className="bg-green-100 p-2 rounded-lg">
                  <MessageCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </div>
          </div>

{/* Dashboard Solo Caña - Agregado incrementalmente */}
          {filtroActivo === 'cana' && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-sm font-semibold text-green-700 mb-3">🌾 Métricas de Caña</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-700">TCH Promedio</p>
                  <p className="text-lg font-bold text-green-800">85.2</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-700">Lotes Activos</p>
                  <p className="text-lg font-bold text-green-800">2</p>
                </div>
              </div>
            </div>
          )}

          {/* Información de Uso del Chat */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">🤖 Chat IA con Datos Reales Activo</h3>
            <p className="text-slate-600 mb-4">
              El chat ahora está conectado con tu base de datos real. Podés hacer consultas específicas sobre tu operación.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-slate-700 mb-2">📊 Datos Disponibles:</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Información de lotes y superficies</li>
                  <li>• Estado de maquinaria</li>
                  <li>• Inventario de productos</li>
                  <li>• Histórico de trabajos</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-slate-700 mb-2">💬 Ejemplos de Consultas:</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• "¿Cuántos lotes tengo?"</li>
                  <li>• "¿Qué máquinas están disponibles?"</li>
                  <li>• "Mostrame el inventario de productos"</li>
                  <li>• "¿Cuál es la superficie total?"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* CHAT IA FUNCIONAL */}
        <div className="w-80 hidden lg:block">
          <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl shadow-lg h-[calc(100vh-120px)] sticky top-20 flex flex-col">
            
            {/* Header del Chat */}
            <div className="p-4 border-b border-slate-600">
              <div className="flex items-center space-x-3">
                <div className="bg-emerald-500 p-2 rounded-lg">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">SinercIA Chat</h3>
                  <p className="text-xs text-slate-300">IA con datos reales</p>
                </div>
              </div>
            </div>

            {/* Área de Conversación */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {mensajes.map((mensaje) => (
                <div
                  key={mensaje.id}
                  className={`p-3 rounded-lg ${
                    mensaje.isUser
                      ? 'bg-emerald-600 text-white ml-4'
                      : 'bg-slate-600 text-white mr-4'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{mensaje.text}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {mensaje.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              ))}
              
              {isLoading && (
                <div className="bg-slate-600 text-white mr-4 p-3 rounded-lg">
                  <p className="text-sm">SinercIA está escribiendo...</p>
                </div>
              )}

              {/* Ejemplos de consultas */}
              <div className="space-y-2">
                <p className="text-xs text-slate-300 font-medium">Ejemplos rápidos:</p>
                
                <button 
                  onClick={() => usarEjemplo("¿Cuántos lotes tengo en total?")}
                  className="w-full text-left p-2 bg-slate-600 hover:bg-slate-500 rounded text-xs text-white transition-colors"
                >
                  "¿Cuántos lotes tengo en total?"
                </button>
                
                <button 
                  onClick={() => usarEjemplo("¿Qué máquinas están disponibles?")}
                  className="w-full text-left p-2 bg-slate-600 hover:bg-slate-500 rounded text-xs text-white transition-colors"
                >
                  "¿Qué máquinas están disponibles?"
                </button>
                
                <button 
                  onClick={() => usarEjemplo("Mostrame el inventario de productos")}
                  className="w-full text-left p-2 bg-slate-600 hover:bg-slate-500 rounded text-xs text-white transition-colors"
                >
                  "Mostrame el inventario de productos"
                </button>
                
                <button 
                  onClick={() => usarEjemplo("¿Cuál es la superficie total de mis lotes?")}
                  className="w-full text-left p-2 bg-slate-600 hover:bg-slate-500 rounded text-xs text-white transition-colors"
                >
                  "¿Cuál es la superficie total?"
                </button>
              </div>
            </div>

            {/* Input del Chat */}
            <form onSubmit={manejarEnvio} className="p-4 border-t border-slate-600">
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Preguntá sobre tu operación..."
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                />
                <button 
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-emerald-500 hover:bg-emerald-600 p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4 text-white" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">
                Conectado con OpenAI + Base de datos real
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Chat Móvil */}
      <div className="lg:hidden fixed bottom-4 right-4">
        <button className="bg-slate-700 hover:bg-slate-800 p-4 rounded-full shadow-lg transition-colors">
          <MessageCircle className="h-6 w-6 text-white" />
        </button>
      </div>
    </div>
  )
}