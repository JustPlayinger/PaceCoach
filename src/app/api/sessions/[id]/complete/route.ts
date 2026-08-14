import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 保存/更新训练完成记录
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const data = {
      distance: body.distance ?? null,
      duration: body.duration ?? null,
      avgPace: body.avgPace ?? null,
      avgPaceSec: body.avgPaceSec ?? null,
      avgHr: body.avgHr ?? null,
      maxHr: body.maxHr ?? null,
      elevation: body.elevation ?? null,
      cadence: body.cadence ?? null,
      calories: body.calories ?? null,
      weather: body.weather ?? null,
      temperature: body.temperature ?? null,
      rpe: body.rpe ?? null,
      feeling: body.feeling ?? null,
      feelingNote: body.feelingNote ?? null,
      imageDataUrl: body.imageDataUrl ?? null,
      rawExtract: body.rawExtract ?? null,
      notes: body.notes ?? null,
      shoeId: body.shoeId || null,
    }

    const existing = await db.trainingCompletion.findUnique({ where: { sessionId: id } })
    let completion
    if (existing) {
      completion = await db.trainingCompletion.update({ where: { sessionId: id }, data })
    } else {
      completion = await db.trainingCompletion.create({ data: { ...data, sessionId: id } })
    }

    // 更新 session 状态为已完成
    await db.trainingSession.update({ where: { id }, data: { status: 'completed' } })

    // 处理跑鞋里程关联
    const newShoeId = body.shoeId || null
    const oldShoeId = existing?.shoeId || null
    const distance = body.distance ?? null

    // 若关联的跑鞋发生变化：删除旧的 ShoeUsage，创建新的
    if (oldShoeId !== newShoeId) {
      // 删除旧的 usage（按 completionId）
      if (existing) {
        await db.shoeUsage.deleteMany({ where: { completionId: completion.id } })
      }
      // 创建新的 usage
      if (newShoeId && distance && distance > 0) {
        const session = await db.trainingSession.findUnique({ where: { id } })
        await db.shoeUsage.create({
          data: {
            shoeId: newShoeId,
            completionId: completion.id,
            distance,
            date: session?.date || new Date(),
          },
        })
      }
    } else if (newShoeId && distance != null) {
      // 同一跑鞋，仅更新里程
      await db.shoeUsage.updateMany({
        where: { completionId: completion.id, shoeId: newShoeId },
        data: { distance },
      })
    }

    return NextResponse.json({ completion })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// 获取单节完成记录
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const completion = await db.trainingCompletion.findUnique({ where: { sessionId: id } })
    return NextResponse.json({ completion })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
