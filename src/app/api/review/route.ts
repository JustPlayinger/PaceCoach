import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateWeeklyReview, type SessionForReview, type RunnerProfile } from '@/lib/ai'

// 生成本周训练点评
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { weekId } = body as { weekId: string }

    const week = await db.trainingWeek.findUnique({
      where: { id: weekId },
      include: { sessions: { include: { completion: true }, orderBy: { order: 'asc' } } },
    })
    if (!week) return NextResponse.json({ error: 'Week not found' }, { status: 404 })

    const runner = await db.runner.findFirst()
    if (!runner) return NextResponse.json({ error: 'Runner profile not found' }, { status: 404 })

    const runnerProfile: RunnerProfile = {
      name: runner.name,
      age: runner.age,
      gender: runner.gender,
      weight: runner.weight,
      restingHr: runner.restingHr,
      maxHr: runner.maxHr,
      vo2max: runner.vo2max,
      experience: runner.experience,
      targetRace: runner.targetRace,
      targetDate: runner.targetDate,
      targetTime: runner.targetTime,
      weeklyMileage: runner.weeklyMileage,
      notes: runner.notes,
    }

    const sessionsForReview: SessionForReview[] = week.sessions.map((s) => {
      // 解析 rawExtract 中的折线图数据
      let curveData: {
        paceCurve?: number[] | null
        hrCurve?: number[] | null
        elevationCurve?: number[] | null
        cadenceCurve?: number[] | null
        splitPaces?: number[] | null
        curveAnalysis?: string | null
        vo2max?: number | null
        hrRecovery?: number | null
        groundContactTime?: number | null
        verticalOscillation?: number | null
        leftRightBalance?: number | null
        strideLength?: number | null
      } = {}
      if (s.completion?.rawExtract) {
        try {
          const raw = JSON.parse(s.completion.rawExtract)
          curveData = {
            paceCurve: Array.isArray(raw.paceCurve) ? raw.paceCurve : null,
            hrCurve: Array.isArray(raw.hrCurve) ? raw.hrCurve : null,
            elevationCurve: Array.isArray(raw.elevationCurve) ? raw.elevationCurve : null,
            cadenceCurve: Array.isArray(raw.cadenceCurve) ? raw.cadenceCurve : null,
            splitPaces: Array.isArray(raw.splitPaces) ? raw.splitPaces : null,
            curveAnalysis: typeof raw.curveAnalysis === 'string' ? raw.curveAnalysis : null,
            vo2max: typeof raw.vo2max === 'number' ? raw.vo2max : null,
            hrRecovery: typeof raw.hrRecovery === 'number' ? raw.hrRecovery : null,
            groundContactTime: typeof raw.groundContactTime === 'number' ? raw.groundContactTime : null,
            verticalOscillation: typeof raw.verticalOscillation === 'number' ? raw.verticalOscillation : null,
            leftRightBalance: typeof raw.leftRightBalance === 'number' ? raw.leftRightBalance : null,
            strideLength: typeof raw.strideLength === 'number' ? raw.strideLength : null,
          }
        } catch {}
      }
      return {
        date: s.date.toISOString(),
        dayOfWeek: s.dayOfWeek,
        type: s.type,
        plannedDistance: s.plannedDistance,
        plannedDuration: s.plannedDuration,
        plannedPace: s.plannedPace,
        intensity: s.intensity,
        description: s.description,
        status: s.status,
        completion: s.completion
          ? {
              distance: s.completion.distance,
              duration: s.completion.duration,
              avgPace: s.completion.avgPace,
              avgPaceSec: s.completion.avgPaceSec,
              avgHr: s.completion.avgHr,
              maxHr: s.completion.maxHr,
              elevation: s.completion.elevation,
              cadence: s.completion.cadence,
              rpe: s.completion.rpe,
              feeling: s.completion.feeling,
              feelingNote: s.completion.feelingNote,
              weather: s.completion.weather,
              temperature: s.completion.temperature,
              ...curveData,
            }
          : null,
      }
    })

    const result = await generateWeeklyReview(runnerProfile, week.goal, week.phase, sessionsForReview)

    const review = await db.aIReview.create({
      data: {
        weekId: week.id,
        type: 'weekly_review',
        content: result.content,
        rating: result.rating,
        suggestions: JSON.stringify(result.suggestions),
      },
    })

    // 更新 week summary
    await db.trainingWeek.update({
      where: { id: week.id },
      data: { summary: `本周评分 ${result.rating}/100。${result.content.slice(0, 200)}` },
    })

    return NextResponse.json({ review, rating: result.rating, content: result.content, suggestions: result.suggestions })
  } catch (e) {
    console.error('Review error:', e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
