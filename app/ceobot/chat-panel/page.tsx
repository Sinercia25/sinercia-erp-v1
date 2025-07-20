// components/TestChat.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface HistoryEntry { time: string; avgLatency: number; successRate: number; }
interface ABResult     { avgLatency: number; successRate: number; }

export default function TestChat() {
  // ─────────────────────────────────────────────
  // Estados Principales
  // ─────────────────────────────────────────────
  const [messagesLog, setMessagesLog] = useState<{ user: string; bot: string }[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [lastPayload, setLastPayload] = useState<any>(null);
  const [lastDwhData, setLastDwhData] = useState<any>(null);
  const [lastTelemetry, setLastTelemetry] = useState<{ prompt_tokens: number; completion_tokens: number; total_tokens: number } | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [abResults, setABResults] = useState<Record<string, ABResult> | null>(null);
  const [observations, setObservations] = useState<string>('');

  // ─────────────────────────────────────────────
  // Configuración de Pruebas
  // ─────────────────────────────────────────────
  const [testCases, setTestCases] = useState<string[]>([
    '¿Cuánto vendimos en julio?',
    '¿Y el año pasado?',
    'Dame el detalle',
    '¿Cuántos lotes?'
  ]);
  const [newTestCase, setNewTestCase] = useState('');
  const [concurrency, setConcurrency] = useState(1);

  // ─────────────────────────────────────────────
  // Chat Manual
  // ─────────────────────────────────────────────
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [runningTests, setRunningTests] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final
  useEffect(() => {
    const el = chatContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messagesLog]);

  // Health Check inicial
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/health');
        setHealth(await res.json());
      } catch {
        setHealth({ ok: false });
      }
    })();
  }, []);

  // Calcular Observaciones tras pruebas
  useEffect(() => {
    if (!history.length || !abResults) return;
    const latest = history[history.length - 1];
    const obs: string[] = [];
    if (latest.avgLatency > 1500) obs.push('⚠️ Latencia alta: considera optimizar parámetros o modelo.');
    Object.entries(abResults).forEach(([key, val]) => {
      if (val.avgLatency > latest.avgLatency) obs.push(`⚙️ ${key} es más lento que la media.`);
      if (val.successRate < 100) obs.push(`❌ ${key} no obtuvo 100% de éxito.`);
    });
    if (!obs.length) obs.push('✅ Todos los indicadores dentro de parámetros esperados.');
    setObservations(obs.join('\n'));
  }, [history, abResults]);

  // ─────────────────────────────────────────────
  // Funciones de Llamadas
  // ─────────────────────────────────────────────
  async function sendMessage() {
    if (!input.trim()) return;
    setLoading(true);
    const payload = { message: input, userId: 'manual_user', empresa_id: 'emp_002' };
    setLastPayload(payload);
    try {
      const res = await fetch('/api/chat-premium', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();
      setMessagesLog(prev => [...prev, { user: input, bot: JSON.stringify(json) }]);
      setLastDwhData(json.resumen);
      setLastTelemetry(json.telemetry || null);
    } catch {
      setMessagesLog(prev => [...prev, { user: input, bot: 'Error interno' }]);
    }
    setInput('');
    setLoading(false);
  }

  async function runDiagnostics() {
    setRunningTests(true);
    const latArr: number[] = [];
    let succ = 0;
    for (const msg of testCases) {
      const start = performance.now();
      try {
        const res = await fetch('/api/chat-premium', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg, userId: 'diag', empresa_id: 'emp_002' }) });
        const json = await res.json();
        const elapsed = Math.round(performance.now() - start);
        latArr.push(elapsed);
        if (Array.isArray(json.recomendaciones) && json.recomendaciones.length === 2) succ++;
        setLastDwhData(json.resumen);
        if (json.telemetry) setLastTelemetry(json.telemetry);
      } catch {}
    }
    setHistory(prev => [...prev, { time: new Date().toLocaleTimeString(), avgLatency: Math.round(latArr.reduce((a, b) => a + b, 0) / latArr.length), successRate: Math.round((succ / testCases.length) * 100) }]);
    setRunningTests(false);
  }

  async function runLoadTest() {
    setRunningTests(true);
    await Promise.all(Array.from({ length: concurrency }, () => runDiagnostics()));
    setRunningTests(false);
  }

  async function runABTest() {
    setRunningTests(true);
    const combos = [
      { label: 'T1', temperature: 0.2, top_p: 1.0 },
      { label: 'T2', temperature: 0.5, top_p: 0.9 }
    ];
    const resAB: Record<string, ABResult> = {};
    for (const c of combos) {
      let sum = 0, okCount = 0;
      for (const msg of testCases) {
        const start = performance.now();
        const r = await fetch('/api/chat-premium', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg, userId: 'diag', empresa_id: 'emp_002', temperature: c.temperature, top_p: c.top_p }) });
        const json = await r.json();
        sum += Math.round(performance.now() - start);
        if (Array.isArray(json.recomendaciones) && json.recomendaciones.length === 2) okCount++;
      }
      resAB[c.label] = { avgLatency: Math.round(sum / testCases.length), successRate: Math.round((okCount / testCases.length) * 100) };
    }
    setABResults(resAB);
    setRunningTests(false);
  }

  function addTestCase() {
    if (!newTestCase.trim()) return;
    setTestCases(prev => [...prev, newTestCase.trim()]);
    setNewTestCase('');
  }

  // ─────────────────────────────────────────────
  // Renderizado
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="grid grid-cols-2 grid-rows-2 gap-6 h-[90vh]">

        {/* Q1: Chat Manual */}
        <div className="bg-white rounded-lg shadow p-4 flex flex-col">
          <h3 className="text-xl font-semibold text-blue-700 mb-2">Chat Manual</h3>
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-3">
            {messagesLog.map((m, i) => (
              <div key={i} className="space-y-1">
                <div className="bg-blue-100 p-2 rounded whitespace-pre-wrap break-words">👤 {m.user}</div>
                {/** Render bot con parsing **/}
                {(() => {
                  let parsed: any = null;
                  try { parsed = JSON.parse(m.bot); } catch {};
 if (parsed?.resumen || parsed?.ventas) {
  const { empresa, sector, resumen, recomendaciones, telemetry } = parsed;
  return (
    <div className="bg-green-100 p-2 rounded text-sm space-y-1">
      <p><strong>🤖 Empresa:</strong> {empresa}</p>
      <p><strong>Sector:</strong> {sector}</p>
      {resumen && <p><strong>Resumen:</strong> {resumen}</p>}
      <ul className="list-disc pl-5">
        <li>Total Ventas: ${ (parsed.ventas ?? 0).toLocaleString() }</li>
        <li>Total Ingresos: ${ (parsed.ingresos ?? 0).toLocaleString() }</li>
        <li>Total Egresos: ${ (parsed.egresos ?? 0).toLocaleString() }</li>
        <li>Total Transacciones: ${ (parsed.transacciones ?? 0).toLocaleString() }</li>
        <li>Importe Trans: ${ (parsed.importeTransacciones ?? 0).toLocaleString() }</li>
      </ul>
      {Array.isArray(recomendaciones) && recomendaciones.length > 0 && (
        <ul className="list-disc pl-5">
          {recomendaciones.map((r: string, idx: number) => <li key={idx}>{r}</li>)}
        </ul>
      )}
      {telemetry && <ul className="list-disc pl-5">
        <li>Prompt Tokens: {telemetry.prompt_tokens}</li>
        <li>Completion Tokens: {telemetry.completion_tokens}</li>
        <li>Total Tokens: {telemetry.total_tokens}</li>
      </ul>}
    </div>
  );
}
                  return <div className="bg-green-100 p-2 rounded whitespace-pre-wrap break-words">🤖 {m.bot}</div>;
                })()}
              </div>
            ))}
          </div>
          <div className="mt-3 flex">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && sendMessage()}
              className="flex-1 border border-gray-300 rounded px-3 py-2 mr-2"
              placeholder="Escribí tu pregunta..."
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >Enviar</button>
          </div>
        </div>

        {/* Q2: Indicadores */}
        <div className="bg-white rounded-lg shadow p-4 grid grid-cols-2 grid-rows-2 gap-4">
          {[
            { title: 'Health Check', content: health },
            { title: 'Payload Viewer', content: lastPayload },
            { title: 'Raw DWH Data', content: lastDwhData },
            { title: 'Telemetría Tokens', content: lastTelemetry }
          ].map((block, idx) => (
            <div key={idx} className="flex flex-col">
              <h4 className="text-sm font-medium text-gray-600">{block.title}</h4>
              <div className="bg-gray-100 p-2 rounded text-xs mt-1 flex-1 overflow-y-auto whitespace-pre-wrap break-words">
                {/** contenido formateado segun bloque **/}
                {block.title === 'Health Check' && block.content ? (
                  <ul className="list-disc pl-5 space-y-1">
                    <li>OK: {block.content.ok ? '✅' : '❌'}</li>
                    <li>DB: {block.content.db}</li>
                    <li>DWH: {block.content.dwh}</li>
                    <li>OpenAI: {block.content.openai}</li>
                  </ul>
                ) : block.title === 'Payload Viewer' && block.content ? (
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Mensaje: {block.content.message}</li>
                    <li>Usuario: {block.content.userId}</li>
                    <li>Empresa: {block.content.empresa_id}</li>
                  </ul>
                ) : block.title === 'Raw DWH Data' && block.content ? (
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Total Transacciones: ${ ((block?.content?.totalTransacciones) ?? 0).toLocaleString() }</li>
                    <li>Importe Trans: ${ ((block?.content?.totalImporteTransacciones) ?? 0).toLocaleString() }</li>
                    <li>Total Ventas: ${ ((block?.content?.totalVentas) ?? 0).toLocaleString() }</li>
                    <li>Total Compras: ${ ((block?.content?.totalCompras) ?? 0).toLocaleString() }</li>
                    <li>Total Cheques: ${ ((block?.content?.totalCheques) ?? 0).toLocaleString() }</li>
                    <li>Monto Cheques: ${ ((block?.content?.montoCheques) ?? 0).toLocaleString() }</li>
                  </ul>
                ) : block.title === 'Telemetría Tokens' && block.content ? (
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Prompt Tokens: {block.content.prompt_tokens}</li>
                    <li>Completion Tokens: {block.content.completion_tokens}</li>
                    <li>Total Tokens: {block.content.total_tokens}</li>
                  </ul>
                ) : (
                  <pre>{typeof block.content === 'object' ? JSON.stringify(block.content, null, 2) : block.content}</pre>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Q3: Casos de Prueba */}
        <div className="bg-white rounded-lg shadow p-4 flex flex-col">
          <h4 className="text-lg font-medium text-gray-700 mb-2">Casos de Prueba</h4>
          <ul className="list-disc list-inside flex-1 overflow-y-auto text-sm space-y-1">
            {testCases.map((tc, idx) => <li key={idx}>{tc}</li>)}
          </ul>
          <div className="mt-2 flex space-x-2">
            <input
              value={newTestCase}
              onChange={e => setNewTestCase(e.target.value)}
              placeholder="Nuevo caso..."
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
            />
            <button onClick={addTestCase} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Añadir</button>
          </div>
          <label className="mt-3 text-sm">Concurrencia: {concurrency}</label>
          <input
            type="range"
            min={1}
            max={10}
            value={concurrency}
            onChange={e => setConcurrency(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Q4: Botones, A/B y Observaciones + Gráfico */}
        <div className="bg-white rounded-lg shadow p-4 flex flex-col">
          {/* Buttons row */}
          <div className="flex justify-center space-x-2 mb-4">
            <button onClick={runDiagnostics} disabled={runningTests} className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">Diagnostics</button>
            <button onClick={runLoadTest}   disabled={runningTests} className="flex-1 bg-purple-600 text-white py-2 rounded hover:bg-purple-700 disabled:opacity-50">Load Test</button>
            <button onClick={runABTest}     disabled={runningTests} className="flex-1 bg-teal-600 text-white py-2 rounded hover:bg-teal-700 disabled:opacity-50">A/B Test</button>
          </div>
          {/* Content: AB + Obs and chart */}
          <div className="flex flex-1 gap-6 overflow-hidden">
            {/* A/B + Observations */}
            <div className="w-1/2 sticky top-4 max-h-full overflow-y-auto p-2">
              {abResults && (
                <>
                  <h5 className="text-lg font-medium text-gray-700 mb-2">A/B Testing</h5>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {Object.entries(abResults).map(([k,v]) => <li key={k}>{k}: {v.avgLatency}ms, {v.successRate}%</li>)}
                  </ul>
                  <h5 className="text-lg font-medium text-gray-700 mt-4 mb-2">Observaciones</h5>
                  <textarea
                    readOnly
                    value={observations}
                    className="w-full h-40 border border-gray-300 rounded p-2 text-sm resize-none"
                  />
                </>
              )}
            </div>
            {/* Chart */}
            <div className="w-1/2 flex items-center justify-center">
              <LineChart width={400} height={260} data={history} className="mx-auto">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip wrapperStyle={{ fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="avgLatency" name="Lat ms" stroke="#1D4ED8" />
                <Line type="monotone" dataKey="successRate" name="% Éxito" stroke="#10B981" />
              </LineChart>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
