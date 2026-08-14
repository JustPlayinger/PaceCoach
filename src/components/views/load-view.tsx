'use client'

import { useState, useEffect, useCallback } from 'react'
import { Shield, AlertTriangle, CheckCircle2, TrendingUp, Activity, Gauge, Info, HeartPulse } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PHASE_LABELS } from '@/lib/training'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Cell, LineChart, Line, Area, AreaChart } from 'recharts'

interface WeeklyLoad {
  weekNumber: number
  weekStart: string
  weekEnd: string
  phase: string
  load: number
  rpeLoad: number
  distance: number
  duration: number
  sessions: number
}

interface LoadData {
  weeklyLoads: WeeklyLoad[]
  loadTrend: { name: string; load: number; distance: number; phase: string }[]
  current: {
    acuteLoad: number
    chronicLoad: number
    acwr: number
    loadStatus: string
    riskLevel: string
    advice: string
    acute7Days: number
    chronic28Days: number
    dailyACWR: number
  }
  summary: {
    totalWeeks: number
    avgWeeklyLoad: number
    maxWeeklyLoad: number
  }
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: typeof Shield; gradient: string }> = {
  undertrained: { label: '训练不足', color: 'text-sky-700', bgColor: 'bg-sky-50', borderColor: 'border-sky-200', icon: Info, gradient: 'from-sky-500 to-blue-600' },
  optimal: { label: '最佳区间', color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-600' },
  high: { label: '负荷偏高', color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', icon: AlertTriangle, gradient: 'from-amber-500 to-orange-600' },
  dangerous: { label: '过度训练', color: 'text-rose-700', bgColor: 'bg-rose-50', borderColor: 'border-rose-200', icon: AlertTriangle, gradient: 'from-rose-500 to-red-600' },
  'no-data': { label: '数据不足', color: 'text-slate-600', bgColor: 'bg-slate-50', borderColor: 'border-slate-200', icon: Info, gradient: 'from-slate-400 to-slate-500' },
}

export function LoadView() {
  const [data, setData] = useState<LoadData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/load')
      const d = await res.json()
      setData(d)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

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

  if (!data || data.weeklyLoads.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-12 text-center">
        <Shield className="mx-auto h-10 w-10 text-slate-300 mb-3" />
        <p className="text-slate-500">暂无训练负荷数据</p>
        <p className="text-xs text-slate-400 mt-1">完成几次训练后即可查看负荷分析</p>
      </div>
    )
  }

  const { current, weeklyLoads, loadTrend, summary } = data
  const statusCfg = STATUS_CONFIG[current.loadStatus] || STATUS_CONFIG['no-data']
  const StatusIcon = statusCfg.icon

  // ACWR 仪表盘位置（0-2 范围，1.0 为中心）
  const acwrPercent = Math.min(100, (current.acwr / 2) * 100)

  // 风险区间颜色
  const acwrZoneColor = current.acwr < 0.8 ? '#0ea5e9' : current.acwr <= 1.3 ? '#10b981' : current.acwr <= 1.5 ? '#f59e0b' : '#ef4444'

  return (
    <div className="space-y-5">
      {/* ACWR 核心卡片 */}
      <div className={`relative overflow-hidden rounded-2xl border shadow-lg ${statusCfg.borderColor} bg-gradient-to-br ${statusCfg.gradient} text-white`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">训练负荷管理</h2>
                <p className="text-xs text-white/80">ACWR 急性/慢性负荷比 · 伤病预警</p>
              </div>
            </div>
            <Badge className="bg-white/20 text-white border-white/30 backdrop-blur">
              <StatusIcon className="h-3 w-3 mr-1" />{statusCfg.label}
            </Badge>
          </div>

          {/* ACWR 数值 */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="bg-white/15 backdrop-blur rounded-xl p-3 text-center">
              <div className="text-[10px] text-white/70 uppercase tracking-wider mb-1">急性负荷 AL</div>
              <div className="text-2xl font-bold tabular-nums">{current.acuteLoad}</div>
              <div className="text-[10px] text-white/60">最近 1 周</div>
            </div>
            <div className="bg-white/25 backdrop-blur rounded-xl p-3 text-center ring-1 ring-white/30">
              <div className="text-[10px] text-white/70 uppercase tracking-wider mb-1">ACWR 比值</div>
              <div className="text-3xl font-bold tabular-nums">{current.acwr.toFixed(2)}</div>
              <div className="text-[10px] text-white/60">AL / CL</div>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-xl p-3 text-center">
              <div className="text-[10px] text-white/70 uppercase tracking-wider mb-1">慢性负荷 CL</div>
              <div className="text-2xl font-bold tabular-nums">{current.chronicLoad}</div>
              <div className="text-[10px] text-white/60">4 周均值</div>
            </div>
          </div>

          {/* ACWR 量表 */}
          <div className="bg-white/15 backdrop-blur rounded-xl p-4">
            <div className="flex justify-between text-[10px] text-white/70 mb-1.5">
              <span>0.5</span><span>0.8</span><span>1.0</span><span>1.3</span><span>1.5</span><span>2.0</span>
            </div>
            <div className="relative h-3 rounded-full overflow-hidden bg-white/20">
              <div className="absolute inset-0 flex">
                <div className="h-full bg-sky-400/40" style={{ width: '15%' }} />
                <div className="h-full bg-emerald-400/50" style={{ width: '25%' }} />
                <div className="h-full bg-amber-400/40" style={{ width: '10%' }} />
                <div className="h-full bg-rose-400/40" style={{ width: '50%' }} />
              </div>
              {/* 指针 */}
              <div
                className="absolute top-0 h-full w-1 bg-white shadow-lg"
                style={{ left: `${acwrPercent}%`, transform: 'translateX(-50%)' }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-white/60 mt-1">
              <span>训练不足</span><span>最佳区间</span><span>偏高</span><span>过度训练</span>
            </div>
          </div>

          {/* 建议 */}
          <div className="mt-4 bg-white/15 backdrop-blur rounded-xl p-3">
            <div className="flex items-start gap-2">
              <StatusIcon className="h-4 w-4 mt-0.5 shrink-0" />
              <p className="text-xs text-white/90 leading-relaxed">{current.advice}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 汇总统计 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryStat icon={<Activity className="h-4 w-4" />} label="累计训练周" value={`${summary.totalWeeks}`} unit="周" color="emerald" />
        <SummaryStat icon={<TrendingUp className="h-4 w-4" />} label="平均周负荷" value={`${summary.avgWeeklyLoad}`} unit="" color="sky" />
        <SummaryStat icon={<Gauge className="h-4 w-4" />} label="最高周负荷" value={`${summary.maxWeeklyLoad}`} unit="" color="orange" />
        <SummaryStat icon={<HeartPulse className="h-4 w-4" />} label="7天滚动ACWR" value={current.dailyACWR > 0 ? current.dailyACWR.toFixed(2) : '-'} unit="" color="purple" />
      </div>

      {/* 负荷趋势图 */}
      {loadTrend.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            周训练负荷趋势
          </h3>
          <p className="text-[11px] text-slate-400 mb-3">负荷 = 距离 × 强度系数（轻松1.0/长跑1.2/节奏1.5/间歇2.0）</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={loadTrend} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}`, '训练负荷']} />
              {current.chronicLoad > 0 && (
                <ReferenceLine y={current.chronicLoad} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 5" label={{ value: `慢性负荷 ${current.chronicLoad}`, fontSize: 10, fill: '#f59e0b', position: 'right' }} />
              )}
              <Bar dataKey="load" radius={[6, 6, 0, 0]}>
                {loadTrend.map((entry, i) => {
                  // 当前周高亮
                  const isCurrent = i === loadTrend.length - 1
                  return <Cell key={i} fill={isCurrent ? acwrZoneColor : '#10b981'} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 周跑量与负荷对比 */}
      {loadTrend.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-emerald-600" />
            跑量 vs 负荷对比
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={loadTrend} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line yAxisId="left" type="monotone" dataKey="load" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} name="训练负荷" />
              <Line yAxisId="right" type="monotone" dataKey="distance" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" name="跑量(km)" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 justify-center mt-2 text-xs">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />训练负荷</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-sky-500" />跑量(km)</span>
          </div>
        </div>
      )}

      {/* 周负荷明细表 */}
      {weeklyLoads.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <Gauge className="h-4 w-4 text-emerald-600" />
              周负荷明细
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50/80 text-slate-500">
                <tr>
                  <th className="text-left font-medium px-3 py-2.5">周次</th>
                  <th className="text-left font-medium px-3 py-2.5">阶段</th>
                  <th className="text-right font-medium px-3 py-2.5">负荷</th>
                  <th className="text-right font-medium px-3 py-2.5">RPE负荷</th>
                  <th className="text-right font-medium px-3 py-2.5">跑量</th>
                  <th className="text-right font-medium px-3 py-2.5">时长</th>
                  <th className="text-right font-medium px-3 py-2.5">次数</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...weeklyLoads].reverse().map(w => (
                  <tr key={w.weekNumber} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2.5 font-medium text-slate-800">第 {w.weekNumber} 周</td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600">
                        {PHASE_LABELS[w.phase] || w.phase}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-emerald-700">{w.load}</td>
                    <td className="px-3 py-2.5 text-right text-orange-600">{w.rpeLoad > 0 ? w.rpeLoad : '-'}</td>
                    <td className="px-3 py-2.5 text-right text-slate-600">{w.distance}km</td>
                    <td className="px-3 py-2.5 text-right text-slate-600">{Math.round(w.duration / 60)}min</td>
                    <td className="px-3 py-2.5 text-right text-slate-600">{w.sessions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 说明 */}
      <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-3 flex items-start gap-2">
        <Info className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
        <div className="text-xs text-slate-600">
          <p className="font-medium text-emerald-800 mb-0.5">关于 ACWR（急性/慢性负荷比）</p>
          ACWR 是运动科学中预防伤病的核心指标。慢性负荷（CL）= 过去 4 周平均负荷，代表身体适应的训练量；
          急性负荷（AL）= 最近 1 周负荷，代表当前训练压力。比值 0.8-1.3 为最佳安全区间；
          {'<0.8'} 训练不足；1.3-1.5 需谨慎；{'>'}1.5 过度训练，伤病风险显著增加。
          建议每周增幅不超过 10%，循序渐进提升负荷。
        </div>
      </div>
    </div>
  )
}

const tooltipStyle = {
  fontSize: 12,
  borderRadius: 10,
  border: '1px solid #e2e8f0',
  padding: '8px 12px',
}

function SummaryStat({ icon, label, value, unit, color }: { icon: React.ReactNode; label: string; value: string; unit: string; color: string }) {
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
