import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 获取所有跑鞋（含累计里程）
export async function GET() {
  try {
    const shoes = await db.shoe.findMany({
      include: { usages: true },
      orderBy: [{ retired: 'asc' }, { createdAt: 'desc' }],
    })

    const shoesWithStats = shoes.map(s => {
      const totalDistance = s.usages.reduce((sum, u) => sum + u.distance, 0)
      const usageCount = s.usages.length
      const lastUsed = s.usages.length > 0
        ? s.usages.map(u => u.date).sort((a, b) => b.getTime() - a.getTime())[0]
        : null
      const wearPercent = s.lifespan > 0 ? Math.min(100, Math.round((totalDistance / s.lifespan) * 100)) : 0
      const remaining = Math.max(0, s.lifespan - totalDistance)
      const status = s.retired
        ? 'retired'
        : wearPercent >= 100 ? 'overdue'
        : wearPercent >= 85 ? 'warning'
        : 'active'
      return {
        id: s.id,
        name: s.name,
        brand: s.brand,
        model: s.model,
        type: s.type,
        color: s.color,
        purchasedAt: s.purchasedAt.toISOString(),
        lifespan: s.lifespan,
        retired: s.retired,
        notes: s.notes,
        createdAt: s.createdAt.toISOString(),
        totalDistance: Math.round(totalDistance * 10) / 10,
        usageCount,
        lastUsed: lastUsed?.toISOString() || null,
        wearPercent,
        remaining: Math.round(remaining * 10) / 10,
        status,
      }
    })

    // 汇总统计
    const active = shoesWithStats.filter(s => !s.retired)
    const summary = {
      totalShoes: shoes.length,
      activeShoes: active.length,
      totalDistance: Math.round(shoesWithStats.reduce((s, x) => s + x.totalDistance, 0) * 10) / 10,
      avgLifespan: active.length > 0 ? Math.round(active.reduce((s, x) => s + x.wearPercent, 0) / active.length) : 0,
      warningCount: active.filter(s => s.status === 'warning' || s.status === 'overdue').length,
    }

    return NextResponse.json({ shoes: shoesWithStats, summary })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// 新增跑鞋
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const shoe = await db.shoe.create({
      data: {
        name: body.name,
        brand: body.brand || null,
        model: body.model || null,
        type: body.type || 'daily',
        color: body.color || null,
        purchasedAt: body.purchasedAt ? new Date(body.purchasedAt) : new Date(),
        lifespan: body.lifespan ? parseInt(body.lifespan) : 800,
        notes: body.notes || null,
      },
    })
    return NextResponse.json({ shoe })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
