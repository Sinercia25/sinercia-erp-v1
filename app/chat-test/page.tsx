'use client'
import React, { useState, useRef, useEffect } from 'react'
import { Search, ArrowLeft, Send, Activity, BarChart, Clock } from 'lucide-react'

// Metric and chat data types
type Metric = { id: string; label: string; value: string | number; icon: React.ComponentType }
type Message = { id: string; text: string; isUser: boolean; timestamp: string }
type Conversation = { id: string; title: string; messages: Message[]; date: string }

export default function CeoBotStandalone() {
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat')
  const [metrics] = useState<Metric[]>([
    { id: 'm1', label: 'Ventas', value: '$24,500', icon: BarChart },
    { id: 'm2', label: 'Cheques', value: 120, icon: Clock },
    { id: 'm3', label: 'Stock Crítico', value: 8, icon: Activity },
    { id: 'm4', label: 'Rotación Baja', value: 15, icon: Activity },
  ])
  const [history] = useState<Conversation[]>([
    { id: 'c1', title: 'Informe de ventas', date: 'Hoy 09:15', messages: [
      { id: '1', text: '¿Cuál fue el total de ventas?', isUser: true, timestamp: '09:00' },
      { id: '2', text: 'Fueron $24,500.', isUser: false, timestamp: '09:01' },
    ]},
    { id: 'c2', title: 'Estado de stock', date: 'Ayer 16:40', messages: [
      { id: '1', text: '¿Qué productos están en stock crítico?', isUser: true, timestamp: '16:30' },
      { id: '2', text: 'Hay 8 ítems bajo el mínimo.', isUser: false, timestamp: '16:31' },
    ]},
  ])

  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [scrollIdx, setScrollIdx] = useState(0)
  const historyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activeTab === 'history' && historyRef.current) {
      const item = historyRef.current.children[scrollIdx] as HTMLElement
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeTab, scrollIdx])

  const handleSend = (text: string) => {
    // Placeholder: agregar lógica de API
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      {/* Desktop: Sidebar de métricas */}
      <aside className="hidden lg:flex flex-col w-64 bg-white shadow-lg p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-700">Métricas Clave</h2>
        {metrics.map(m => (
          <div key={m.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
            <m.icon className="w-6 h-6 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">{m.label}</p>
              <p className="text-lg font-bold text-gray-800">{m.value}</p>
            </div>
          </div>
        ))}
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Mobile: Carrusel métricas */}
        <section className="lg:hidden bg-white shadow p-4">
          <div className="flex overflow-x-auto space-x-4 hide-scrollbar">
            {metrics.map(m => (
              <div key={m.id} className="flex-none w-40 p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white shadow-md">
                <m.icon className="w-5 h-5 mb-2" />
                <p className="text-sm opacity-80">{m.label}</p>
                <p className="text-lg font-bold">{m.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tabs Chat/Historial */}
        <nav className="flex justify-center bg-white border-b">
          {['chat', 'history'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'chat' | 'history')}
              className={`px-6 py-3 font-medium ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
            >
              {tab === 'chat' ? 'Chat' : 'Historial'}
            </button>
          ))}
        </nav>

        <div className="flex flex-1 overflow-hidden p-6">
          {activeTab === 'chat' ? (
            <div className="flex-1 grid grid-rows-[auto_1fr_auto] gap-4">
              {/* Conversación */}
              <div className="overflow-y-auto space-y-4 p-4 bg-white rounded-xl shadow-inner">
                {selectedConv ? (
                  selectedConv.messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                      <p className={`max-w-xs p-3 rounded-lg ${msg.isUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>{msg.text}</p>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center text-gray-400 h-full">
                    Selecciona una conversación
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="flex items-center bg-white p-4 rounded-xl shadow-sm">
                <input
                  type="text"
                  placeholder="Escribe tu mensaje..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  onKeyDown={e => e.key === 'Enter' && handleSend((e.target as HTMLInputElement).value)}
                />
                <button className="ml-2 bg-blue-600 hover:bg-blue-700 p-3 rounded-full text-white shadow-md">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div ref={historyRef} className="w-full lg:w-1/3 bg-white rounded-xl shadow-md overflow-y-auto">
              {history.map((conv, idx) => (
                <button
                  key={conv.id}
                  onClick={() => { setSelectedConv(conv); setActiveTab('chat'); setScrollIdx(idx) }}
                  className={`w-full text-left p-4 border-b hover:bg-gray-50 transition ${selectedConv?.id === conv.id ? 'bg-blue-50' : ''}`}
                >
                  <h3 className="font-semibold text-gray-800">{conv.title}</h3>
                  <time className="text-xs text-gray-500">{conv.date}</time>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// Global CSS utility (add to globals.css):
//
// .hide-scrollbar::-webkit-scrollbar { display: none; }
// .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
