import { NextResponse } from 'next/server'
import { getAiConfigStatus } from '@/lib/ai-config'

// 获取当前 AI 配置状态（脱敏，不返回 apiKey）
export async function GET() {
  try {
    const status = getAiConfigStatus()
    return NextResponse.json(status)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
