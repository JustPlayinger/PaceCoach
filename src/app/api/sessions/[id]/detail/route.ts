import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { analyzeSingleSession } from '@/lib/ai'

// 获取单次训练完整详情（含 rawExtract 折线图数据）
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await db.trainingSession.findUnique({
      where: { id },
      include: { completion: true, week: true },
    })
    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // 解析 rawExtract 获取折线图数据
    let curves: { paceCurve?: number[] | null; hrCurve?: number[] | null; elevationCurve?: number[] | null } = {}
    if (session.completion?.rawExtract) {
      try {
        const raw = JSON.parse(session.completion.rawExtract)
        curves = {
          paceCurve: raw.paceCurve || null,
          hrCurve: raw.hrCurve || null,
          elevationCurve: raw.elevationCurve || null,
        }
      } catch {}
    }

    return NextResponse.json({
      session: {
        id: session.id,
        date: session.date.toISOString(),
        dayOfWeek: session.dayOfWeek,
        type: session.type,
        plannedDistance: session.plannedDistance,
        plannedDuration: session.plannedDuration,
        plannedPace: session.plannedPace,
        intensity: session.intensity,
        description: session.description,
        status: session.status,
        week: session.week ? {
          id: session.week.id,
          weekNumber: session.week.weekNumber,
          phase: session.week.phase,
          goal: session.week.goal,
        } : null,
      },
      completion: session.completion ? {
        distance: session.completion.distance,
        duration: session.completion.duration,
        avgPace: session.completion.avgPace,
        avgPaceSec: session.completion.avgPaceSec,
        avgHr: session.completion.avgHr,
        maxHr: session.completion.maxHr,
        elevation: session.completion.elevation,
        cadence: session.completion.cadence,
        calories: session.completion.calories,
        weather: session.completion.weather,
        temperature: session.completion.temperature,
        rpe: session.completion.rpe,
        feeling: session.completion.feeling,
        feelingNote: session.completion.feelingNote,
        notes: session.completion.notes,
        imageDataUrl: session.completion.imageDataUrl,
        createdAt: session.completion.createdAt.toISOString(),
      } : null,
      curves,
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// AI 单次训练分析
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await db.trainingSession.findUnique({
      where: { id },
      include: { completion: true, week: true },
    })
    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (!session.completion) return NextResponse.json({ error: '该训练尚未上传完成数据' }, { status: 400 })

    const runner = await db.runner.findFirst()
    if (!runner) return NextResponse.json({ error: '未找到跑者档案' }, { status: 400 })

    // 解析 rawExtract 中的折线图趋势数据
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
    if (session.completion.rawExtract) {
      try {
        const raw = JSON.parse(session.completion.rawExtract)
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

    const result = await analyzeSingleSession(
      {
        name: runner.name,
        age: runner.age,
        gender: runner.gender,
        weight: runner.weight,
        restingHr: runner.restingHr,
        maxHr: runner.maxHr,
        vo2max: runner.vo2max,
        experience: runner.experience,
        targetRace: runner.targetRace,
        targetTime: runner.targetTime,
        weeklyMileage: runner.weeklyMileage,
      },
      {
        type: session.type,
        plannedDistance: session.plannedDistance,
        plannedDuration: session.plannedDuration,
        plannedPace: session.plannedPace,
        intensity: session.intensity,
        description: session.description,
      },
      {
        distance: session.completion.distance,
        duration: session.completion.duration,
        avgPace: session.completion.avgPace,
        avgPaceSec: session.completion.avgPaceSec,
        avgHr: session.completion.avgHr,
        maxHr: session.completion.maxHr,
        elevation: session.completion.elevation,
        cadence: session.completion.cadence,
        rpe: session.completion.rpe,
        feeling: session.completion.feeling,
        feelingNote: session.completion.feelingNote,
        weather: session.completion.weather,
        temperature: session.completion.temperature,
        ...curveData,
      }
    )

    return NextResponse.json({ analysis: result })
  } catch (e) {
    console.error('Session detail AI error:', e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
