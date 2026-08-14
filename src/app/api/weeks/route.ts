import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 获取所有训练周（含 sessions 和 completion）
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const current = searchParams.get('current')

    let weeks = await db.trainingWeek.findMany({
      include: {
        sessions: {
          include: { completion: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { weekStart: 'desc' },
    })

    if (current === 'true' && weeks.length > 0) {
      // 返回当前周（包含今天的那一周）
      const today = new Date()
      const day = today.getDay() // 0=周日
      const monday = new Date(today)
      const diff = day === 0 ? -6 : 1 - day
      monday.setDate(today.getDate() + diff)
      monday.setHours(0, 0, 0, 0)

      const currentWeek = weeks.find((w) => {
        const ws = new Date(w.weekStart)
        ws.setHours(0, 0, 0, 0)
        return ws.getTime() === monday.getTime()
      })
      return NextResponse.json({ week: currentWeek || weeks[0] })
    }

    return NextResponse.json({ weeks })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// 创建新训练周
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const weekStart = new Date(body.weekStart)
    const weekEnd = new Date(body.weekEnd || new Date(weekStart.getTime() + 6 * 86400000))

    const week = await db.trainingWeek.create({
      data: {
        weekStart,
        weekEnd,
        weekNumber: body.weekNumber ?? null,
        phase: body.phase ?? null,
        goal: body.goal ?? null,
        summary: body.summary ?? null,
      },
    })

    // 批量创建 sessions
    if (Array.isArray(body.sessions) && body.sessions.length > 0) {
      await db.trainingSession.createMany({
        data: body.sessions.map((s: {
          dayOfWeek: number
          type: string
          plannedDistance?: number | null
          plannedDuration?: number | null
          plannedPace?: string | null
          intensity?: string | null
          description?: string
        }, idx: number) => {
          const date = new Date(weekStart)
          date.setDate(weekStart.getDate() + (s.dayOfWeek === 0 ? 6 : s.dayOfWeek - 1))
          return {
            weekId: week.id,
            date,
            dayOfWeek: s.dayOfWeek,
            type: s.type,
            plannedDistance: s.plannedDistance ?? null,
            plannedDuration: s.plannedDuration ?? null,
            plannedPace: s.plannedPace ?? null,
            intensity: s.intensity ?? null,
            description: s.description ?? '',
            order: idx,
          }
        }),
      })
    }

    const fullWeek = await db.trainingWeek.findUnique({
      where: { id: week.id },
      include: { sessions: { include: { completion: true }, orderBy: { order: 'asc' } } },
    })
    return NextResponse.json({ week: fullWeek })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
