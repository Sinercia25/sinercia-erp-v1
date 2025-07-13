'use client'

import { useState, useRef } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Legend,
  Title,
  Tooltip
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export default function TestChat() {
  const [chatLog, setChatLog]     = useState<{ user: string; bot: string }[]>([])
  const [input, setInput]         = useState('')
  const [health, setHealth]       = useState<any>(null)
  const [payload, setPayload]     = useState<any>(null)
  const [telemetry, setTelemetry] = useState<any>(null)
  const [rawDWH, setRawDWH]       = useState<any>(null)
  const [results, setResults]     = useState<any>(null)
  const [abTest, setAbTest]       = useState<any>(null)

  const [latencies, setLatencies] = useState<number[]>([])
  const [successes, setSuccesses] = useState<number[]>([])
  const chartRef = useRef<any>(null)

  const sendMessage = async () => {
    if (!input.trim()) return
    setChatLog(prev => [...prev, { user: input, bot: '' }])

    try {
      const res = await fetch('/api/chat-premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, userId: 'usuario_default' })
      })
      const data = await res.json()

      // Actualizo chat
      setChatLog(prev => {
        const copy = [...prev]
        copy[copy.length - 1].bot = data.message
        return copy
      })

      // Lleno paneles
      setHealth(data.health)
      setPayload(data.payload)
      setTelemetry(data.telemetryTokens)
      setRawDWH(data.rawDWHData)
      setResults(data.diagnostics)
      setAbTest(data.abTest)

      // Gráfica
      setLatencies(prev => [...prev, data.diagnostics.latencyMs])
      setSuccesses(prev => [...prev, data.diagnostics.success ? 1 : 0])

      setInput('')
    } catch {
      setChatLog(prev => {
        const copy = [...prev]
        copy[copy.length - 1].bot = '❌ Error al llamar al API'
        return copy
      })
    }
  }

  const chartData = {
    labels: latencies.map((_, i) => `#${i + 1}`),
    datasets: [
      {
        label: 'Latencia (ms)',
        data: latencies,
        borderColor: '#718096',
        backgroundColor: '#edf2f7'
      },
      {
        label: 'Éxito',
        data: successes,
        borderColor: '#48bb78',
        backgroundColor: '#f0fff4',
        yAxisID: 'successAxis'
      }
    ]
  }
  const chartOptions = {
    scales: {
      y: { beginAtZero: false },
      successAxis: {
        position: 'right',
        min: 0,
        max: 1,
        ticks: { stepSize: 1 }
      }
    }
  }

  return (
    <div className="p-6 grid gap-4" style={{ gridTemplateColumns: '40% 30% 30%' }}>
      {/* Columna 1: Chat + Gráfica */}
      <div className="space-y-4">
        <div className="bg-white p-4 rounded shadow h-[60vh] flex flex-col">
          <h2 className="font-bold text-lg mb-2">Chat Manual</h2>
          <div className="flex-1 overflow-y-auto mb-2 space-y-2">
            {chatLog.map((m, i) => (
              <div key={i}>
                <div className="bg-gray-100 p-2 rounded"><strong>👤 Usuario:</strong> {m.user}</div>
                <div className="bg-gray-50 p-2 rounded"><strong>🤖 CeoBot:</strong> {m.bot}</div>
              </div>
            ))}
          </div>
          <div className="flex">
            <input
              className="flex-1 border p-2 rounded-l"
              placeholder="Escribí tu pregunta..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
            />
            <button className="bg-gray-800 text-white px-4 rounded-r" onClick={sendMessage}>
              Enviar
            </button>
          </div>
        </div>
        <div className="bg-white p-4 rounded shadow h-[30vh]">
          <h2 className="font-bold text-lg mb-2">Latencia y Éxito</h2>
          <Line ref={chartRef} data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Columna 2: Health, Payload, Telemetría */}
      <div className="space-y-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-bold text-lg mb-2">Health Check</h2>
          <pre className="text-sm">{health ? JSON.stringify(health, null, 2) : 'null'}</pre>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-bold text-lg mb-2">Payload Viewer</h2>
          <pre className="text-sm">{payload ? JSON.stringify(payload, null, 2) : 'null'}</pre>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-bold text-lg mb-2">Telemetría Tokens</h2>
          <pre className="text-sm">{telemetry ? JSON.stringify(telemetry, null, 2) : 'null'}</pre>
        </div>
      </div>

      {/* Columna 3: Resultados, Raw DWH, A/B Test */}
      <div className="space-y-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-bold text-lg mb-2">Resultados Detallados</h2>
          {results ? (
            <ul className="list-disc ml-5 text-sm">
              <li>
                “{results.question}” ({results.latencyMs} ms) –{' '}
                {results.success ? '✅' : '❌'}
              </li>
            </ul>
          ) : (
            <p className="text-sm">null</p>
          )}
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-bold text-lg mb-2">Raw DWH Data</h2>
          <pre className="text-sm">{rawDWH ? JSON.stringify(rawDWH, null, 2) : 'null'}</pre>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-bold text-lg mb-2">Panel A/B Test</h2>
          <pre className="text-sm">{abTest ? JSON.stringify(abTest, null, 2) : 'null'}</pre>
        </div>
      </div>
    </div>
  )
}
