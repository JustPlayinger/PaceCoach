import { NextRequest, NextResponse } from 'next/server'
import { extractTrainingDataFromImage } from '@/lib/ai'

// 从训练 App 长图提取数据（VLM）
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { imageBase64, mimeType } = body as { imageBase64: string; mimeType?: string }

    if (!imageBase64) {
      return NextResponse.json({ error: 'imageBase64 is required' }, { status: 400 })
    }

    const data = await extractTrainingDataFromImage(imageBase64, mimeType || 'image/jpeg')
    return NextResponse.json({ data })
  } catch (e) {
    console.error('Extract error:', e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
