import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 获取恢复记录列表（最近 N 天）
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const days = searchParams.get('days') ? parseInt(searchParams.get('days')!) : 30

    const today = new Date()
    today.setHours(23, 59, 59, 999)
    const start = new Date(today.getTime() - (days - 1) * 86400000)
    start.setHours(0, 0, 0, 0)

    const logs = await db.recoveryLog.findMany({
      where: { date: { gte: start, lte: today } },
      orderBy: { date: 'desc' },
    })

    // 汇总统计
    const validLogs = logs.filter(l => l.sleepHours != null || l.waterIntake != null)
    const avgSleep = validLogs.length > 0
      ? Math.round((validLogs.reduce((s, l) => s + (l.sleepHours || 0), 0) / validLogs.length) * 10) / 10
      : 0
    const avgWater = validLogs.length > 0
      ? Math.round((validLogs.reduce((s, l) => s + (l.waterIntake || 0), 0) / validLogs.length) * 10) / 10
      : 0
    const avgSleepQuality = logs.filter(l => l.sleepQuality != null).length > 0
      ? Math.round((logs.filter(l => l.sleepQuality != null).reduce((s, l) => s + (l.sleepQuality || 0), 0) / logs.filter(l => l.sleepQuality != null).length) * 10) / 10
      : 0
    const avgFatigue = logs.filter(l => l.fatigue != null).length > 0
      ? Math.round((logs.filter(l => l.fatigue != null).reduce((s, l) => s + (l.fatigue || 0), 0) / logs.filter(l => l.fatigue != null).length) * 10) / 10
      : 0

    return NextResponse.json({
      logs,
      summary: {
        totalLogs: logs.length,
        avgSleep,
        avgWater,
        avgSleepQuality,
        avgFatigue,
        daysCovered: days,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// 保存/更新某日恢复记录
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const dateStr = body.date || new Date().toISOString().slice(0, 10)
    const date = new Date(dateStr)
    date.setHours(0, 0, 0, 0)

    const data = {
      sleepHours: body.sleepHours != null && body.sleepHours !== '' ? parseFloat(body.sleepHours) : null,
      sleepQuality: body.sleepQuality != null && body.sleepQuality !== '' ? parseInt(body.sleepQuality) : null,
      waterIntake: body.waterIntake != null && body.waterIntake !== '' ? parseFloat(body.waterIntake) : null,
      nutrition: body.nutrition != null && body.nutrition !== '' ? parseInt(body.nutrition) : null,
      muscleSoreness: body.muscleSoreness != null && body.muscleSoreness !== '' ? parseInt(body.muscleSoreness) : null,
      fatigue: body.fatigue != null && body.fatigue !== '' ? parseInt(body.fatigue) : null,
      mood: body.mood != null && body.mood !== '' ? parseInt(body.mood) : null,
      preRunFuel: body.preRunFuel || null,
      duringFuel: body.duringFuel || null,
      postRunFuel: body.postRunFuel || null,
      notes: body.notes || null,
    }

    const existing = await db.recoveryLog.findUnique({ where: { date } })
    let log
    if (existing) {
      log = await db.recoveryLog.update({ where: { id: existing.id }, data })
    } else {
      log = await db.recoveryLog.create({ data: { ...data, date } })
    }

    return NextResponse.json({ log })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
