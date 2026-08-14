'use client'

import { useState, useEffect } from 'react'
import { Target, Calendar, TrendingUp, Timer, Gauge, Trophy, AlertCircle, Sparkles, Activity, Flame, Footprints, Rocket } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { SESSION_TYPES, formatDuration, secToPace } from '@/lib/training'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Area, AreaChart } from 'recharts'

interface GoalData {
  runner: { name: string; targetRace: string | null; targetDate: string | null; targetTime: string | null; weeklyMileage: number | null }
  timeline: { targetDate: string | null; daysRemaining: number; weeksRemaining: number; suggestedPhase: string; phaseAdvice: string }
  recent: { distance4Weeks: number; duration4Weeks: number; avgPaceSec: number | null; sessionsCount: number }
  total: { distance: number; duration: number; sessions: number; longestRun: number }
  estimate: { marathonSec: number | null; halfSec: number | null; tenKSec: number | null; marathonPaceSec: number | null }
  target: { paceSec: number | null }
  assessment: { probability: number; text: string }
  weeklyDistances: { week: number; distance: number; date: string }[]
}

export function GoalView() {
  const [data, setData] = useState<GoalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadGoal()
  }, [])

  async function loadGoal() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/goal')
      const d = await res.json()
      if (d.error) {
        setError(d.error)
      } else {
        setData(d)
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-12 text-center">
        <Target className="mx-auto h-10 w-10 text-slate-300 mb-3" />
        <p className="text-slate-500">{error || '请先在跑者档案中设置训练目标'}</p>
      </div>
    )
  }

  const { runner, timeline, recent, total, estimate, target, assessment, weeklyDistances } = data

  // 达标概率颜色
  const probColor = assessment.probability >= 70 ? 'text-emerald-600' : assessment.probability >= 45 ? 'text-amber-600' : 'text-rose-600'
  const probBg = assessment.probability >= 70 ? 'from-emerald-500 to-teal-600' : assessment.probability >= 45 ? 'from-amber-500 to-orange-600' : 'from-rose-500 to-red-600'

  // 配速对比
  const paceDiff = (estimate.marathonPaceSec && target.paceSec) ? estimate.marathonPaceSec - target.paceSec : null
  const paceDiffText = paceDiff != null
    ? paceDiff > 0
      ? `慢 ${Math.abs(paceDiff)}秒/km`
      : paceDiff < 0
        ? `快 ${Math.abs(paceDiff)}秒/km`
        : '完全匹配'
    : null

  // 周跑量数据
  const mileageData = weeklyDistances.map(w => ({ name: `W${w.week}`, 跑量: w.distance }))

  return (
    <div className="space-y-5">
      {/* 目标概览 Hero 卡片 */}
      <div className={`rounded-2xl border border-slate-200 bg-gradient-to-br ${probBg} p-5 sm:p-6 shadow-lg text-white relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24 blur-2xl" />
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">训练目标进度</h2>
                <p className="text-sm text-white/80">
                  {runner.targetRace || '未设定'} · 目标 {runner.targetTime || '-'}
                </p>
              </div>
            </div>
            {timeline.targetDate && (
              <div className="text-right">
                <div className="text-3xl font-bold leading-none">{timeline.daysRemaining}</div>
                <div className="text-xs text-white/80 mt-1">天后开赛 · {timeline.weeksRemaining} 周</div>
                <div className="text-[11px] text-white/70 mt-0.5">{new Date(timeline.targetDate).toLocaleDateString('zh-CN')}</div>
              </div>
            )}
          </div>

          {/* 达标概率 */}
          <div className="bg-white/15 backdrop-blur rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">达标概率评估</span>
              </div>
              <div className="text-2xl font-bold">{assessment.probability}%</div>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${assessment.probability}%` }}
              />
            </div>
            <p className="text-xs text-white/90">{assessment.text}</p>
          </div>
        </div>
      </div>

      {/* 训练阶段建议 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 shrink-0">
            <Rocket className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-slate-800">当前建议训练阶段</h3>
              <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">{timeline.suggestedPhase}</Badge>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{timeline.phaseAdvice}</p>
          </div>
        </div>
      </div>

      {/* 完赛时间预估 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-1.5">
          <Gauge className="h-4 w-4 text-emerald-600" />
          完赛时间预估（基于 Riegel 公式）
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <EstimateCard
            label="10K"
            icon={<Activity className="h-4 w-4" />}
            estimated={estimate.tenKSec}
            color="sky"
          />
          <EstimateCard
            label="半马"
            icon={<TrendingUp className="h-4 w-4" />}
            estimated={estimate.halfSec}
            color="orange"
          />
          <EstimateCard
            label="全马"
            icon={<Trophy className="h-4 w-4" />}
            estimated={estimate.marathonSec}
            targetPace={target.paceSec}
            estimatedPace={estimate.marathonPaceSec}
            paceDiffText={paceDiffText}
            color="emerald"
            highlight
          />
        </div>
        {paceDiffText && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-600">
              当前预估配速 vs 目标配速：<span className={`font-medium ${paceDiff! > 0 ? 'text-rose-600' : paceDiff! < 0 ? 'text-emerald-600' : 'text-slate-700'}`}>{paceDiffText}</span>
            </span>
          </div>
        )}
        {estimate.marathonSec === null && (
          <p className="mt-3 text-xs text-slate-400">完成至少一次训练后，将基于实际数据预估完赛时间</p>
        )}
      </div>

      {/* 数据概览 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 最近 4 周 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-emerald-600" />
            最近 4 周训练
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <MiniStat icon={<TrendingUp className="h-4 w-4" />} label="总距离" value={`${recent.distance4Weeks}`} unit="km" color="emerald" />
            <MiniStat icon={<Timer className="h-4 w-4" />} label="总时长" value={formatDuration(recent.duration4Weeks)} unit="" color="orange" />
            <MiniStat icon={<Footprints className="h-4 w-4" />} label="训练次数" value={`${recent.sessionsCount}`} unit="次" color="sky" />
            <MiniStat icon={<Gauge className="h-4 w-4" />} label="平均配速" value={recent.avgPaceSec ? secToPace(recent.avgPaceSec)?.replace('/km', '') || '-' : '-'} unit="/km" color="purple" />
          </div>
        </div>

        {/* 累计统计 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-emerald-600" />
            累计训练统计
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <MiniStat icon={<TrendingUp className="h-4 w-4" />} label="累计距离" value={`${total.distance}`} unit="km" color="emerald" />
            <MiniStat icon={<Timer className="h-4 w-4" />} label="累计时长" value={formatDuration(total.duration)} unit="" color="orange" />
            <MiniStat icon={<Activity className="h-4 w-4" />} label="训练次数" value={`${total.sessions}`} unit="次" color="sky" />
            <MiniStat icon={<Trophy className="h-4 w-4" />} label="最长单次" value={`${total.longestRun}`} unit="km" color="purple" />
          </div>
        </div>
      </div>

      {/* 周跑量趋势 + 目标线 */}
      {mileageData.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            周跑量趋势 vs 目标周跑量
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={mileageData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="mileageGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}
                formatter={(v: number) => [`${v} km`, '周跑量']}
              />
              {runner.weeklyMileage != null && (
                <ReferenceLine y={runner.weeklyMileage} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 5" label={{ value: `目标 ${runner.weeklyMileage}km`, fontSize: 10, fill: '#f59e0b', position: 'right' }} />
              )}
              <Area type="monotone" dataKey="跑量" stroke="#10b981" strokeWidth={2.5} fill="url(#mileageGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function EstimateCard({ label, icon, estimated, color, highlight, targetPace, estimatedPace, paceDiffText }: {
  label: string
  icon: React.ReactNode
  estimated: number | null
  color: string
  highlight?: boolean
  targetPace?: number | null
  estimatedPace?: number | null
  paceDiffText?: string | null
}) {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    sky: { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  }
  const c = colorMap[color] || colorMap.emerald
  return (
    <div className={`rounded-xl border p-4 ${highlight ? `${c.bg} ${c.border} ring-1 ring-emerald-200` : 'border-slate-100 bg-slate-50/50'}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-flex items-center justify-center h-7 w-7 rounded-lg ${c.bg} ${c.text}`}>{icon}</span>
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {highlight && <Badge variant="outline" className={`text-[10px] ${c.bg} ${c.text} ${c.border}`}>主要目标</Badge>}
      </div>
      {estimated != null ? (
        <>
          <div className="text-xl font-bold text-slate-900 leading-tight">{formatDuration(estimated)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">预估完赛时间</div>
          {estimatedPace != null && (
            <div className="mt-1.5 text-xs text-slate-600">配速 <span className="font-medium">{secToPace(estimatedPace)}</span></div>
          )}
          {paceDiffText && (
            <div className="mt-1 text-[10px] text-slate-500">vs 目标：{paceDiffText}</div>
          )}
        </>
      ) : (
        <div className="text-slate-400 text-sm py-2">数据不足</div>
      )}
    </div>
  )
}

function MiniStat({ icon, label, value, unit, color }: { icon: React.ReactNode; label: string; value: string; unit: string; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600',
    sky: 'bg-sky-50 text-sky-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
      <div className={`inline-flex items-center justify-center h-7 w-7 rounded-lg mb-1.5 ${colorMap[color]}`}>{icon}</div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-lg font-bold text-slate-900">{value}</span>
        <span className="text-xs text-slate-400">{unit}</span>
      </div>
      <div className="text-[11px] text-slate-500">{label}</div>
    </div>
  )
}
