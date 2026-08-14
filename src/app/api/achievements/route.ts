import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 训练成就与徽章系统
export async function GET() {
  try {
    // 收集所有已完成训练
    const weeks = await db.trainingWeek.findMany({
      include: { sessions: { include: { completion: true } } },
      orderBy: { weekStart: 'asc' },
    })
    const runner = await db.runner.findFirst()
    const shoes = await db.shoe.findMany({ include: { usages: true } })
    const records = await db.personalRecord.findMany()

    const completedSessions = []
    for (const w of weeks) {
      for (const s of w.sessions) {
        if (s.status === 'completed' && s.completion) {
          completedSessions.push({
            date: new Date(s.date),
            type: s.type,
            distance: s.completion.distance || 0,
            duration: s.completion.duration || 0,
            avgPaceSec: s.completion.avgPaceSec,
            avgHr: s.completion.avgHr,
            rpe: s.completion.rpe,
            feeling: s.completion.feeling,
          })
        }
      }
    }

    const totalDistance = completedSessions.reduce((s, x) => s + x.distance, 0)
    const totalDuration = completedSessions.reduce((s, x) => s + x.duration, 0)
    const totalRuns = completedSessions.length
    const longestRun = completedSessions.reduce((max, s) => Math.max(max, s.distance), 0)
    const totalWeeks = weeks.length

    // 计算最长连续训练天数（按天去重，连续有训练的天）
    const trainingDays = new Set(completedSessions.map(s => s.date.toISOString().slice(0, 10)))
    const sortedDays = Array.from(trainingDays).sort()
    let currentStreak = 0
    let maxStreak = 0
    let prevDate: Date | null = null
    for (const dayStr of sortedDays) {
      const day = new Date(dayStr)
      if (prevDate) {
        const diff = (day.getTime() - prevDate.getTime()) / 86400000
        if (diff === 1) {
          currentStreak++
        } else {
          currentStreak = 1
        }
      } else {
        currentStreak = 1
      }
      maxStreak = Math.max(maxStreak, currentStreak)
      prevDate = day
    }

    // 检查是否本周有训练（用于"坚持训练"成就）
    const now = new Date()
    const thisWeekStart = new Date(now)
    const dayOfWeek = now.getDay()
    thisWeekStart.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    thisWeekStart.setHours(0, 0, 0, 0)
    const hasThisWeekTraining = completedSessions.some(s => s.date >= thisWeekStart)

    // 成就定义
    const achievements = [
      // 距离类
      { id: 'first-run', category: 'distance', icon: '🎯', name: '初次起跑', desc: '完成第一次训练', target: 1, current: totalRuns, unit: '次', unlocked: totalRuns >= 1 },
      { id: 'runs-10', category: 'distance', icon: '🏃', name: '十次训练', desc: '累计完成 10 次训练', target: 10, current: totalRuns, unit: '次', unlocked: totalRuns >= 10 },
      { id: 'runs-50', category: 'distance', icon: '🏃‍♂️', name: '半百训练', desc: '累计完成 50 次训练', target: 50, current: totalRuns, unit: '次', unlocked: totalRuns >= 50 },
      { id: 'runs-100', category: 'distance', icon: '💯', name: '百次训练', desc: '累计完成 100 次训练', target: 100, current: totalRuns, unit: '次', unlocked: totalRuns >= 100 },
      // 累计距离
      { id: 'dist-50', category: 'distance', icon: '📍', name: '50 公里', desc: '累计跑量达 50km', target: 50, current: Math.round(totalDistance), unit: 'km', unlocked: totalDistance >= 50 },
      { id: 'dist-100', category: 'distance', icon: '🏅', name: '百公里', desc: '累计跑量达 100km', target: 100, current: Math.round(totalDistance), unit: 'km', unlocked: totalDistance >= 100 },
      { id: 'dist-500', category: 'distance', icon: '🏆', name: '五百公里', desc: '累计跑量达 500km', target: 500, current: Math.round(totalDistance), unit: 'km', unlocked: totalDistance >= 500 },
      { id: 'dist-1000', category: 'distance', icon: '👑', name: '千公里俱乐部', desc: '累计跑量达 1000km', target: 1000, current: Math.round(totalDistance), unit: 'km', unlocked: totalDistance >= 1000 },
      // 单次距离
      { id: 'single-5', category: 'distance', icon: '5️⃣', name: '5K 达成', desc: '单次训练达 5km', target: 5, current: Math.round(longestRun * 10) / 10, unit: 'km', unlocked: longestRun >= 5 },
      { id: 'single-10', category: 'distance', icon: '🔟', name: '10K 达成', desc: '单次训练达 10km', target: 10, current: Math.round(longestRun * 10) / 10, unit: 'km', unlocked: longestRun >= 10 },
      { id: 'single-21', category: 'distance', icon: '🌟', name: '半马达成', desc: '单次训练达 21km', target: 21, current: Math.round(longestRun * 10) / 10, unit: 'km', unlocked: longestRun >= 21 },
      { id: 'single-42', category: 'distance', icon: '💫', name: '全马达成', desc: '单次训练达 42km', target: 42, current: Math.round(longestRun * 10) / 10, unit: 'km', unlocked: longestRun >= 42 },
      // 坚持类
      { id: 'streak-3', category: 'streak', icon: '🔥', name: '三日连跑', desc: '连续 3 天有训练', target: 3, current: maxStreak, unit: '天', unlocked: maxStreak >= 3 },
      { id: 'streak-7', category: 'streak', icon: '⚡', name: '七日连跑', desc: '连续 7 天有训练', target: 7, current: maxStreak, unit: '天', unlocked: maxStreak >= 7 },
      { id: 'streak-30', category: 'streak', icon: '🌟', name: '月度坚持', desc: '连续 30 天有训练', target: 30, current: maxStreak, unit: '天', unlocked: maxStreak >= 30 },
      { id: 'weeks-4', category: 'streak', icon: '📅', name: '一月训练', desc: '完成 4 个训练周', target: 4, current: totalWeeks, unit: '周', unlocked: totalWeeks >= 4 },
      { id: 'weeks-12', category: 'streak', icon: '📆', name: '季度训练', desc: '完成 12 个训练周', target: 12, current: totalWeeks, unit: '周', unlocked: totalWeeks >= 12 },
      { id: 'weeks-26', category: 'streak', icon: '🗓️', name: '半年坚持', desc: '完成 26 个训练周', target: 26, current: totalWeeks, unit: '周', unlocked: totalWeeks >= 26 },
      // 时长类
      { id: 'time-10h', category: 'time', icon: '⏰', name: '十小时训练', desc: '累计训练 10 小时', target: 10, current: Math.round(totalDuration / 3600 * 10) / 10, unit: 'h', unlocked: totalDuration >= 36000 },
      { id: 'time-50h', category: 'time', icon: '⌛', name: '五十小时训练', desc: '累计训练 50 小时', target: 50, current: Math.round(totalDuration / 3600 * 10) / 10, unit: 'h', unlocked: totalDuration >= 180000 },
      { id: 'time-100h', category: 'time', icon: '🕐', name: '百小时训练', desc: '累计训练 100 小时', target: 100, current: Math.round(totalDuration / 3600 * 10) / 10, unit: 'h', unlocked: totalDuration >= 360000 },
      // 特殊类
      { id: 'shoes-1', category: 'special', icon: '👟', name: '跑鞋管理', desc: '添加第一双跑鞋', target: 1, current: shoes.length, unit: '双', unlocked: shoes.length >= 1 },
      { id: 'shoes-3', category: 'special', icon: '👞', name: '跑鞋收藏家', desc: '添加 3 双跑鞋', target: 3, current: shoes.length, unit: '双', unlocked: shoes.length >= 3 },
      { id: 'pb-1', category: 'special', icon: '🥇', name: '首个 PB', desc: '记录第一个个人最好成绩', target: 1, current: records.length, unit: '项', unlocked: records.length >= 1 },
      { id: 'pb-all', category: 'special', icon: '📋', name: 'PB 大满贯', desc: '记录全部 6 个距离的 PB', target: 6, current: records.length, unit: '项', unlocked: records.length >= 6 },
      { id: 'vo2max-50', category: 'special', icon: '💪', name: 'VO2max 50+', desc: 'VO2max 达到 50', target: 50, current: runner?.vo2max || 0, unit: '', unlocked: (runner?.vo2max || 0) >= 50 },
      { id: 'vo2max-60', category: 'special', icon: '🔥', name: 'VO2max 60+', desc: 'VO2max 达到 60（精英级）', target: 60, current: runner?.vo2max || 0, unit: '', unlocked: (runner?.vo2max || 0) >= 60 },
    ]

    const unlockedCount = achievements.filter(a => a.unlocked).length
    const totalCount = achievements.length

    // 按类别分组
    const categories = {
      distance: { label: '距离里程', icon: '🏃', achievements: achievements.filter(a => a.category === 'distance') },
      streak: { label: '坚持训练', icon: '🔥', achievements: achievements.filter(a => a.category === 'streak') },
      time: { label: '训练时长', icon: '⏰', achievements: achievements.filter(a => a.category === 'time') },
      special: { label: '特殊成就', icon: '🏆', achievements: achievements.filter(a => a.category === 'special') },
    }

    return NextResponse.json({
      achievements,
      categories,
      summary: {
        unlocked: unlockedCount,
        total: totalCount,
        percent: Math.round((unlockedCount / totalCount) * 100),
        totalDistance: Math.round(totalDistance * 10) / 10,
        totalRuns,
        totalWeeks,
        maxStreak,
        longestRun: Math.round(longestRun * 10) / 10,
        totalHours: Math.round(totalDuration / 3600 * 10) / 10,
      },
    })
  } catch (e) {
    console.error('Achievements error:', e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
