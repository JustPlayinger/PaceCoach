import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DISTANCES: Record<string, number> = {
  '1K': 1,
  '3K': 3,
  '5K': 5,
  '10K': 10,
  '半马': 21.0975,
  '全马': 42.195,
}

// 获取所有 PB 记录
export async function GET() {
  try {
    const records = await db.personalRecord.findMany({
      orderBy: { distanceKm: 'asc' },
    })

    // 补全所有标准距离（即使无记录也显示占位）
    const allDistances = Object.entries(DISTANCES).map(([dist, km]) => {
      const r = records.find(rec => rec.distance === dist)
      return {
        distance: dist,
        distanceKm: km,
        id: r?.id || null,
        timeSec: r?.timeSec || null,
        paceSec: r?.paceSec || (r?.timeSec ? Math.round(r.timeSec / km) : null),
        date: r?.date.toISOString() || null,
        location: r?.location || null,
        raceName: r?.raceName || null,
        notes: r?.notes || null,
      }
    })

    const totalPBs = records.length
    return NextResponse.json({ records: allDistances, totalPBs })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// 保存/更新某距离 PB
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { distance, timeSec, date, location, raceName, notes } = body as {
      distance: string
      timeSec: number
      date: string
      location?: string
      raceName?: string
      notes?: string
    }

    const distanceKm = DISTANCES[distance]
    if (!distanceKm) {
      return NextResponse.json({ error: `不支持的距离：${distance}` }, { status: 400 })
    }
    if (!timeSec || timeSec <= 0) {
      return NextResponse.json({ error: '请输入有效时间' }, { status: 400 })
    }

    const paceSec = Math.round(timeSec / distanceKm)
    const dateObj = new Date(date)
    dateObj.setHours(0, 0, 0, 0)

    const existing = await db.personalRecord.findUnique({ where: { distance } })
    let record
    if (existing) {
      record = await db.personalRecord.update({
        where: { id: existing.id },
        data: {
          timeSec,
          date: dateObj,
          location: location || null,
          raceName: raceName || null,
          paceSec,
          notes: notes || null,
        },
      })
    } else {
      record = await db.personalRecord.create({
        data: {
          distance,
          distanceKm,
          timeSec,
          date: dateObj,
          location: location || null,
          raceName: raceName || null,
          paceSec,
          notes: notes || null,
        },
      })
    }

    return NextResponse.json({ record })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
