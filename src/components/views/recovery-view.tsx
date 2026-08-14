'use client'

import { useState, useEffect, useCallback } from 'react'
import { Moon, Droplets, Apple, HeartPulse, Smile, Save, Loader2, Calendar, TrendingUp, Activity, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/hooks/use-toast'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell } from 'recharts'

interface RecoveryLog {
  id: string
  date: string
  sleepHours: number | null
  sleepQuality: number | null
  waterIntake: number | null
  nutrition: number | null
  muscleSoreness: number | null
  fatigue: number | null
  mood: number | null
  preRunFuel: string | null
  duringFuel: string | null
  postRunFuel: string | null
  notes: string | null
}

interface Summary {
  totalLogs: number
  avgSleep: number
  avgWater: number
  avgSleepQuality: number
  avgFatigue: number
  daysCovered: number
}

export function RecoveryView() {
  const { toast } = useToast()
  const [logs, setLogs] = useState<RecoveryLog[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))

  const [form, setForm] = useState({
    sleepHours: '',
    sleepQuality: 3,
    waterIntake: '',
    nutrition: 3,
    muscleSoreness: 2,
    fatigue: 3,
    mood: 4,
    preRunFuel: '',
    duringFuel: '',
    postRunFuel: '',
    notes: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/recovery?days=30')
      const data = await res.json()
      setLogs(data.logs || [])
      setSummary(data.summary || null)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // 切换日期时加载该日记录
  useEffect(() => {
    const existing = logs.find(l => l.date.slice(0, 10) === selectedDate)
    if (existing) {
      setForm({
        sleepHours: existing.sleepHours?.toString() || '',
        sleepQuality: existing.sleepQuality || 3,
        waterIntake: existing.waterIntake?.toString() || '',
        nutrition: existing.nutrition || 3,
        muscleSoreness: existing.muscleSoreness || 2,
        fatigue: existing.fatigue || 3,
        mood: existing.mood || 4,
        preRunFuel: existing.preRunFuel || '',
        duringFuel: existing.duringFuel || '',
        postRunFuel: existing.postRunFuel || '',
        notes: existing.notes || '',
      })
    } else {
      setForm({
        sleepHours: '', sleepQuality: 3, waterIntake: '', nutrition: 3, muscleSoreness: 2,
        fatigue: 3, mood: 4, preRunFuel: '', duringFuel: '', postRunFuel: '', notes: '',
      })
    }
  }, [selectedDate, logs])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, date: selectedDate }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast({ title: '✅ 恢复记录已保存' })
      load()
    } catch (e) {
      toast({ title: '保存失败', description: (e as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    )
  }

  // 图表数据（最近 14 天）
  const recentLogs = logs.slice(0, 14).reverse()
  const sleepData = recentLogs.map(l => ({
    name: l.date.slice(5, 10),
    睡眠: l.sleepHours || 0,
    质量: l.sleepQuality || 0,
  }))
  const waterData = recentLogs.map(l => ({
    name: l.date.slice(5, 10),
    饮水: l.waterIntake || 0,
  }))
  const fatigueData = recentLogs.map(l => ({
    name: l.date.slice(5, 10),
    疲劳: l.fatigue || 0,
    酸痛: l.muscleSoreness || 0,
    情绪: l.mood || 0,
  }))

  return (
    <div className="space-y-5">
      {/* 头部 + 汇总 */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-emerald-50/40 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">营养与恢复追踪</h2>
            <p className="text-xs text-slate-500">记录每日睡眠/补水/补给/体感 · 优化训练恢复</p>
          </div>
        </div>
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryStat icon={<Moon className="h-4 w-4" />} label="平均睡眠" value={`${summary.avgSleep}`} unit="h" sub={`质量 ${summary.avgSleepQuality}/5`} color="indigo" />
            <SummaryStat icon={<Droplets className="h-4 w-4" />} label="平均饮水" value={`${summary.avgWater}`} unit="L" sub="每日" color="sky" />
            <SummaryStat icon={<Zap className="h-4 w-4" />} label="平均疲劳" value={`${summary.avgFatigue}`} unit="/5" sub="30天均值" color="orange" />
            <SummaryStat icon={<Calendar className="h-4 w-4" />} label="记录天数" value={`${summary.totalLogs}`} unit="天" sub={`近 ${summary.daysCovered} 天`} color="emerald" />
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* 左侧：记录表单 */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-emerald-600" />
                每日恢复记录
              </h3>
              <Input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-auto h-8 text-xs"
              />
            </div>

            <div className="space-y-4">
              {/* 睡眠 */}
              <Section icon={<Moon className="h-4 w-4" />} title="睡眠" color="indigo">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-slate-500 mb-1 block">睡眠时长 (小时)</Label>
                    <Input type="number" step="0.1" value={form.sleepHours} onChange={e => setForm({ ...form, sleepHours: e.target.value })} placeholder="7.5" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <Label className="text-xs text-slate-500">睡眠质量</Label>
                      <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px]">{form.sleepQuality}/5</Badge>
                    </div>
                    <Slider value={[form.sleepQuality]} min={1} max={5} step={1} onValueChange={v => setForm({ ...form, sleepQuality: v[0] })} />
                  </div>
                </div>
              </Section>

              {/* 补水与营养 */}
              <Section icon={<Droplets className="h-4 w-4" />} title="补水与营养" color="sky">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-slate-500 mb-1 block">饮水量 (升)</Label>
                    <Input type="number" step="0.1" value={form.waterIntake} onChange={e => setForm({ ...form, waterIntake: e.target.value })} placeholder="2.0" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <Label className="text-xs text-slate-500">营养评分</Label>
                      <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 text-[10px]">{form.nutrition}/5</Badge>
                    </div>
                    <Slider value={[form.nutrition]} min={1} max={5} step={1} onValueChange={v => setForm({ ...form, nutrition: v[0] })} />
                  </div>
                </div>
              </Section>

              {/* 体感 */}
              <Section icon={<Activity className="h-4 w-4" />} title="身体状态" color="orange">
                <div className="space-y-3">
                  <SliderField label="肌肉酸痛" value={form.muscleSoreness} onChange={v => setForm({ ...form, muscleSoreness: v })} color="rose" desc={['无痛', '轻微', '中度', '明显', '严重']} />
                  <SliderField label="疲劳度" value={form.fatigue} onChange={v => setForm({ ...form, fatigue: v })} color="orange" desc={['精力充沛', '轻松', '一般', '疲劳', '极度疲劳']} />
                  <SliderField label="情绪" value={form.mood} onChange={v => setForm({ ...form, mood: v })} color="emerald" desc={['低落', '一般', '平静', '愉快', '极佳']} />
                </div>
              </Section>

              {/* 补给 */}
              <Section icon={<Apple className="h-4 w-4" />} title="训练补给" color="emerald">
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-slate-500 mb-1 block">跑前补给</Label>
                    <Input value={form.preRunFuel} onChange={e => setForm({ ...form, preRunFuel: e.target.value })} placeholder="如：香蕉 + 黑咖啡" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 mb-1 block">跑中补给</Label>
                    <Input value={form.duringFuel} onChange={e => setForm({ ...form, duringFuel: e.target.value })} placeholder="如：能量胶 ×2 + 电解质水" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 mb-1 block">跑后补给</Label>
                    <Input value={form.postRunFuel} onChange={e => setForm({ ...form, postRunFuel: e.target.value })} placeholder="如：蛋白粉 + 碳水" />
                  </div>
                </div>
              </Section>

              {/* 备注 */}
              <div>
                <Label className="text-xs text-slate-500 mb-1 block">备注</Label>
                <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="如：昨晚熬夜、感冒初愈、跑团聚餐..." className="resize-none" rows={2} />
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700 h-10">
                {saving ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />保存中...</> : <><Save className="h-4 w-4 mr-1.5" />保存恢复记录</>}
              </Button>
            </div>
          </div>
        </div>

        {/* 右侧：趋势图表 */}
        <div className="lg:col-span-2 space-y-4">
          {logs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
              <HeartPulse className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">暂无恢复记录</p>
              <p className="text-xs text-slate-400 mt-1">填写左侧表单，开始追踪恢复状况</p>
            </div>
          ) : (
            <>
              {/* 睡眠趋势 */}
              {sleepData.some(d => d.睡眠 > 0) && (
                <ChartCard title="睡眠时长趋势" subtitle="小时 / 质量(1-5)">
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={sleepData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 5]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line yAxisId="left" type="monotone" dataKey="睡眠" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                      <Line yAxisId="right" type="monotone" dataKey="质量" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {/* 饮水趋势 */}
              {waterData.some(d => d.饮水 > 0) && (
                <ChartCard title="饮水量趋势" subtitle="升 / 日">
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={waterData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} L`, '饮水']} />
                      <Bar dataKey="饮水" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {/* 体感趋势 */}
              {fatigueData.some(d => d.疲劳 > 0 || d.酸痛 > 0 || d.情绪 > 0) && (
                <ChartCard title="体感趋势" subtitle="疲劳/酸痛/情绪 (1-5)">
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={fatigueData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line type="monotone" dataKey="疲劳" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="酸痛" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="情绪" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {/* 最近记录列表 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-emerald-600" />最近记录
                </h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {logs.slice(0, 7).map(l => (
                    <div key={l.id} className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg hover:bg-slate-50">
                      <span className="text-slate-500 w-16">{l.date.slice(5, 10)}</span>
                      {l.sleepHours != null && <span className="flex items-center gap-0.5 text-indigo-600"><Moon className="h-3 w-3" />{l.sleepHours}h</span>}
                      {l.waterIntake != null && <span className="flex items-center gap-0.5 text-sky-600"><Droplets className="h-3 w-3" />{l.waterIntake}L</span>}
                      {l.fatigue != null && <span className="flex items-center gap-0.5 text-orange-600"><Zap className="h-3 w-3" />{l.fatigue}</span>}
                      {l.mood != null && <span className="flex items-center gap-0.5 text-emerald-600"><Smile className="h-3 w-3" />{l.mood}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </>
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

function Section({ icon, title, color, children }: { icon: React.ReactNode; title: string; color: string; children: React.ReactNode }) {
  const colorMap: Record<string, string> = {
    indigo: 'text-indigo-600 bg-indigo-50',
    sky: 'text-sky-600 bg-sky-50',
    orange: 'text-orange-600 bg-orange-50',
    emerald: 'text-emerald-600 bg-emerald-50',
  }
  return (
    <div className="rounded-xl border border-slate-100 p-3">
      <div className="flex items-center gap-2 mb-2.5">
        <span className={`inline-flex items-center justify-center h-6 w-6 rounded-lg ${colorMap[color]}`}>{icon}</span>
        <span className="text-xs font-semibold text-slate-700">{title}</span>
      </div>
      {children}
    </div>
  )
}

function SliderField({ label, value, onChange, color, desc }: { label: string; value: number; onChange: (v: number) => void; color: string; desc: string[] }) {
  const colorMap: Record<string, string> = {
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <Label className="text-xs text-slate-600">{label}</Label>
        <Badge variant="outline" className={`text-[10px] ${colorMap[color]}`}>{value}/5 · {desc[value - 1]}</Badge>
      </div>
      <Slider value={[value]} min={1} max={5} step={1} onValueChange={v => onChange(v[0])} />
    </div>
  )
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2">
        <h4 className="text-xs font-semibold text-slate-700">{title}</h4>
        <p className="text-[10px] text-slate-400">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

function SummaryStat({ icon, label, value, unit, sub, color }: { icon: React.ReactNode; label: string; value: string; unit: string; sub: string; color: string }) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    sky: 'bg-sky-50 text-sky-600',
    orange: 'bg-orange-50 text-orange-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  }
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
      <div className={`inline-flex items-center justify-center h-7 w-7 rounded-lg mb-1.5 ${colorMap[color]}`}>{icon}</div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-lg font-bold text-slate-900">{value}</span>
        <span className="text-xs text-slate-400">{unit}</span>
      </div>
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="text-[10px] text-slate-400">{sub}</div>
    </div>
  )
}
