'use client'

import { useState, useEffect } from 'react'
import { UserCog, Save, Loader2, User, Heart, Target, Activity, Scale, Ruler, Calendar, Sparkles, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { getHrZones } from '@/lib/training'
import type { Runner } from './types'

interface Props {
  runner: Runner | null
  refresh: () => void
}

export function ProfileViewImpl({ runner, refresh }: Props) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: 'male',
    weight: '',
    height: '',
    restingHr: '',
    maxHr: '',
    vo2max: '',
    experience: 'intermediate',
    targetRace: '全马',
    targetDate: '',
    targetTime: '',
    weeklyMileage: '',
    notes: '',
  })

  useEffect(() => {
    if (runner) {
      setForm({
        name: runner.name || '',
        age: runner.age?.toString() || '',
        gender: runner.gender || 'male',
        weight: runner.weight?.toString() || '',
        height: runner.height?.toString() || '',
        restingHr: runner.restingHr?.toString() || '',
        maxHr: runner.maxHr?.toString() || '',
        vo2max: runner.vo2max?.toString() || '',
        experience: runner.experience || 'intermediate',
        targetRace: runner.targetRace || '全马',
        targetDate: runner.targetDate || '',
        targetTime: runner.targetTime || '',
        weeklyMileage: runner.weeklyMileage?.toString() || '',
        notes: runner.notes || '',
      })
    }
  }, [runner])

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: '请填写姓名', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        age: form.age ? parseInt(form.age) : null,
        gender: form.gender,
        weight: form.weight ? parseFloat(form.weight) : null,
        height: form.height ? parseInt(form.height) : null,
        restingHr: form.restingHr ? parseInt(form.restingHr) : null,
        maxHr: form.maxHr ? parseInt(form.maxHr) : null,
        vo2max: form.vo2max ? parseFloat(form.vo2max) : null,
        experience: form.experience,
        targetRace: form.targetRace,
        targetDate: form.targetDate || null,
        targetTime: form.targetTime || null,
        weeklyMileage: form.weeklyMileage ? parseInt(form.weeklyMileage) : null,
        notes: form.notes || null,
      }
      const res = await fetch('/api/runner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast({ title: '✅ 档案已保存', description: 'AI 将基于此档案生成课表与点评' })
      refresh()
    } catch (e) {
      toast({ title: '保存失败', description: (e as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const hrZones = (runner?.maxHr && runner?.restingHr) ? getHrZones(runner.maxHr, runner.restingHr) : []

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-emerald-50/40 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <UserCog className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">跑者档案</h2>
            <p className="text-xs text-slate-500">AI 将基于此档案个性化生成训练课表与点评</p>
          </div>
        </div>
      </div>

      {/* 基本信息 */}
      <Section icon={<User className="h-4 w-4" />} title="基本信息">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field label="姓名"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="你的名字" /></Field>
          <Field label="年龄"><Input type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} placeholder="30" /></Field>
          <Field label="性别">
            <Select value={form.gender} onValueChange={v => setForm({ ...form, gender: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">男</SelectItem>
                <SelectItem value="female">女</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="体重 (kg)" icon={<Scale className="h-3 w-3" />}><Input type="number" step="0.1" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} placeholder="65" /></Field>
          <Field label="身高 (cm)" icon={<Ruler className="h-3 w-3" />}><Input type="number" value={form.height} onChange={e => setForm({ ...form, height: e.target.value })} placeholder="175" /></Field>
          <Field label="训练经验">
            <Select value={form.experience} onValueChange={v => setForm({ ...form, experience: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">入门 (0-1年)</SelectItem>
                <SelectItem value="intermediate">进阶 (1-3年)</SelectItem>
                <SelectItem value="advanced">高级 (3年+)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Section>

      {/* 生理指标 */}
      <Section icon={<Heart className="h-4 w-4" />} title="生理指标">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field label="静息心率 (bpm)"><Input type="number" value={form.restingHr} onChange={e => setForm({ ...form, restingHr: e.target.value })} placeholder="50" /></Field>
          <Field label="最大心率 (bpm)"><Input type="number" value={form.maxHr} onChange={e => setForm({ ...form, maxHr: e.target.value })} placeholder="190" /></Field>
          <Field label="最大摄氧量 VO2max"><Input type="number" step="0.1" value={form.vo2max} onChange={e => setForm({ ...form, vo2max: e.target.value })} placeholder="52.5" /></Field>
        </div>

        {hrZones.length > 0 && (
          <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-3">
            <div className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-1.5">
              <Activity className="h-3 w-3" />
              心率区间参考（基于储备心率 Karvonen 法）
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {hrZones.map(z => (
                <div key={z.zone} className="rounded-lg bg-white border p-2 text-center" style={{ borderColor: z.color + '40' }}>
                  <div className="text-xs font-bold" style={{ color: z.color }}>{z.zone}</div>
                  <div className="text-[10px] text-slate-500">{z.label}</div>
                  <div className="text-[10px] text-slate-700 mt-0.5">{Math.round(z.min)}-{Math.round(z.max)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* 训练目标 */}
      <Section icon={<Target className="h-4 w-4" />} title="训练目标">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field label="目标赛事">
            <Select value={form.targetRace} onValueChange={v => setForm({ ...form, targetRace: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['5K', '10K', '半马', '全马', '超马', '日常健身'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="目标日期" icon={<Calendar className="h-3 w-3" />}><Input type="date" value={form.targetDate} onChange={e => setForm({ ...form, targetDate: e.target.value })} /></Field>
          <Field label="目标成绩"><Input value={form.targetTime} onChange={e => setForm({ ...form, targetTime: e.target.value })} placeholder="3:45:00" /></Field>
          <Field label="周跑量目标 (km)"><Input type="number" value={form.weeklyMileage} onChange={e => setForm({ ...form, weeklyMileage: e.target.value })} placeholder="50" /></Field>
        </div>
      </Section>

      {/* 备注 */}
      <Section icon={<Info className="h-4 w-4" />} title="其他备注">
        <Textarea
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          placeholder="如：伤病史、偏好训练时间、过往成绩、补给策略等"
          className="resize-none"
          rows={3}
        />
      </Section>

      <div className="sticky bottom-4 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/30 h-11 px-8"
        >
          {saving ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />保存中...</> : <><Save className="h-4 w-4 mr-1.5" />保存档案</>}
        </Button>
      </div>

      {/* 提示 */}
      <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-3 flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
        <div className="text-xs text-slate-600">
          <p className="font-medium text-emerald-800 mb-0.5">AI 个性化提示</p>
          档案越完整，AI 生成的课表与点评越精准。心率区间用于评估训练强度分布；目标赛事与成绩决定课表配速；周跑量目标控制训练负荷递增。
          建议至少填写<strong>静息心率</strong>、<strong>最大心率</strong>、<strong>目标赛事</strong>与<strong>目标成绩</strong>。
        </div>
      </div>
    </div>
  )
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
        <span className="text-emerald-600">{icon}</span>{title}
      </h3>
      {children}
    </div>
  )
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs text-slate-500 mb-1 flex items-center gap-1">
        {icon && <span className="text-slate-400">{icon}</span>}{label}
      </Label>
      {children}
    </div>
  )
}
