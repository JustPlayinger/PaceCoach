import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateMicroAdjust, type SessionForReview, type RunnerProfile } from '@/lib/ai'

// 生成本周剩余训练的微调建议
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { weekId, userNote } = body as { weekId: string; userNote?: string }

    const week = await db.trainingWeek.findUnique({
      where: { id: weekId },
      include: { sessions: { include: { completion: true }, orderBy: { order: 'asc' } } },
    })
    if (!week) return NextResponse.json({ error: 'Week not found' }, { status: 404 })

    const runner = await db.runner.findFirst()
    if (!runner) return NextResponse.json({ error: 'Runner profile not found' }, { status: 400 })

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

    const toReview = (s: typeof week.sessions[number]): SessionForReview => ({
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
          }
        : null,
    })

    const now = new Date()
    const completed = week.sessions.filter((s) => s.status === 'completed' || s.date < now).map(toReview)
    const remaining = week.sessions.filter((s) => s.status !== 'completed' && s.date >= now).map(toReview)

    const content = await generateMicroAdjust(runnerProfile, remaining, completed, userNote || '')

    await db.aIReview.create({
      data: {
        weekId: week.id,
        type: 'micro_adjust',
        content,
      },
    })

    return NextResponse.json({ content })
  } catch (e) {
    console.error('Adjust error:', e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
