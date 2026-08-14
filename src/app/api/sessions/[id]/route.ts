import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 更新单节训练课
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const session = await db.trainingSession.update({
      where: { id },
      data: {
        type: body.type ?? undefined,
        plannedDistance: body.plannedDistance ?? undefined,
        plannedDuration: body.plannedDuration ?? undefined,
        plannedPace: body.plannedPace ?? undefined,
        intensity: body.intensity ?? undefined,
        description: body.description ?? undefined,
        status: body.status ?? undefined,
      },
      include: { completion: true },
    })
    return NextResponse.json({ session })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// 删除单节训练课
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.trainingSession.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
