'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { TrendingUp, Activity, Heart, Mountain, Timer, Gauge, Flame, Droplets, Loader2, Sparkles, BarChart3, PieChart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { SESSION_TYPES, PHASE_LABELS, formatDuration, secToPace, getWeekRange } from '@/lib/training'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, PieChart as RPieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Area, AreaChart } from 'recharts'

interface WeeklyStat {
  weekId: string
  weekNumber: number
  weekStart: string
  weekEnd: string
  phase: string
  plannedDistance: number
  actualDistance: number
  totalDuration: number
  completionRate: number
  avgPaceSec: number | null
  avgHr: number | null
  totalElevation: number
  avgRpe: number | null
  avgFeeling: number | null
  completedCount: number
  totalSessions: number
}

interface TypeStat {
  type: string
  count: number
  distance: number
  duration: number
}

const PHASE_COLORS: Record<string, string> = {
  base: '#10b981',
  build: '#f59e0b',
  peak: '#ef4444',
  taper: '#8b5cf6',
  recovery: '#06b6d4',
}

export function TrendsView() {
  const [stats, setStats] = useState<{
    weeklyStats: WeeklyStat[]
    typeStats: TypeStat[]
    hrZoneDistribution: Record<string, number>
    overall: {
      totalWeeks: number
      totalDistance: number
      totalDuration: number
      totalRuns: number
      avgPaceSec: number | null
      avgWeeklyDistance: number
    }
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    setLoading(true)
    try {
      const res = await fetch('/api/stats')
      const data = await res.json()
      setStats(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!stats || stats.weeklyStats.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-12 text-center">
        <TrendingUp className="mx-auto h-10 w-10 text-slate-300 mb-3" />
        <p className="text-slate-500">暂无训练数据</p>
        <p className="text-xs text-slate-400 mt-1">完成几次训练后即可查看趋势分析</p>
      </div>
    )
  }

  const { weeklyStats, typeStats, hrZoneDistribution, overall } = stats
  const hasData = overall.totalRuns > 0

  // 图表数据
  const distanceData = weeklyStats.map(w => ({
    name: `W${w.weekNumber}`,
    实际: Math.round(w.actualDistance * 10) / 10,
    计划: Math.round(w.plannedDistance * 10) / 10,
  }))

  const paceData = weeklyStats
    .filter(w => w.avgPaceSec != null)
    .map(w => ({
      name: `W${w.weekNumber}`,
      配速: w.avgPaceSec,
    }))

  const hrData = weeklyStats
    .filter(w => w.avgHr != null)
    .map(w => ({
      name: `W${w.weekNumber}`,
      心率: w.avgHr,
    }))

  const rpeData = weeklyStats
    .filter(w => w.avgRpe != null)
    .map(w => ({
      name: `W${w.weekNumber}`,
      RPE: w.avgRpe,
      体感: w.avgFeeling,
    }))

  const typePieData = typeStats.map(t => ({
    name: SESSION_TYPES[t.type]?.label || t.type,
    value: t.distance,
    type: t.type,
  }))

  const hrZoneData = Object.entries(hrZoneDistribution)
    .filter(([_, v]) => v > 0)
    .map(([zone, count]) => ({ zone, count }))

  const hrZoneColors: Record<string, string> = {
    Z1: '#94a3b8', Z2: '#10b981', Z3: '#f59e0b', Z4: '#f97316', Z5: '#ef4444',
  }

  return (
    <div className="space-y-5">
      {/* 总览卡片 */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-emerald-50/40 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">训练趋势分析</h2>
            <p className="text-xs text-slate-500">跨周期训练数据洞察 · 共 {overall.totalWeeks} 周</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <BigStat icon={<TrendingUp className="h-4 w-4" />} label="累计距离" value={`${overall.totalDistance}`} unit="km" color="emerald" sub={`均 ${overall.avgWeeklyDistance} km/周`} />
          <BigStat icon={<Timer className="h-4 w-4" />} label="累计时长" value={formatDuration(overall.totalDuration)} unit="" color="orange" sub={`${overall.totalRuns} 次训练`} />
          <BigStat icon={<Gauge className="h-4 w-4" />} label="平均配速" value={overall.avgPaceSec ? secToPace(overall.avgPaceSec)?.replace('/km', '') || '-' : '-'} unit="/km" color="purple" sub="全部训练均值" />
          <BigStat icon={<Activity className="h-4 w-4" />} label="训练周数" value={`${overall.totalWeeks}`} unit="周" color="sky" sub="周期化训练进度" />
        </div>
      </div>

      {!hasData && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          ⚠️ 尚无已完成训练记录，图表将随训练完成逐步呈现。请前往「上传数据」记录训练完成情况。
        </div>
      )}

      {/* 周跑量趋势 */}
      <ChartCard title="周跑量趋势" icon={<TrendingUp className="h-4 w-4" />} subtitle="实际 vs 计划距离 (km)">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={distanceData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="distGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} km`, '']} />
            <Area type="monotone" dataKey="计划" stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
            <Area type="monotone" dataKey="实际" stroke="#10b981" strokeWidth={2.5} fill="url(#distGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* 配速趋势 */}
        <ChartCard title="平均配速趋势" icon={<Gauge className="h-4 w-4" />} subtitle="每周训练平均配速 (秒/km，越低越快)">
          {paceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={paceData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [secToPace(v) || `${v}s`, '配速']} />
                <Line type="monotone" dataKey="配速" stroke="#f97316" strokeWidth={2.5} dot={{ r: 4, fill: '#f97316' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        {/* 心率趋势 */}
        <ChartCard title="平均心率趋势" icon={<Heart className="h-4 w-4" />} subtitle="每周训练平均心率 (bpm)">
          {hrData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={hrData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} bpm`, '心率']} />
                <Line type="monotone" dataKey="心率" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: '#ef4444' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        {/* RPE / 体感趋势 */}
        <ChartCard title="RPE 与体感趋势" icon={<Droplets className="h-4 w-4" />} subtitle="主观疲劳度与体感评分 (1-10)">
          {rpeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={rpeData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="RPE" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} name="疲劳度" />
                <Line type="monotone" dataKey="体感" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="体感" />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        {/* 训练类型分布 */}
        <ChartCard title="训练类型分布" icon={<PieChart className="h-4 w-4" />} subtitle="按训练类型累计距离">
          {typePieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <RPieChart>
                <Pie
                  data={typePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {typePieData.map((entry, i) => (
                    <Cell key={i} fill={getTypeColor(entry.type)} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number, _n: string, p: { payload?: { name?: string } }) => [`${v.toFixed(1)} km`, p?.payload?.name || '']}
                />
              </RPieChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
          {typePieData.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {typePieData.map((t, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: getTypeColor(t.type) }} />
                  <span className="text-slate-600">{t.name}</span>
                  <span className="text-slate-400">{t.value.toFixed(1)}km</span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>

      {/* 心率区间分布 + 周完成率 */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="心率区间分布" icon={<Heart className="h-4 w-4" />} subtitle="最近 4 周训练强度分布">
          {hrZoneData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hrZoneData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="zone" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} 次`, '训练次数']} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {hrZoneData.map((entry, i) => (
                    <Cell key={i} fill={hrZoneColors[entry.zone] || '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-xs text-slate-400">
              需在跑者档案填写静息心率与最大心率
            </div>
          )}
        </ChartCard>

        <ChartCard title="周完成率" icon={<BarChart3 className="h-4 w-4" />} subtitle="实际距离 / 计划距离 (%)">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyStats.map(w => ({ name: `W${w.weekNumber}`, 完成率: w.completionRate, phase: w.phase }))} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, '完成率']} />
              <Bar dataKey="完成率" radius={[6, 6, 0, 0]}>
                {weeklyStats.map((w, i) => (
                  <Cell key={i} fill={PHASE_COLORS[w.phase] || '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {Object.entries(PHASE_COLORS).map(([phase, color]) => (
              <div key={phase} className="flex items-center gap-1 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                <span className="text-slate-600">{PHASE_LABELS[phase] || phase}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* 周详情表格 */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-emerald-600" />
            周度训练数据明细
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50/80 text-slate-500">
              <tr>
                <th className="text-left font-medium px-3 py-2.5">周次</th>
                <th className="text-left font-medium px-3 py-2.5">阶段</th>
                <th className="text-right font-medium px-3 py-2.5">实际/计划</th>
                <th className="text-right font-medium px-3 py-2.5">完成率</th>
                <th className="text-right font-medium px-3 py-2.5">时长</th>
                <th className="text-right font-medium px-3 py-2.5">均配速</th>
                <th className="text-right font-medium px-3 py-2.5">均心率</th>
                <th className="text-right font-medium px-3 py-2.5">爬升</th>
                <th className="text-right font-medium px-3 py-2.5">RPE</th>
                <th className="text-right font-medium px-3 py-2.5">体感</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...weeklyStats].reverse().map(w => (
                <tr key={w.weekId} className="hover:bg-slate-50/50">
                  <td className="px-3 py-2.5 font-medium text-slate-800">第 {w.weekNumber} 周</td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]" style={{ background: (PHASE_COLORS[w.phase] || '#10b981') + '20', color: PHASE_COLORS[w.phase] || '#10b981' }}>
                      {PHASE_LABELS[w.phase] || w.phase}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-700">{w.actualDistance.toFixed(1)} / {w.plannedDistance.toFixed(0)} km</td>
                  <td className="px-3 py-2.5 text-right">
                    <span className={`font-medium ${w.completionRate >= 80 ? 'text-emerald-600' : w.completionRate >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {w.completionRate}%
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{formatDuration(w.totalDuration)}</td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{w.avgPaceSec ? secToPace(w.avgPaceSec) : '-'}</td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{w.avgHr ? `${w.avgHr}` : '-'}</td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{w.totalElevation > 0 ? `${w.totalElevation}m` : '-'}</td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{w.avgRpe ?? '-'}</td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{w.avgFeeling ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const tooltipStyle = {
  fontSize: 12,
  borderRadius: 10,
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  padding: '8px 12px',
}

function ChartCard({ title, icon, subtitle, children }: { title: string; icon: React.ReactNode; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <span className="text-emerald-600">{icon}</span>{title}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="h-[200px] flex flex-col items-center justify-center text-slate-300">
      <BarChart3 className="h-8 w-8 mb-2" />
      <p className="text-xs text-slate-400">暂无数据</p>
    </div>
  )
}

function BigStat({ icon, label, value, unit, sub, color }: { icon: React.ReactNode; label: string; value: string; unit: string; sub: string; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    sky: 'bg-sky-50 text-sky-600',
  }
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
      <div className={`inline-flex items-center justify-center h-7 w-7 rounded-lg mb-1.5 ${colorMap[color]}`}>{icon}</div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-xl font-bold text-slate-900">{value}</span>
        <span className="text-xs text-slate-400">{unit}</span>
      </div>
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>
    </div>
  )
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    easy: '#10b981',
    tempo: '#f97316',
    interval: '#ef4444',
    long: '#8b5cf6',
    recovery: '#06b6d4',
    rest: '#94a3b8',
    cross: '#14b8a6',
  }
  return colors[type] || '#94a3b8'
}
