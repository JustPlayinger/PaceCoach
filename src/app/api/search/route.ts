import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 全局搜索：跨训练课/周次/跑鞋/恢复记录/PB 搜索
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim().toLowerCase()

    if (!q || q.length < 1) {
      return NextResponse.json({ results: [], query: q || '' })
    }

    const results: Array<{
      type: string
      id: string
      title: string
      subtitle: string
      meta: string
      icon: string
    }> = []

    // 搜索训练周（按目标/阶段）
    const weeks = await db.trainingWeek.findMany({
      where: {
        OR: [
          { goal: { contains: q } },
          { phase: { contains: q } },
          { summary: { contains: q } },
        ],
      },
      include: { sessions: true },
      take: 5,
    })
    for (const w of weeks) {
      const completed = w.sessions.filter(s => s.status === 'completed').length
      results.push({
        type: 'week',
        id: w.id,
        title: `第 ${w.weekNumber} 周 · ${w.phase || '训练周'}`,
        subtitle: w.goal?.slice(0, 60) || '训练周',
        meta: `${w.sessions.length} 节训练 · ${completed} 完成`,
        icon: '📅',
      })
    }

    // 搜索训练课（按类型/描述/强度）
    const sessions = await db.trainingSession.findMany({
      where: {
        OR: [
          { type: { contains: q } },
          { description: { contains: q } },
          { intensity: { contains: q } },
        ],
      },
      include: { completion: true, week: true },
      take: 8,
    })
    for (const s of sessions) {
      const typeLabels: Record<string, string> = {
        easy: '轻松跑', tempo: '节奏跑', interval: '间歇跑', long: '长距离',
        recovery: '恢复跑', rest: '休息', cross: '交叉训练',
      }
      results.push({
        type: 'session',
        id: s.id,
        title: `${typeLabels[s.type] || s.type} · 第 ${s.week?.weekNumber || '?'} 周`,
        subtitle: s.description?.slice(0, 60) || '',
        meta: s.completion
          ? `已完成 · ${s.completion.distance}km @ ${s.completion.avgPace || '-'}`
          : `${s.plannedDistance || 0}km · 待完成`,
        icon: s.status === 'completed' ? '✅' : '⏳',
      })
    }

    // 搜索跑鞋（按名称/品牌/型号）
    const shoes = await db.shoe.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { brand: { contains: q } },
          { model: { contains: q } },
        ],
      },
      include: { usages: true },
      take: 5,
    })
    for (const sh of shoes) {
      const totalDist = sh.usages.reduce((s, u) => s + u.distance, 0)
      results.push({
        type: 'shoe',
        id: sh.id,
        title: `${sh.name}${sh.brand ? ` · ${sh.brand}` : ''}`,
        subtitle: sh.model || (sh.retired ? '已退役' : '在役'),
        meta: `${Math.round(totalDist)}km / ${sh.lifespan}km (${Math.round((totalDist / sh.lifespan) * 100)}%)`,
        icon: '👟',
      })
    }

    // 搜索恢复记录（按备注/补给）
    const recoveryLogs = await db.recoveryLog.findMany({
      where: {
        OR: [
          { notes: { contains: q } },
          { preRunFuel: { contains: q } },
          { duringFuel: { contains: q } },
          { postRunFuel: { contains: q } },
        ],
      },
      take: 5,
    })
    for (const l of recoveryLogs) {
      results.push({
        type: 'recovery',
        id: l.id,
        title: `恢复记录 · ${l.date.toISOString().slice(0, 10)}`,
        subtitle: l.notes?.slice(0, 60) || l.preRunFuel || '恢复记录',
        meta: `${l.sleepHours || '?'}h 睡眠 · ${l.waterIntake || '?'}L 饮水`,
        icon: '💚',
      })
    }

    // 搜索 PB 记录
    const records = await db.personalRecord.findMany({
      where: {
        OR: [
          { raceName: { contains: q } },
          { location: { contains: q } },
          { distance: { contains: q } },
        ],
      },
      take: 5,
    })
    for (const r of records) {
      const h = Math.floor(r.timeSec / 3600)
      const m = Math.floor((r.timeSec % 3600) / 60)
      const s = r.timeSec % 60
      const t = h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`
      results.push({
        type: 'record',
        id: r.id,
        title: `PB · ${r.distance} · ${t}`,
        subtitle: r.raceName || r.location || `${r.distanceKm}km 个人最好`,
        meta: `${r.date.toISOString().slice(0, 10)}${r.raceName ? ' · ' + r.raceName : ''}`,
        icon: '🏆',
      })
    }

    return NextResponse.json({
      results,
      query: q,
      total: results.length,
    })
  } catch (e) {
    console.error('Search error:', e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
