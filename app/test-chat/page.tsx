'use client'
import { useState } from 'react'

export default function TestChat() {
  const [messages, setMessages] = useState<Array<{user: string, bot: string}>>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    if (!input.trim()) return

    setLoading(true)
    
    try {
      const response = await fetch('/api/chat-premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input,
          userId: 'test_user_123' 
        })
      })
      
      const data = await response.json()
      
      setMessages(prev => [...prev, {
        user: input,
        bot: data.message
      }])
      
      setInput('')
    } catch (error) {
      console.error('Error:', error)
    }
    
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">🤖 Test SinercIA Chat con Memoria</h1>
      
      {/* Historial de mensajes */}
      <div className="space-y-4 mb-6 h-96 overflow-y-auto bg-gray-50 p-4 rounded">
        {messages.map((msg, i) => (
          <div key={i}>
            <div className="bg-blue-100 p-3 rounded mb-2">
              <strong>👤 Usuario:</strong> {msg.user}
            </div>
            <div className="bg-green-100 p-3 rounded">
              <strong>🤖 CeoBot:</strong> {msg.bot}
            </div>
          </div>
        ))}
      </div>
      
      {/* Input para escribir */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Escribí tu pregunta..."
          className="flex-1 p-3 border rounded"
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Pruebas sugeridas:</strong></p>
        <p>1. "¿Cuánto vendimos en julio?"</p>
        <p>2. "¿Y el año pasado?"</p>
        <p>3. "Dame el detalle"</p>
      </div>
    </div>
  )
}