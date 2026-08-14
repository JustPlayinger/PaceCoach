import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 获取跨周训练趋势统计
export async function GET() {
  try {
    const weeks = await db.trainingWeek.findMany({
      include: {
        sessions: {
          include: { completion: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { weekStart: 'asc' },
    })

    // 按周聚合
    const weeklyStats = weeks.map((w) => {
      const completed = w.sessions.filter((s) => s.status === 'completed' && s.completion)
      const plannedDistance = w.sessions.reduce((sum, s) => sum + (s.plannedDistance || 0), 0)
      const actualDistance = completed.reduce((sum, s) => sum + (s.completion!.distance || 0), 0)
      const totalDuration = completed.reduce((sum, s) => sum + (s.completion!.duration || 0), 0)
      const avgPaces = completed
        .map((s) => s.completion!.avgPaceSec)
        .filter((v): v is number => v != null)
      const avgHrs = completed
        .map((s) => s.completion!.avgHr)
        .filter((v): v is number => v != null)
      const elevations = completed
        .map((s) => s.completion!.elevation)
        .filter((v): v is number => v != null)
      const rpes = completed
        .map((s) => s.completion!.rpe)
        .filter((v): v is number => v != null)
      const feelings = completed
        .map((s) => s.completion!.feeling)
        .filter((v): v is number => v != null)
      const completionRate = plannedDistance > 0 ? Math.min(100, Math.round((actualDistance / plannedDistance) * 100)) : 0

      return {
        weekId: w.id,
        weekNumber: w.weekNumber ?? 0,
        weekStart: w.weekStart.toISOString(),
        weekEnd: w.weekEnd.toISOString(),
        phase: w.phase || 'base',
        plannedDistance,
        actualDistance,
        totalDuration,
        completionRate,
        avgPaceSec: avgPaces.length > 0 ? Math.round(avgPaces.reduce((a, b) => a + b, 0) / avgPaces.length) : null,
        avgHr: avgHrs.length > 0 ? Math.round(avgHrs.reduce((a, b) => a + b, 0) / avgHrs.length) : null,
        totalElevation: elevations.reduce((a, b) => a + b, 0),
        avgRpe: rpes.length > 0 ? Math.round((rpes.reduce((a, b) => a + b, 0) / rpes.length) * 10) / 10 : null,
        avgFeeling: feelings.length > 0 ? Math.round((feelings.reduce((a, b) => a + b, 0) / feelings.length) * 10) / 10 : null,
        completedCount: completed.length,
        totalSessions: w.sessions.length,
      }
    })

    // 按训练类型聚合（全部历史）
    const typeStats: Record<string, { count: number; distance: number; duration: number }> = {}
    for (const w of weeks) {
      for (const s of w.sessions) {
        if (s.status === 'completed' && s.completion) {
          if (!typeStats[s.type]) typeStats[s.type] = { count: 0, distance: 0, duration: 0 }
          typeStats[s.type].count++
          typeStats[s.type].distance += s.completion.distance || 0
          typeStats[s.type].duration += s.completion.duration || 0
        }
      }
    }

    // 最近 4 周心率区间分布（基于 maxHr & restingHr 估算）
    const runner = await db.runner.findFirst()
    const hrZoneDistribution = { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0 }
    if (runner?.maxHr && runner?.restingHr) {
      const maxHr = runner.maxHr
      const restHr = runner.restingHr
      const zones = [
        { zone: 'Z1', min: restHr, max: restHr + (maxHr - restHr) * 0.5 },
        { zone: 'Z2', min: restHr + (maxHr - restHr) * 0.5, max: restHr + (maxHr - restHr) * 0.6 },
        { zone: 'Z3', min: restHr + (maxHr - restHr) * 0.6, max: restHr + (maxHr - restHr) * 0.7 },
        { zone: 'Z4', min: restHr + (maxHr - restHr) * 0.7, max: restHr + (maxHr - restHr) * 0.8 },
        { zone: 'Z5', min: restHr + (maxHr - restHr) * 0.8, max: maxHr },
      ]
      for (const w of weeks.slice(-4)) {
        for (const s of w.sessions) {
          if (s.status === 'completed' && s.completion?.avgHr) {
            const hr = s.completion.avgHr
            for (const z of zones) {
              if (hr >= z.min && hr < z.max) {
                hrZoneDistribution[z.zone as keyof typeof hrZoneDistribution]++
                break
              }
            }
          }
        }
      }
    }

    // 总体统计
    const totalDistance = weeklyStats.reduce((s, w) => s + w.actualDistance, 0)
    const totalDuration = weeklyStats.reduce((s, w) => s + w.totalDuration, 0)
    const totalRuns = weeklyStats.reduce((s, w) => s + w.completedCount, 0)
    const avgPaceOverall = weeklyStats.filter(w => w.avgPaceSec).length > 0
      ? Math.round(weeklyStats.filter(w => w.avgPaceSec).reduce((s, w) => s + (w.avgPaceSec || 0), 0) / weeklyStats.filter(w => w.avgPaceSec).length)
      : null

    return NextResponse.json({
      weeklyStats,
      typeStats: Object.entries(typeStats).map(([type, v]) => ({ type, ...v })),
      hrZoneDistribution,
      overall: {
        totalWeeks: weeks.length,
        totalDistance: Math.round(totalDistance * 10) / 10,
        totalDuration,
        totalRuns,
        avgPaceSec: avgPaceOverall,
        avgWeeklyDistance: weeks.length > 0 ? Math.round((totalDistance / weeks.length) * 10) / 10 : 0,
      },
    })
  } catch (e) {
    console.error('Stats error:', e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
