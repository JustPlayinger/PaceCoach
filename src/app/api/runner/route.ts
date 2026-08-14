import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 获取跑者档案
export async function GET() {
  try {
    let runner = await db.runner.findFirst()
    return NextResponse.json({ runner })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// 创建或更新跑者档案
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const existing = await db.runner.findFirst()

    const data = {
      name: body.name ?? '跑者',
      age: body.age ?? null,
      gender: body.gender ?? null,
      weight: body.weight ?? null,
      height: body.height ?? null,
      restingHr: body.restingHr ?? null,
      maxHr: body.maxHr ?? null,
      vo2max: body.vo2max ?? null,
      experience: body.experience ?? null,
      targetRace: body.targetRace ?? null,
      targetDate: body.targetDate ?? null,
      targetTime: body.targetTime ?? null,
      weeklyMileage: body.weeklyMileage ?? null,
      notes: body.notes ?? null,
    }

    let runner
    if (existing) {
      runner = await db.runner.update({ where: { id: existing.id }, data })
    } else {
      runner = await db.runner.create({ data })
    }
    return NextResponse.json({ runner })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
