import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 训练对比：获取两次完成记录的详细对比
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id1 = searchParams.get('id1')
    const id2 = searchParams.get('id2')

    if (!id1 || !id2) {
      return NextResponse.json({ error: '请提供两个训练课 ID' }, { status: 400 })
    }

    const [s1, s2] = await Promise.all([
      db.trainingSession.findUnique({
        where: { id: id1 },
        include: { completion: true, week: true },
      }),
      db.trainingSession.findUnique({
        where: { id: id2 },
        include: { completion: true, week: true },
      }),
    ])

    if (!s1 || !s2) return NextResponse.json({ error: '训练课不存在' }, { status: 404 })
    if (!s1.completion || !s2.completion) return NextResponse.json({ error: '请选择两次已完成的训练' }, { status: 400 })

    // 解析折线图数据
    function parseCurves(rawExtract: string | null) {
      if (!rawExtract) return {}
      try {
        const raw = JSON.parse(rawExtract)
        return {
          paceCurve: Array.isArray(raw.paceCurve) ? raw.paceCurve : null,
          hrCurve: Array.isArray(raw.hrCurve) ? raw.hrCurve : null,
          elevationCurve: Array.isArray(raw.elevationCurve) ? raw.elevationCurve : null,
          cadenceCurve: Array.isArray(raw.cadenceCurve) ? raw.cadenceCurve : null,
          splitPaces: Array.isArray(raw.splitPaces) ? raw.splitPaces : null,
        }
      } catch {
        return {}
      }
    }

    const c1 = s1.completion
    const c2 = s2.completion
    const curves1 = parseCurves(c1.rawExtract)
    const curves2 = parseCurves(c2.rawExtract)

    // 计算差值（第二次 - 第一次，正数=进步，负数=退步）
    const diff = (a: number | null | undefined, b: number | null | undefined): number | null => {
      if (a == null || b == null) return null
      return Math.round((b - a) * 10) / 10
    }

    // 配速差值：负数=变快（进步）
    const paceDiff = c1.avgPaceSec && c2.avgPaceSec ? c2.avgPaceSec - c1.avgPaceSec : null
    const distanceDiff = diff(c1.distance, c2.distance)
    const durationDiff = diff(c1.duration, c2.duration)
    const hrDiff = diff(c1.avgHr, c2.avgHr)
    const maxHrDiff = diff(c1.maxHr, c2.maxHr)
    const elevationDiff = diff(c1.elevation, c2.elevation)
    const cadenceDiff = diff(c1.cadence, c2.cadence)
    const caloriesDiff = diff(c1.calories, c2.calories)

    return NextResponse.json({
      session1: {
        id: s1.id,
        date: s1.date.toISOString(),
        type: s1.type,
        weekNumber: s1.week?.weekNumber || null,
        phase: s1.week?.phase || null,
        plannedDistance: s1.plannedDistance,
        plannedPace: s1.plannedPace,
        intensity: s1.intensity,
        completion: {
          distance: c1.distance,
          duration: c1.duration,
          avgPace: c1.avgPace,
          avgPaceSec: c1.avgPaceSec,
          avgHr: c1.avgHr,
          maxHr: c1.maxHr,
          elevation: c1.elevation,
          cadence: c1.cadence,
          calories: c1.calories,
          rpe: c1.rpe,
          feeling: c1.feeling,
          ...curves1,
        },
      },
      session2: {
        id: s2.id,
        date: s2.date.toISOString(),
        type: s2.type,
        weekNumber: s2.week?.weekNumber || null,
        phase: s2.week?.phase || null,
        plannedDistance: s2.plannedDistance,
        plannedPace: s2.plannedPace,
        intensity: s2.intensity,
        completion: {
          distance: c2.distance,
          duration: c2.duration,
          avgPace: c2.avgPace,
          avgPaceSec: c2.avgPaceSec,
          avgHr: c2.avgHr,
          maxHr: c2.maxHr,
          elevation: c2.elevation,
          cadence: c2.cadence,
          calories: c2.calories,
          rpe: c2.rpe,
          feeling: c2.feeling,
          ...curves2,
        },
      },
      diff: {
        distance: distanceDiff,
        duration: durationDiff,
        paceSec: paceDiff,
        avgHr: hrDiff,
        maxHr: maxHrDiff,
        elevation: elevationDiff,
        cadence: cadenceDiff,
        calories: caloriesDiff,
      },
    })
  } catch (e) {
    console.error('Compare error:', e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
