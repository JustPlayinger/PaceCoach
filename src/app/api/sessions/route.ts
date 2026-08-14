import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 创建单节训练课
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const weekStart = await db.trainingWeek.findUnique({ where: { id: body.weekId } })
    if (!weekStart) return NextResponse.json({ error: 'Week not found' }, { status: 404 })

    const date = new Date(weekStart.weekStart)
    const dow = body.dayOfWeek ?? 1
    date.setDate(weekStart.weekStart.getDate() + (dow === 0 ? 6 : dow - 1))

    const session = await db.trainingSession.create({
      data: {
        weekId: body.weekId,
        date,
        dayOfWeek: dow,
        type: body.type ?? 'easy',
        plannedDistance: body.plannedDistance ?? null,
        plannedDuration: body.plannedDuration ?? null,
        plannedPace: body.plannedPace ?? null,
        intensity: body.intensity ?? null,
        description: body.description ?? '',
        status: body.status ?? 'pending',
        order: body.order ?? 0,
      },
      include: { completion: true },
    })
    return NextResponse.json({ session })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
