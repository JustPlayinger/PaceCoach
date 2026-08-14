import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 获取某训练周的所有 AI 点评/计划记录
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const reviews = await db.aIReview.findMany({
      where: { weekId: id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ reviews })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
