'use client'

import { useState, useEffect, useCallback } from 'react'
import { GitCompare, ArrowRight, TrendingUp, TrendingDown, Minus, Loader2, Calendar, Activity, Heart, Gauge, Timer, Mountain, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { SESSION_TYPES, DAY_LABELS, PHASE_LABELS, formatDuration, secToPace } from '@/lib/training'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

interface CompletedSession {
  id: string
  date: string
  type: string
  weekNumber: number | null
  phase: string | null
  distance: number | null
  avgPace: string | null
  avgPaceSec: number | null
  avgHr: number | null
}

interface CompareData {
  session1: SessionDetail
  session2: SessionDetail
  diff: {
    distance: number | null
    duration: number | null
    paceSec: number | null
    avgHr: number | null
    maxHr: number | null
    elevation: number | null
    cadence: number | null
    calories: number | null
  }
}

interface SessionDetail {
  id: string
  date: string
  type: string
  weekNumber: number | null
  phase: string | null
  plannedDistance: number | null
  plannedPace: string | null
  intensity: string | null
  completion: {
    distance: number | null
    duration: number | null
    avgPace: string | null
    avgPaceSec: number | null
    avgHr: number | null
    maxHr: number | null
    elevation: number | null
    cadence: number | null
    calories: number | null
    rpe: number | null
    feeling: number | null
    paceCurve?: number[] | null
    hrCurve?: number[] | null
    elevationCurve?: number[] | null
    cadenceCurve?: number[] | null
    splitPaces?: number[] | null
  }
}

export function CompareView() {
  const { toast } = useToast()
  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([])
  const [id1, setId1] = useState<string>('')
  const [id2, setId2] = useState<string>('')
  const [compareData, setCompareData] = useState<CompareData | null>(null)
  const [loading, setLoading] = useState(true)
  const [comparing, setComparing] = useState(false)

  const loadSessions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/weeks')
      const data = await res.json()
      const all: CompletedSession[] = []
      for (const w of data.weeks || []) {
        for (const s of w.sessions || []) {
          if (s.status === 'completed' && s.completion) {
            all.push({
              id: s.id,
              date: s.date,
              type: s.type,
              weekNumber: w.weekNumber,
              phase: w.phase,
              distance: s.completion.distance,
              avgPace: s.completion.avgPace,
              avgPaceSec: s.completion.avgPaceSec,
              avgHr: s.completion.avgHr,
            })
          }
        }
      }
      // 按日期降序
      all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setCompletedSessions(all)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  const handleCompare = async () => {
    if (!id1 || !id2) {
      toast({ title: '请选择两次训练', variant: 'destructive' })
      return
    }
    if (id1 === id2) {
      toast({ title: '请选择不同的训练', variant: 'destructive' })
      return
    }
    setComparing(true)
    try {
      const res = await fetch(`/api/compare?id1=${id1}&id2=${id2}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setCompareData(data)
    } catch (e) {
      toast({ title: '对比失败', description: (e as Error).message, variant: 'destructive' })
    } finally {
      setComparing(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  if (completedSessions.length < 2) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-12 text-center">
        <GitCompare className="mx-auto h-10 w-10 text-slate-300 mb-3" />
        <p className="text-slate-500">需要至少 2 次已完成训练才能对比</p>
        <p className="text-xs text-slate-400 mt-1">当前已完成 {completedSessions.length} 次</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* 头部 */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-emerald-50/40 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <GitCompare className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">训练对比</h2>
            <p className="text-xs text-slate-500">对比两次训练数据 · 追踪进步轨迹</p>
          </div>
        </div>

        {/* 选择器 */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">训练 A（较早）</label>
            <Select value={id1} onValueChange={setId1}>
              <SelectTrigger><SelectValue placeholder="选择训练" /></SelectTrigger>
              <SelectContent>
                {completedSessions.map(s => {
                  const cfg = SESSION_TYPES[s.type] || SESSION_TYPES.easy
                  return (
                    <SelectItem key={s.id} value={s.id}>
                      {cfg.icon} W{s.weekNumber} · {new Date(s.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })} · {s.distance}km {s.avgPace ? `@ ${s.avgPace}` : ''}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-center pb-2">
            <ArrowRight className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">训练 B（较近）</label>
            <Select value={id2} onValueChange={setId2}>
              <SelectTrigger><SelectValue placeholder="选择训练" /></SelectTrigger>
              <SelectContent>
                {completedSessions.map(s => {
                  const cfg = SESSION_TYPES[s.type] || SESSION_TYPES.easy
                  return (
                    <SelectItem key={s.id} value={s.id}>
                      {cfg.icon} W{s.weekNumber} · {new Date(s.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })} · {s.distance}km {s.avgPace ? `@ ${s.avgPace}` : ''}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={handleCompare} disabled={comparing} className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 gap-1.5">
          {comparing ? <><Loader2 className="h-4 w-4 animate-spin" />对比中...</> : <><GitCompare className="h-4 w-4" />开始对比</>}
        </Button>
      </div>

      {/* 对比结果 */}
      {compareData && <CompareResult data={compareData} />}
    </div>
  )
}

function CompareResult({ data }: { data: CompareData }) {
  const { session1: s1, session2: s2, diff } = data
  const cfg1 = SESSION_TYPES[s1.type] || SESSION_TYPES.easy
  const cfg2 = SESSION_TYPES[s2.type] || SESSION_TYPES.easy

  // 判断进步/退步
  // 配速：负数=变快=进步
  // 心率：负数=变低=进步（同配速下心率更低）
  // 距离：正数=增加
  const getDiffIcon = (val: number | null, lowerIsBetter: boolean) => {
    if (val == null || val === 0) return <Minus className="h-3.5 w-3.5 text-slate-400" />
    const isBetter = lowerIsBetter ? val < 0 : val > 0
    return isBetter ? <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> : <TrendingDown className="h-3.5 w-3.5 text-rose-600" />
  }

  const getDiffText = (val: number | null, unit: string, lowerIsBetter: boolean) => {
    if (val == null) return '-'
    if (val === 0) return '持平'
    const sign = val > 0 ? '+' : ''
    const isBetter = lowerIsBetter ? val < 0 : val > 0
    const color = val === 0 ? 'text-slate-400' : isBetter ? 'text-emerald-600' : 'text-rose-600'
    return <span className={`font-medium ${color}`}>{sign}{val}{unit}</span>
  }

  // 折线图对比数据（对齐长度）
  const curveData = (curve1?: number[] | null, curve2?: number[] | null) => {
    if (!curve1 || !curve2) return null
    const len = Math.max(curve1.length, curve2.length)
    return Array.from({ length: len }, (_, i) => ({
      point: i + 1,
      '训练A': curve1[i] ?? null,
      '训练B': curve2[i] ?? null,
    }))
  }

  const hrCurveData = curveData(s1.completion.hrCurve, s2.completion.hrCurve)
  const paceCurveData = curveData(s1.completion.paceCurve, s2.completion.paceCurve)

  return (
    <div className="space-y-4">
      {/* 训练信息对比 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
          {/* 训练 A */}
          <div className="text-center">
            <div className={`inline-flex items-center justify-center h-12 w-12 rounded-xl text-2xl border mb-2 ${cfg1.bg}`}>
              {cfg1.icon}
            </div>
            <div className="text-sm font-semibold text-slate-800">训练 A</div>
            <div className="text-xs text-slate-500">{new Date(s1.date).toLocaleDateString('zh-CN')}</div>
            <Badge variant="outline" className="mt-1 text-[10px]">第 {s1.weekNumber} 周 · {PHASE_LABELS[s1.phase || ''] || s1.phase}</Badge>
          </div>

          <div className="flex flex-col items-center text-slate-400">
            <ArrowRight className="h-6 w-6" />
            <span className="text-[10px] mt-1">进步</span>
          </div>

          {/* 训练 B */}
          <div className="text-center">
            <div className={`inline-flex items-center justify-center h-12 w-12 rounded-xl text-2xl border mb-2 ${cfg2.bg}`}>
              {cfg2.icon}
            </div>
            <div className="text-sm font-semibold text-slate-800">训练 B</div>
            <div className="text-xs text-slate-500">{new Date(s2.date).toLocaleDateString('zh-CN')}</div>
            <Badge variant="outline" className="mt-1 text-[10px]">第 {s2.weekNumber} 周 · {PHASE_LABELS[s2.phase || ''] || s2.phase}</Badge>
          </div>
        </div>
      </div>

      {/* 数据对比表 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-1.5">
          <Activity className="h-4 w-4 text-emerald-600" />
          数据对比
        </h3>
        <div className="space-y-2">
          <CompareRow icon={<TrendingUp className="h-3.5 w-3.5" />} label="距离" val1={s1.completion.distance != null ? `${s1.completion.distance}` : '-'} val2={s2.completion.distance != null ? `${s2.completion.distance}` : '-'} unit="km" diff={diff.distance} diffIcon={getDiffIcon(diff.distance, false)} diffText={getDiffText(diff.distance, 'km', false)} />
          <CompareRow icon={<Gauge className="h-3.5 w-3.5" />} label="配速" val1={s1.completion.avgPace || '-'} val2={s2.completion.avgPace || '-'} unit="/km" diff={diff.paceSec} diffIcon={getDiffIcon(diff.paceSec, true)} diffText={diff.paceSec != null ? <span className={`font-medium ${diff.paceSec === 0 ? 'text-slate-400' : diff.paceSec < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{diff.paceSec === 0 ? '持平' : `${diff.paceSec > 0 ? '+' : ''}${diff.paceSec}s/km`}</span> : '-'} />
          <CompareRow icon={<Timer className="h-3.5 w-3.5" />} label="时长" val1={s1.completion.duration ? formatDuration(s1.completion.duration) : '-'} val2={s2.completion.duration ? formatDuration(s2.completion.duration) : '-'} unit="" diff={diff.duration} diffIcon={getDiffIcon(diff.duration, false)} diffText={diff.duration != null ? <span className={`font-medium ${diff.duration === 0 ? 'text-slate-400' : diff.duration < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{diff.duration === 0 ? '持平' : `${diff.duration > 0 ? '+' : ''}${Math.round(diff.duration / 60)}min`}</span> : '-'} />
          <CompareRow icon={<Heart className="h-3.5 w-3.5" />} label="平均心率" val1={s1.completion.avgHr ? `${s1.completion.avgHr}` : '-'} val2={s2.completion.avgHr ? `${s2.completion.avgHr}` : '-'} unit="bpm" diff={diff.avgHr} diffIcon={getDiffIcon(diff.avgHr, true)} diffText={getDiffText(diff.avgHr, 'bpm', true)} />
          <CompareRow icon={<Heart className="h-3.5 w-3.5" />} label="最大心率" val1={s1.completion.maxHr ? `${s1.completion.maxHr}` : '-'} val2={s2.completion.maxHr ? `${s2.completion.maxHr}` : '-'} unit="bpm" diff={diff.maxHr} diffIcon={getDiffIcon(diff.maxHr, true)} diffText={getDiffText(diff.maxHr, 'bpm', true)} />
          <CompareRow icon={<Activity className="h-3.5 w-3.5" />} label="步频" val1={s1.completion.cadence ? `${s1.completion.cadence}` : '-'} val2={s2.completion.cadence ? `${s2.completion.cadence}` : '-'} unit="spm" diff={diff.cadence} diffIcon={getDiffIcon(diff.cadence, false)} diffText={getDiffText(diff.cadence, 'spm', false)} />
          <CompareRow icon={<Mountain className="h-3.5 w-3.5" />} label="爬升" val1={s1.completion.elevation ? `${s1.completion.elevation}` : '-'} val2={s2.completion.elevation ? `${s2.completion.elevation}` : '-'} unit="m" diff={diff.elevation} diffIcon={getDiffIcon(diff.elevation, false)} diffText={getDiffText(diff.elevation, 'm', false)} />
          <CompareRow icon={<Flame className="h-3.5 w-3.5" />} label="卡路里" val1={s1.completion.calories ? `${s1.completion.calories}` : '-'} val2={s2.completion.calories ? `${s2.completion.calories}` : '-'} unit="kcal" diff={diff.calories} diffIcon={getDiffIcon(diff.calories, false)} diffText={getDiffText(diff.calories, 'kcal', false)} />
        </div>
      </div>

      {/* 心率曲线对比 */}
      {hrCurveData && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
            <Heart className="h-4 w-4 text-rose-500" />
            心率曲线对比
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={hrCurveData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="point" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} unit="bpm" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} bpm`, '']} labelFormatter={(l) => `第 ${l} 点`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="训练A" stroke="#94a3b8" strokeWidth={2} dot={false} strokeDasharray="5 5" connectNulls />
              <Line type="monotone" dataKey="训练B" stroke="#ef4444" strokeWidth={2.5} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 配速曲线对比 */}
      {paceCurveData && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
            <Gauge className="h-4 w-4 text-orange-500" />
            配速曲线对比（秒/km，越低越快）
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={paceCurveData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="point" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} unit="s" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [secToPace(v) || `${v}s`, '']} labelFormatter={(l) => `第 ${l} 点`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="训练A" stroke="#94a3b8" strokeWidth={2} dot={false} strokeDasharray="5 5" connectNulls />
              <Line type="monotone" dataKey="训练B" stroke="#f97316" strokeWidth={2.5} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 总结 */}
      <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-4">
        <h4 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-emerald-600" />
          进步总结
        </h4>
        <div className="space-y-1 text-xs text-slate-600">
          {diff.paceSec != null && diff.paceSec !== 0 && (
            <p>• 配速{diff.paceSec < 0 ? '提升' : '下降'}了 <span className="font-medium">{Math.abs(diff.paceSec)}秒/km</span></p>
          )}
          {diff.avgHr != null && diff.avgHr !== 0 && (
            <p>• 同等强度下心率{diff.avgHr < 0 ? '降低' : '升高'}了 <span className="font-medium">{Math.abs(diff.avgHr)} bpm</span>，{diff.avgHr < 0 ? '有氧能力提升' : '需关注疲劳'}</p>
          )}
          {diff.distance != null && diff.distance !== 0 && (
            <p>• 距离{diff.distance > 0 ? '增加' : '减少'}了 <span className="font-medium">{Math.abs(diff.distance)}km</span></p>
          )}
          {diff.cadence != null && diff.cadence !== 0 && (
            <p>• 步频{diff.cadence > 0 ? '提高' : '降低'}了 <span className="font-medium">{Math.abs(diff.cadence)} spm</span></p>
          )}
          {Object.values(diff).every(v => v == null || v === 0) && (
            <p>• 两次训练数据基本持平</p>
          )}
        </div>
      </div>
    </div>
  )
}

const tooltipStyle = {
  fontSize: 11,
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  padding: '6px 10px',
}

function CompareRow({ icon, label, val1, val2, unit, diffIcon, diffText }: {
  icon: React.ReactNode
  label: string
  val1: string
  val2: string
  unit: string
  diff: number | null
  diffIcon: React.ReactNode
  diffText: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[100px_1fr_1fr_1fr] gap-2 items-center py-2 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <span className="text-slate-400">{icon}</span>
        {label}
      </div>
      <div className="text-center text-sm text-slate-600">{val1}<span className="text-[10px] text-slate-400 ml-0.5">{unit}</span></div>
      <div className="text-center text-sm font-medium text-slate-800">{val2}<span className="text-[10px] text-slate-400 ml-0.5">{unit}</span></div>
      <div className="flex items-center justify-center gap-1 text-xs">
        {diffIcon}
        {diffText}
      </div>
    </div>
  )
}
