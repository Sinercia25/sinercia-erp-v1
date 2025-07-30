// app/api/health/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { prisma } from '@/lib/prisma'
import { OpenAI } from 'openai'

export async function GET(_req: NextRequest) {
  const results = {
    ok: true,
    db: 'unknown',
    dwh: 'unknown',
    openai: 'unknown',
    timestamp: new Date().toISOString()
  }

  try {
    // 1️⃣ Test BD principal (Prisma)
    try {
      await prisma.$queryRaw`SELECT 1`
      results.db = 'ok'
    } catch (err) {
      results.db = 'error'
      results.ok = false
      console.error('❌ DB check failed:', err)
    }

    // 2️⃣ Test DWH
    try {
      await db.query('SELECT 1')
      results.dwh = 'ok'
    } catch (err) {
      results.dwh = 'error'
      results.ok = false
      console.error('❌ DWH check failed:', err)
    }

    // 3️⃣ Test OpenAI (si está configurado)
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
        const ping = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: 'Respond with OK' }],
          max_tokens: 5
        })
        if (ping.choices?.[0]?.message) {
          results.openai = 'ok'
        } else {
          results.openai = 'error'
          results.ok = false
        }
      } catch (err) {
        results.openai = 'error'
        results.ok = false
        console.error('❌ OpenAI check failed:', err)
      }
    } else {
      results.openai = 'not_configured'
    }

    return NextResponse.json(results, { status: results.ok ? 200 : 503 })
  } catch (err: unknown) {
    console.error('💥 Health check critical error:', err)
    return NextResponse.json(
      { 
        ...results,
        ok: false, 
        error: err instanceof Error ? err.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
