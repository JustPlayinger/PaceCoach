import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 更新跑鞋
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const shoe = await db.shoe.update({
      where: { id },
      data: {
        name: body.name ?? undefined,
        brand: body.brand ?? undefined,
        model: body.model ?? undefined,
        type: body.type ?? undefined,
        color: body.color ?? undefined,
        lifespan: body.lifespan != null ? parseInt(body.lifespan) : undefined,
        retired: body.retired ?? undefined,
        notes: body.notes ?? undefined,
      },
    })
    return NextResponse.json({ shoe })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// 删除跑鞋
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.shoe.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// 记录跑鞋使用（添加里程）
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const usage = await db.shoeUsage.create({
      data: {
        shoeId: id,
        completionId: body.completionId || null,
        distance: parseFloat(body.distance),
        date: body.date ? new Date(body.date) : new Date(),
        note: body.note || null,
      },
    })
    return NextResponse.json({ usage })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
