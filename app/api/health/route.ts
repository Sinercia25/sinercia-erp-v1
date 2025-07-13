// app/api/health/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { mainDbPool, dwhPool, openai } from '@/lib/server'

export async function GET(_req: NextRequest) {
  try {
    // 1️⃣ Test BD principal
    await mainDbPool.query('SELECT 1')
    // 2️⃣ Test DWH
    await dwhPool.query('SELECT 1')
    // 3️⃣ Test OpenAI (prompt mínimo)
    const ping = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: 'Ping' }],
      max_tokens: 1
    })
    if (!ping.choices?.[0]?.message) throw new Error('No response from OpenAI')

    return NextResponse.json({
      ok: true,
      db: 'ok',
      dwh: 'ok',
      openai: 'ok'
    })
  } catch (err: any) {
    console.error('💥 Health check failed:', err)
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    )
  }
}
