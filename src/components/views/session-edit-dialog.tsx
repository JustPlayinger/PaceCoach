'use client'

import { useState, useEffect } from 'react'
import { Pencil, Trash2, Plus, X, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { SESSION_TYPES, DAY_LABELS } from '@/lib/training'
import type { Session, Week } from './types'

interface Props {
  session: Session | null
  week: Week | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export function SessionEditDialog({ session, week, open, onOpenChange, onSaved }: Props) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    dayOfWeek: 1,
    type: 'easy',
    plannedDistance: '',
    plannedDuration: '',
    plannedPace: '',
    intensity: 'Z2',
    description: '',
  })

  const isEdit = !!session

  useEffect(() => {
    if (session) {
      setForm({
        dayOfWeek: session.dayOfWeek,
        type: session.type,
        plannedDistance: session.plannedDistance?.toString() || '',
        plannedDuration: session.plannedDuration?.toString() || '',
        plannedPace: session.plannedPace || '',
        intensity: session.intensity || 'Z2',
        description: session.description || '',
      })
    } else {
      setForm({
        dayOfWeek: 1, type: 'easy', plannedDistance: '', plannedDuration: '',
        plannedPace: '', intensity: 'Z2', description: '',
      })
    }
  }, [session, open])

  if (!open) return null

  const handleSave = async () => {
    if (!week) return
    setSaving(true)
    try {
      const payload = {
        weekId: week.id,
        dayOfWeek: form.dayOfWeek,
        type: form.type,
        plannedDistance: form.plannedDistance ? parseFloat(form.plannedDistance) : null,
        plannedDuration: form.plannedDuration ? parseInt(form.plannedDuration) : null,
        plannedPace: form.plannedPace || null,
        intensity: form.intensity,
        description: form.description,
      }
      let res
      if (isEdit && session) {
        res = await fetch(`/api/sessions/${session.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast({ title: `✅ ${isEdit ? '已更新' : '已新增'}训练课` })
      onOpenChange(false)
      onSaved()
    } catch (e) {
      toast({ title: '保存失败', description: (e as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!session) return
    if (!confirm('确定删除这节训练课吗？')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/sessions/${session.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast({ title: '✅ 已删除训练课' })
      onOpenChange(false)
      onSaved()
    } catch (e) {
      toast({ title: '删除失败', description: (e as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => onOpenChange(false)}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            {isEdit ? <><Pencil className="h-4 w-4 text-emerald-600" />编辑训练课</> : <><Plus className="h-4 w-4 text-emerald-600" />新增训练课</>}
          </h3>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">训练日</Label>
              <Select value={form.dayOfWeek.toString()} onValueChange={v => setForm({ ...form, dayOfWeek: parseInt(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 0].map(d => (
                    <SelectItem key={d} value={d.toString()}>{DAY_LABELS[d]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">训练类型</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SESSION_TYPES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.icon} {v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">距离 (km)</Label>
              <Input type="number" step="0.1" value={form.plannedDistance} onChange={e => setForm({ ...form, plannedDistance: e.target.value })} placeholder="10" />
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">时长 (min)</Label>
              <Input type="number" value={form.plannedDuration} onChange={e => setForm({ ...form, plannedDuration: e.target.value })} placeholder="60" />
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">配速</Label>
              <Input value={form.plannedPace} onChange={e => setForm({ ...form, plannedPace: e.target.value })} placeholder="5:30/km" />
            </div>
          </div>

          <div>
            <Label className="text-xs text-slate-500 mb-1 block">强度区间</Label>
            <Select value={form.intensity} onValueChange={v => setForm({ ...form, intensity: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['rest', 'Z1', 'Z2', 'Z3', 'Z4', 'Z5'].map(z => (
                  <SelectItem key={z} value={z}>{z === 'rest' ? '休息' : z}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-slate-500 mb-1 block">训练内容描述</Label>
            <Textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="如：热身 2km → 节奏跑 8km @ 5:00/km → 冷身 2km"
              className="resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 p-5 border-t border-slate-100 sticky bottom-0 bg-white rounded-b-2xl">
          {isEdit ? (
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={saving} className="gap-1.5">
              <Trash2 className="h-3.5 w-3.5" />删除
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>取消</Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 gap-1.5">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {isEdit ? '保存修改' : '新增训练课'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
