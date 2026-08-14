import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 获取训练目标进度：距目标赛事剩余周数、预估完赛时间、达标概率
export async function GET() {
  try {
    const runner = await db.runner.findFirst()
    if (!runner) {
      return NextResponse.json({ error: '未找到跑者档案' }, { status: 404 })
    }

    // 没有目标日期则返回基础信息
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let targetDate: Date | null = null
    let daysRemaining = 0
    let weeksRemaining = 0
    if (runner.targetDate) {
      targetDate = new Date(runner.targetDate)
      targetDate.setHours(0, 0, 0, 0)
      daysRemaining = Math.max(0, Math.ceil((targetDate.getTime() - today.getTime()) / 86400000))
      weeksRemaining = Math.ceil(daysRemaining / 7)
    }

    // 收集所有已完成训练
    const weeks = await db.trainingWeek.findMany({
      include: { sessions: { include: { completion: true } } },
      orderBy: { weekStart: 'asc' },
    })
    const completedSessions: {
      date: Date
      type: string
      distance: number
      duration: number
      avgPaceSec: number | null
      avgHr: number | null
      avgHrZone: string | null
    }[] = []
    for (const w of weeks) {
      for (const s of w.sessions) {
        if (s.status === 'completed' && s.completion) {
          completedSessions.push({
            date: new Date(s.date),
            type: s.type,
            distance: s.completion.distance || 0,
            duration: s.completion.duration || 0,
            avgPaceSec: s.completion.avgPaceSec || null,
            avgHr: s.completion.avgHr || null,
            avgHrZone: s.intensity,
          })
        }
      }
    }

    // 最近 4 周训练数据
    const fourWeeksAgo = new Date(today.getTime() - 28 * 86400000)
    const recentSessions = completedSessions.filter(s => s.date >= fourWeeksAgo)
    const recentDistance = recentSessions.reduce((s, x) => s + x.distance, 0)
    const recentDuration = recentSessions.reduce((s, x) => s + x.duration, 0)
    const recentPaces = recentSessions.map(s => s.avgPaceSec).filter((v): v is number => v != null)
    const recentAvgPace = recentPaces.length > 0 ? Math.round(recentPaces.reduce((a, b) => a + b, 0) / recentPaces.length) : null

    // 全部历史
    const totalDistance = completedSessions.reduce((s, x) => s + x.distance, 0)
    const totalDuration = completedSessions.reduce((s, x) => s + x.duration, 0)

    // 最长单次训练
    const longestRun = completedSessions.reduce((max, s) => Math.max(max, s.distance), 0)

    // 估算完赛时间（基于 Riegel 公式：T2 = T1 * (D2/D1)^1.06）
    // 用最近一次质量课或长跑推算全马
    let estimatedMarathonSec: number | null = null
    let estimatedHalfSec: number | null = null
    let estimated10KSec: number | null = null
    if (completedSessions.length > 0) {
      // 取最近一次 ≥ 10km 的训练作为基准
      const benchmark = completedSessions
        .filter(s => s.distance >= 10 && s.duration > 0)
        .sort((a, b) => b.date.getTime() - a.date.getTime())[0]
        || completedSessions.sort((a, b) => b.date.getTime() - a.date.getTime())[0]

      if (benchmark && benchmark.distance > 0 && benchmark.duration > 0) {
        const baseDist = benchmark.distance // km
        const baseSec = benchmark.duration // s
        const riegel = (targetDist: number) => baseSec * Math.pow(targetDist / baseDist, 1.06)
        estimatedMarathonSec = Math.round(riegel(42.195))
        estimatedHalfSec = Math.round(riegel(21.0975))
        estimated10KSec = Math.round(riegel(10))
      }
    }

    // 目标配速（基于 targetTime）
    let targetPaceSec: number | null = null
    if (runner.targetTime) {
      const m = runner.targetTime.match(/(\d+):(\d+):(\d+)/)
      if (m) {
        const totalSec = parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseInt(m[3])
        // 全马目标配速
        targetPaceSec = Math.round(totalSec / 42.195)
      } else {
        const m2 = runner.targetTime.match(/(\d+):(\d+)/)
        if (m2) {
          const totalSec = parseInt(m2[1]) * 3600 + parseInt(m2[2]) * 60
          targetPaceSec = Math.round(totalSec / 42.195)
        }
      }
    }

    // 达标概率评估
    let achievementProbability = 0
    let achievementAssessment = '数据不足'
    if (estimatedMarathonSec != null && runner.targetTime) {
      const m = runner.targetTime.match(/(\d+):(\d+):(\d+)/) || runner.targetTime.match(/(\d+):(\d+)/)
      if (m) {
        const targetSec = m.length === 4
          ? parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseInt(m[3])
          : parseInt(m[1]) * 3600 + parseInt(m[2]) * 60
        const ratio = targetSec / estimatedMarathonSec
        if (ratio >= 1.15) { achievementProbability = 90; achievementAssessment = '目标保守，达成概率高' }
        else if (ratio >= 1.05) { achievementProbability = 70; achievementAssessment = '目标合理，有望达成' }
        else if (ratio >= 0.95) { achievementProbability = 45; achievementAssessment = '目标有挑战，需全力以赴' }
        else if (ratio >= 0.85) { achievementProbability = 20; achievementAssessment = '目标偏激进，建议调整' }
        else { achievementProbability = 5; achievementAssessment = '目标过于激进，建议重新评估' }
      }
    }

    // 训练阶段建议（基于剩余周数）
    let suggestedPhase = '基础期'
    let phaseAdvice = ''
    if (weeksRemaining > 16) { suggestedPhase = '基础期'; phaseAdvice = '有充足时间打有氧基础，循序渐进增加跑量' }
    else if (weeksRemaining > 8) { suggestedPhase = '强化期'; phaseAdvice = '增加质量课比例，提升乳酸阈值与最大摄氧量' }
    else if (weeksRemaining > 4) { suggestedPhase = '巅峰期'; phaseAdvice = '模拟比赛配速，最长距离接近 30km' }
    else if (weeksRemaining > 1) { suggestedPhase = '减量期'; phaseAdvice = '逐步减量保持强度，储备体能' }
    else { suggestedPhase = '比赛周'; phaseAdvice = '充分休息，保持轻松跑激活，准备参赛' }

    // 周跑量趋势（最近 8 周）
    const weeklyDistances: { week: number; distance: number; date: string }[] = []
    const sortedWeeks = [...weeks].sort((a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime())
    for (const w of sortedWeeks) {
      const dist = w.sessions
        .filter(s => s.status === 'completed' && s.completion)
        .reduce((sum, s) => sum + (s.completion!.distance || 0), 0)
      weeklyDistances.push({
        week: w.weekNumber || 0,
        distance: Math.round(dist * 10) / 10,
        date: new Date(w.weekStart).toISOString().slice(0, 10),
      })
    }

    return NextResponse.json({
      runner: {
        name: runner.name,
        targetRace: runner.targetRace,
        targetDate: runner.targetDate,
        targetTime: runner.targetTime,
        weeklyMileage: runner.weeklyMileage,
      },
      timeline: {
        targetDate: targetDate?.toISOString() || null,
        daysRemaining,
        weeksRemaining,
        suggestedPhase,
        phaseAdvice,
      },
      recent: {
        distance4Weeks: Math.round(recentDistance * 10) / 10,
        duration4Weeks: recentDuration,
        avgPaceSec: recentAvgPace,
        sessionsCount: recentSessions.length,
      },
      total: {
        distance: Math.round(totalDistance * 10) / 10,
        duration: totalDuration,
        sessions: completedSessions.length,
        longestRun: Math.round(longestRun * 10) / 10,
      },
      estimate: {
        marathonSec: estimatedMarathonSec,
        halfSec: estimatedHalfSec,
        tenKSec: estimated10KSec,
        marathonPaceSec: estimatedMarathonSec ? Math.round(estimatedMarathonSec / 42.195) : null,
      },
      target: {
        paceSec: targetPaceSec,
      },
      assessment: {
        probability: achievementProbability,
        text: achievementAssessment,
      },
      weeklyDistances: weeklyDistances.slice(-8),
    })
  } catch (e) {
    console.error('Goal error:', e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
