'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trophy, Plus, Pencil, Trash2, X, Save, Loader2, Clock, Gauge, MapPin, Calendar, Medal, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

interface PBRecord {
  distance: string
  distanceKm: number
  id: string | null
  timeSec: number | null
  paceSec: number | null
  date: string | null
  location: string | null
  raceName: string | null
  notes: string | null
}

function secToTimeStr(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.round(sec % 60)
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

function secToPaceStr(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// 距离颜色配置
const DISTANCE_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  '1K': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', icon: '⚡' },
  '3K': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', icon: '🏃' },
  '5K': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: '🍃' },
  '10K': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', icon: '🏔️' },
  '半马': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: '🔥' },
  '全马': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: '🏆' },
}

export function RecordsView() {
  const { toast } = useToast()
  const [records, setRecords] = useState<PBRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<PBRecord | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/records')
      const data = await res.json()
      setRecords(data.records || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleEdit = (r: PBRecord) => {
    setEditingRecord(r)
    setDialogOpen(true)
  }
  const handleAdd = (r: PBRecord) => {
    setEditingRecord(r)
    setDialogOpen(true)
  }
  const handleDelete = async (r: PBRecord) => {
    if (!r.id) return
    if (!confirm(`确定删除 ${r.distance} 的 PB 记录吗？`)) return
    try {
      const res = await fetch(`/api/records/${r.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast({ title: '✅ 已删除 PB 记录' })
      load()
    } catch (e) {
      toast({ title: '删除失败', description: (e as Error).message, variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-2xl" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  const totalPBs = records.filter(r => r.id).length

  return (
    <div className="space-y-5">
      {/* 头部 */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50 via-white to-emerald-50/40 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">个人最好成绩</h2>
              <p className="text-xs text-slate-500">PB 记录 · 追踪各距离最好成绩</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Medal className="h-3 w-3 mr-1" />{totalPBs} 项 PB
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={<Medal className="h-4 w-4" />} label="已记录" value={`${totalPBs}`} unit="/ 6" color="amber" />
          <StatCard icon={<Clock className="h-4 w-4" />} label="最快配速" value={records.find(r => r.id && r.paceSec)?.paceSec ? secToPaceStr(records.filter(r => r.paceSec).sort((a,b) => (a.paceSec! - b.paceSec!))[0].paceSec!) : '-'} unit="/km" color="emerald" />
          <StatCard icon={<TrendingUp className="h-4 w-4" />} label="最长距离" value={records.filter(r => r.id).length > 0 ? records.filter(r => r.id).sort((a,b) => b.distanceKm - a.distanceKm)[0].distance : '-'} unit="" color="purple" />
        </div>
      </div>

      {/* PB 卡片网格 */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {records.map(r => {
          const cfg = DISTANCE_COLORS[r.distance] || DISTANCE_COLORS['5K']
          const hasRecord = !!r.id
          return (
            <div
              key={r.distance}
              className={`group relative rounded-2xl border bg-white p-4 shadow-sm transition-all hover:shadow-md ${
                hasRecord ? cfg.border : 'border-dashed border-slate-300'
              }`}
            >
              {hasRecord && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button onClick={() => handleEdit(r)} className="h-6 w-6 rounded hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-emerald-600" title="编辑">
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button onClick={() => handleDelete(r)} className="h-6 w-6 rounded hover:bg-rose-50 flex items-center justify-center text-slate-400 hover:text-rose-600" title="删除">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 mb-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${cfg.bg} ${cfg.border} border`}>
                  {cfg.icon}
                </div>
                <div>
                  <div className={`text-sm font-bold ${cfg.text}`}>{r.distance}</div>
                  <div className="text-[10px] text-slate-400">{r.distanceKm} km</div>
                </div>
              </div>

              {hasRecord && r.timeSec ? (
                <div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-2xl font-bold text-slate-900 tabular-nums">{secToTimeStr(r.timeSec)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                    <span className="flex items-center gap-0.5">
                      <Gauge className="h-3 w-3" />
                      {r.paceSec ? `${secToPaceStr(r.paceSec)}/km` : '-'}
                    </span>
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-500">
                    {r.date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(r.date).toLocaleDateString('zh-CN')}
                      </div>
                    )}
                    {r.raceName && (
                      <div className="flex items-center gap-1">
                        <Trophy className="h-3 w-3" />
                        {r.raceName}
                      </div>
                    )}
                    {r.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {r.location}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-xs text-slate-400 mb-2">暂无记录</p>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleAdd(r)}>
                    <Plus className="h-3 w-3" />添加 PB
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 编辑对话框 */}
      {dialogOpen && editingRecord && (
        <PBEditDialog
          record={editingRecord}
          onClose={() => setDialogOpen(false)}
          onSaved={() => { setDialogOpen(false); load() }}
        />
      )}
    </div>
  )
}

function PBEditDialog({ record, onClose, onSaved }: { record: PBRecord; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const existingTime = record.timeSec ? secToTimeStr(record.timeSec) : ''
  const [timeH, setTimeH] = useState(existingTime.split(':').length === 3 ? existingTime.split(':')[0] : '')
  const [timeM, setTimeM] = useState(existingTime.split(':').length === 3 ? existingTime.split(':')[1] : existingTime.split(':').length === 2 ? existingTime.split(':')[0] : '')
  const [timeS, setTimeS] = useState(existingTime.split(':').length === 3 ? existingTime.split(':')[2] : existingTime.split(':').length === 2 ? existingTime.split(':')[1] : '')
  const [date, setDate] = useState(record.date ? record.date.slice(0, 10) : new Date().toISOString().slice(0, 10))
  const [raceName, setRaceName] = useState(record.raceName || '')
  const [location, setLocation] = useState(record.location || '')
  const [notes, setNotes] = useState(record.notes || '')

  const handleSave = async () => {
    const h = parseInt(timeH) || 0
    const m = parseInt(timeM) || 0
    const s = parseInt(timeS) || 0
    const timeSec = h * 3600 + m * 60 + s
    if (timeSec <= 0) {
      toast({ title: '请输入有效时间', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distance: record.distance,
          timeSec,
          date,
          raceName: raceName || undefined,
          location: location || undefined,
          notes: notes || undefined,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast({ title: `✅ ${record.distance} PB 已保存` })
      onSaved()
    } catch (e) {
      toast({ title: '保存失败', description: (e as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const cfg = DISTANCE_COLORS[record.distance] || DISTANCE_COLORS['5K']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-base ${cfg.bg} ${cfg.border} border`}>{cfg.icon}</span>
            <h3 className="font-semibold text-slate-800">{record.id ? '编辑' : '添加'} PB · {record.distance}</h3>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">完赛时间（时:分:秒）</Label>
            <div className="flex items-center gap-1.5">
              <Input type="number" value={timeH} onChange={e => setTimeH(e.target.value)} placeholder="0" className="text-center" />
              <span className="text-slate-400">:</span>
              <Input type="number" value={timeM} onChange={e => setTimeM(e.target.value)} placeholder="45" className="text-center" />
              <span className="text-slate-400">:</span>
              <Input type="number" value={timeS} onChange={e => setTimeS(e.target.value)} placeholder="00" className="text-center" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">距离 {record.distanceKm}km</p>
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">创造日期</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">赛事名称（可选）</Label>
            <Input value={raceName} onChange={e => setRaceName(e.target.value)} placeholder="如：北京马拉松" />
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">地点（可选）</Label>
            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="如：北京" />
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">备注（可选）</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="如：天气晴朗，状态极佳..." className="resize-none" rows={2} />
          </div>
        </div>
        <div className="flex justify-end gap-2 p-5 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose}>取消</Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="bg-amber-600 hover:bg-amber-700 gap-1.5">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            保存 PB
          </Button>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, unit, color }: { icon: React.ReactNode; label: string; value: string; unit: string; color: string }) {
  const colorMap: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
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
