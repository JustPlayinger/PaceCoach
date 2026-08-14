'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { X, Loader2, Sparkles, TrendingUp, Timer, Heart, Mountain, Gauge, Activity, Flame, Cloud, Thermometer, Droplets, Calendar, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { SESSION_TYPES, DAY_LABELS, formatDuration, secToPace, PHASE_LABELS } from '@/lib/training'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts'

interface Props {
  sessionId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface DetailData {
  session: {
    id: string
    date: string
    dayOfWeek: number
    type: string
    plannedDistance: number | null
    plannedDuration: number | null
    plannedPace: string | null
    intensity: string | null
    description: string
    status: string
    week: { id: string; weekNumber: number | null; phase: string | null; goal: string | null } | null
  }
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
    weather: string | null
    temperature: number | null
    rpe: number | null
    feeling: number | null
    feelingNote: string | null
    notes: string | null
    imageDataUrl: string | null
    createdAt: string
  } | null
  curves: {
    paceCurve?: number[] | null
    hrCurve?: number[] | null
    elevationCurve?: number[] | null
  }
}

export function SessionDetailDialog({ sessionId, open, onOpenChange }: Props) {
  const { toast } = useToast()
  const [data, setData] = useState<DetailData | null>(null)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)

  useEffect(() => {
    if (open && sessionId) {
      loadDetail(sessionId)
      setAnalysis(null)
    }
  }, [open, sessionId])

  async function loadDetail(id: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/sessions/${id}/detail`)
      const d = await res.json()
      if (d.error) throw new Error(d.error)
      setData(d)
    } catch (e) {
      toast({ title: '加载失败', description: (e as Error).message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  async function handleAnalyze() {
    if (!sessionId) return
    setAnalyzing(true)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/detail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const d = await res.json()
      if (d.error) throw new Error(d.error)
      setAnalysis(d.analysis)
      toast({ title: '✅ AI 单次分析已生成' })
    } catch (e) {
      toast({ title: '分析失败', description: (e as Error).message, variant: 'destructive' })
    } finally {
      setAnalyzing(false)
    }
  }

  if (!open) return null

  const s = data?.session
  const c = data?.completion
  const curves = data?.curves
  const cfg = s ? (SESSION_TYPES[s.type] || SESSION_TYPES.easy) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => onOpenChange(false)}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-slate-100 bg-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            {cfg && (
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg ${cfg.bg}`}>
                {cfg.icon}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-slate-800">训练详情</h3>
              {s && (
                <p className="text-xs text-slate-500">
                  {s.week ? `第 ${s.week.weekNumber} 周 · ${PHASE_LABELS[s.week.phase || ''] || s.week.phase} · ` : ''}
                  {DAY_LABELS[s.dayOfWeek]} · {cfg?.label}
                </p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : !data ? (
          <div className="p-12 text-center text-slate-400">未找到数据</div>
        ) : (
          <div className="p-5 space-y-4">
            {/* 计划 vs 实际 概览 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <DataCard icon={<TrendingUp className="h-4 w-4" />} label="距离" value={c?.distance != null ? `${c.distance} km` : '-'} sub={s?.plannedDistance != null ? `计划 ${s.plannedDistance}km` : '无计划'} color="emerald" />
              <DataCard icon={<Timer className="h-4 w-4" />} label="时长" value={c?.duration ? formatDuration(c.duration) : '-'} sub={s?.plannedDuration != null ? `计划 ${s.plannedDuration}min` : ''} color="orange" />
              <DataCard icon={<Gauge className="h-4 w-4" />} label="配速" value={c?.avgPace || '-'} sub={s?.plannedPace ? `计划 ${s.plannedPace}` : ''} color="purple" />
              <DataCard icon={<Heart className="h-4 w-4" />} label="心率" value={c?.avgHr ? `${c.avgHr}` : '-'} sub={c?.maxHr ? `最大 ${c.maxHr}` : ''} color="rose" />
            </div>

            {/* 详细数据 */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <h4 className="text-xs font-semibold text-slate-700 mb-2.5 flex items-center gap-1">
                <Activity className="h-3 w-3 text-emerald-600" />详细数据
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {c?.elevation != null && <DataItem icon={<Mountain className="h-3 w-3" />} label="爬升" value={`${c.elevation} m`} />}
                {c?.cadence != null && <DataItem icon={<Activity className="h-3 w-3" />} label="步频" value={`${c.cadence} spm`} />}
                {c?.calories != null && <DataItem icon={<Flame className="h-3 w-3" />} label="卡路里" value={`${c.calories} kcal`} />}
                {c?.weather && <DataItem icon={<Cloud className="h-3 w-3" />} label="天气" value={c.weather} />}
                {c?.temperature != null && <DataItem icon={<Thermometer className="h-3 w-3" />} label="温度" value={`${c.temperature}℃`} />}
                {c?.rpe != null && <DataItem icon={<Flame className="h-3 w-3" />} label="RPE" value={`${c.rpe}/10`} />}
                {c?.feeling != null && <DataItem icon={<Droplets className="h-3 w-3" />} label="体感" value={`${c.feeling}/10`} />}
                {s?.intensity && s.intensity !== 'rest' && <DataItem icon={<Target className="h-3 w-3" />} label="强度" value={s.intensity} />}
              </div>
              {s?.description && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <div className="text-[11px] text-slate-500 mb-1">训练内容</div>
                  <p className="text-xs text-slate-700 leading-relaxed">{s.description}</p>
                </div>
              )}
              {c?.feelingNote && (
                <div className="mt-2 text-xs text-slate-600 italic bg-amber-50/50 rounded p-2">
                  💬 {c.feelingNote}
                </div>
              )}
            </div>

            {/* 原始截图 */}
            {c?.imageDataUrl && (
              <div>
                <h4 className="text-xs font-semibold text-slate-700 mb-2">原始训练截图</h4>
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-h-64 flex items-center justify-center">
                  <img src={c.imageDataUrl} alt="训练截图" className="max-h-64 object-contain" />
                </div>
              </div>
            )}

            {/* 折线图 */}
            {(curves?.paceCurve?.length || curves?.hrCurve?.length || curves?.elevationCurve?.length) ? (
              <div className="rounded-xl border border-slate-100 bg-white p-4">
                <h4 className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-1">
                  <Activity className="h-3 w-3 text-emerald-600" />训练曲线（VLM 从截图识别）
                </h4>
                <div className="space-y-3">
                  {curves.paceCurve && curves.paceCurve.length > 1 && (
                    <CurveChart title="配速曲线 (秒/km)" data={curves.paceCurve.map((v, i) => ({ x: i + 1, v }))} color="#f97316" unit="s" invert />
                  )}
                  {curves.hrCurve && curves.hrCurve.length > 1 && (
                    <CurveChart title="心率曲线 (bpm)" data={curves.hrCurve.map((v, i) => ({ x: i + 1, v }))} color="#ef4444" unit="bpm" />
                  )}
                  {curves.elevationCurve && curves.elevationCurve.length > 1 && (
                    <CurveChart title="海拔曲线 (m)" data={curves.elevationCurve.map((v, i) => ({ x: i + 1, v }))} color="#10b981" unit="m" />
                  )}
                </div>
              </div>
            ) : null}

            {/* AI 分析 */}
            <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  AI 单次训练深度分析
                </h4>
                <Button size="sm" variant="outline" onClick={handleAnalyze} disabled={analyzing || !c} className="h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                  {analyzing ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />分析中...</> : <><Sparkles className="h-3 w-3 mr-1" />{analysis ? '重新分析' : '生成分析'}</>}
                </Button>
              </div>
              {analysis ? (
                <div className="prose prose-sm prose-slate max-w-none prose-headings:text-slate-800 prose-headings:font-semibold prose-strong:text-slate-700 prose-li:text-slate-600">
                  <ReactMarkdown>{analysis}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-xs text-slate-500">点击「生成分析」让 AI 基于本次训练数据做配速、心率、体感深度分析</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DataCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    rose: 'bg-rose-50 text-rose-600',
  }
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3">
      <div className={`inline-flex items-center justify-center h-6 w-6 rounded-lg mb-1 ${colorMap[color]}`}>{icon}</div>
      <div className="text-sm font-bold text-slate-900 leading-tight">{value}</div>
      <div className="text-[10px] text-slate-500">{label}</div>
      {sub && <div className="text-[9px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  )
}

function DataItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-slate-400">{icon}</span>
      <span className="text-slate-500">{label}:</span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  )
}

function CurveChart({ title, data, color, unit, invert }: { title: string; data: { x: number; v: number }[]; color: string; unit: string; invert?: boolean }) {
  return (
    <div>
      <div className="text-xs text-slate-600 mb-1 font-medium">{title}</div>
      <ResponsiveContainer width="100%" height={110}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id={`detail-grad-${title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="x" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={invert ? ['dataMax', 'dataMin'] : ['auto', 'auto']} />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
            formatter={(v: number) => [`${v} ${unit}`, '']}
            labelFormatter={(l) => `第${l}点`}
          />
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#detail-grad-${title})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
