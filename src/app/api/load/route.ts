import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 训练负荷管理：计算 ACWR（急性/慢性负荷比）+ 伤病预警
export async function GET() {
  try {
    const weeks = await db.trainingWeek.findMany({
      include: {
        sessions: { include: { completion: true } },
      },
      orderBy: { weekStart: 'asc' },
    })

    // 计算每周训练负荷（基于 TRIMP 简化版：距离 × 强度系数）
    // 强度系数：easy/recovery=1, tempo=1.5, interval=2, long=1.2, rest=0
    const intensityFactor: Record<string, number> = {
      easy: 1, recovery: 0.8, tempo: 1.5, interval: 2, long: 1.2, rest: 0, cross: 0.5,
    }

    const weeklyLoads = weeks.map(w => {
      const completed = w.sessions.filter(s => s.status === 'completed' && s.completion)
      // 负荷 = 距离 × 强度系数（基于训练类型）
      let load = 0
      let distance = 0
      let duration = 0
      for (const s of completed) {
        const dist = s.completion!.distance || 0
        const factor = intensityFactor[s.type] || 1
        load += dist * factor
        distance += dist
        duration += s.completion!.duration || 0
      }
      // 额外考虑 RPE（若有）：RPE × 时长(小时) 作为内部负荷
      let rpeLoad = 0
      for (const s of completed) {
        if (s.completion!.rpe && s.completion!.duration) {
          rpeLoad += s.completion!.rpe * (s.completion!.duration / 3600)
        }
      }
      return {
        weekNumber: w.weekNumber ?? 0,
        weekStart: w.weekStart.toISOString().slice(0, 10),
        weekEnd: w.weekEnd.toISOString().slice(0, 10),
        phase: w.phase || 'base',
        load: Math.round(load * 10) / 10,
        rpeLoad: Math.round(rpeLoad * 10) / 10,
        distance: Math.round(distance * 10) / 10,
        duration,
        sessions: completed.length,
      }
    })

    // 计算 ACWR
    // 慢性负荷 CL = 最近 4 周平均负荷
    // 急性负荷 AL = 最近 1 周负荷
    const recent4 = weeklyLoads.slice(-4)
    const recent1 = weeklyLoads.slice(-1)[0]

    let chronicLoad = 0
    let acuteLoad = 0
    let acwr = 0
    let loadStatus = 'no-data'
    let riskLevel = 'unknown'
    let advice = ''

    if (recent4.length > 0) {
      chronicLoad = recent4.reduce((s, w) => s + w.load, 0) / recent4.length
      chronicLoad = Math.round(chronicLoad * 10) / 10
    }
    if (recent1) {
      acuteLoad = recent1.load
    }
    if (chronicLoad > 0) {
      acwr = Math.round((acuteLoad / chronicLoad) * 100) / 100
      // 判断风险等级
      if (acwr < 0.8) {
        loadStatus = 'undertrained'
        riskLevel = 'low'
        advice = '训练负荷偏低，慢性负荷基础不足。建议逐步增加跑量（每周增幅≤10%），建立有氧基础。'
      } else if (acwr <= 1.3) {
        loadStatus = 'optimal'
        riskLevel = 'safe'
        advice = '训练负荷处于最佳区间，急性负荷与慢性负荷匹配良好。保持当前节奏，注意恢复。'
      } else if (acwr <= 1.5) {
        loadStatus = 'high'
        riskLevel = 'caution'
        advice = '训练负荷偏高，急性负荷增长较快。建议安排 1-2 天恢复跑或休息，避免连续高强度。'
      } else {
        loadStatus = 'dangerous'
        riskLevel = 'danger'
        advice = '⚠️ 训练负荷过高，伤病风险显著增加！建议立即减量，安排 2-3 天轻松训练或完全休息，充分恢复后再逐步恢复训练。'
      }
    }

    // 周跑量变化趋势（用于显示负荷曲线）
    const loadTrend = weeklyLoads.slice(-8).map(w => ({
      name: `W${w.weekNumber}`,
      load: w.load,
      distance: w.distance,
      phase: w.phase,
    }))

    // 7 天滚动负荷（按天聚合，更精确的急性负荷）
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    const sevenDaysAgo = new Date(today.getTime() - 7 * 86400000)
    sevenDaysAgo.setHours(0, 0, 0, 0)
    const twentyEightDaysAgo = new Date(today.getTime() - 28 * 86400000)
    twentyEightDaysAgo.setHours(0, 0, 0, 0)

    let acute7Days = 0
    let chronic28Days = 0
    for (const w of weeks) {
      for (const s of w.sessions) {
        if (s.status === 'completed' && s.completion) {
          const sessionDate = new Date(s.date)
          const dist = s.completion.distance || 0
          const factor = intensityFactor[s.type] || 1
          const load = dist * factor
          if (sessionDate >= sevenDaysAgo && sessionDate <= today) {
            acute7Days += load
          }
          if (sessionDate >= twentyEightDaysAgo && sessionDate <= today) {
            chronic28Days += load
          }
        }
      }
    }
    chronic28Days = chronic28Days / 4 // 转为周均值
    const dailyACWR = chronic28Days > 0 ? Math.round((acute7Days / chronic28Days) * 100) / 100 : 0

    return NextResponse.json({
      weeklyLoads: weeklyLoads.slice(-8),
      loadTrend,
      current: {
        acuteLoad: Math.round(acuteLoad * 10) / 10,
        chronicLoad,
        acwr,
        loadStatus,
        riskLevel,
        advice,
        acute7Days: Math.round(acute7Days * 10) / 10,
        chronic28Days: Math.round(chronic28Days * 10) / 10,
        dailyACWR,
      },
      summary: {
        totalWeeks: weeks.length,
        avgWeeklyLoad: weeklyLoads.length > 0 ? Math.round((weeklyLoads.reduce((s, w) => s + w.load, 0) / weeklyLoads.length) * 10) / 10 : 0,
        maxWeeklyLoad: weeklyLoads.length > 0 ? Math.max(...weeklyLoads.map(w => w.load)) : 0,
      },
    })
  } catch (e) {
    console.error('Load error:', e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
