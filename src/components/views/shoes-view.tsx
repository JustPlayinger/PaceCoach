'use client'

import { useState, useEffect, useCallback } from 'react'
import { Footprints, Plus, Pencil, Trash2, X, Save, Loader2, AlertTriangle, CheckCircle2, XCircle, TrendingUp, Calendar, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Progress } from '@/components/ui/progress'

interface Shoe {
  id: string
  name: string
  brand: string | null
  model: string | null
  type: string
  color: string | null
  purchasedAt: string
  lifespan: number
  retired: boolean
  notes: string | null
  createdAt: string
  totalDistance: number
  usageCount: number
  lastUsed: string | null
  wearPercent: number
  remaining: number
  status: string
}

interface Summary {
  totalShoes: number
  activeShoes: number
  totalDistance: number
  avgLifespan: number
  warningCount: number
}

const SHOE_TYPES: Record<string, { label: string; icon: string; color: string }> = {
  daily: { label: '日常训练', icon: '👟', color: 'emerald' },
  racing: { label: '竞速', icon: '🏃', color: 'rose' },
  trail: { label: '越野', icon: '⛰️', color: 'orange' },
  minimal: { label: '极简', icon: '🦶', color: 'purple' },
}

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
}

export function ShoesView() {
  const { toast } = useToast()
  const [shoes, setShoes] = useState<Shoe[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingShoe, setEditingShoe] = useState<Shoe | null>(null)
  const [usageDialogShoe, setUsageDialogShoe] = useState<Shoe | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/shoes')
      const data = await res.json()
      setShoes(data.shoes || [])
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

  const handleAdd = () => {
    setEditingShoe(null)
    setDialogOpen(true)
  }
  const handleEdit = (s: Shoe) => {
    setEditingShoe(s)
    setDialogOpen(true)
  }
  const handleDelete = async (s: Shoe) => {
    if (!confirm(`确定删除跑鞋「${s.name}」吗？相关使用记录也会被删除。`)) return
    try {
      const res = await fetch(`/api/shoes/${s.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast({ title: '✅ 已删除跑鞋' })
      load()
    } catch (e) {
      toast({ title: '删除失败', description: (e as Error).message, variant: 'destructive' })
    }
  }
  const handleRetire = async (s: Shoe) => {
    try {
      const res = await fetch(`/api/shoes/${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retired: !s.retired }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast({ title: s.retired ? '✅ 已重新启用' : '✅ 已退役' })
      load()
    } catch (e) {
      toast({ title: '操作失败', description: (e as Error).message, variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    )
  }

  const activeShoes = shoes.filter(s => !s.retired)
  const retiredShoes = shoes.filter(s => s.retired)

  return (
    <div className="space-y-5">
      {/* 头部 + 汇总 */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-emerald-50/40 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <Footprints className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">跑鞋里程追踪</h2>
              <p className="text-xs text-slate-500">管理跑鞋寿命 · 预防伤病</p>
            </div>
          </div>
          <Button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700 gap-1.5">
            <Plus className="h-4 w-4" />添加跑鞋
          </Button>
        </div>

        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryStat icon={<Footprints className="h-4 w-4" />} label="跑鞋总数" value={`${summary.totalShoes}`} sub={`${summary.activeShoes} 双在役`} color="emerald" />
            <SummaryStat icon={<TrendingUp className="h-4 w-4" />} label="累计里程" value={`${summary.totalDistance}`} unit="km" sub="所有跑鞋" color="sky" />
            <SummaryStat icon={<Activity className="h-4 w-4" />} label="平均磨损" value={`${summary.avgLifespan}`} unit="%" sub="在役跑鞋" color="orange" />
            <SummaryStat icon={<AlertTriangle className="h-4 w-4" />} label="需关注" value={`${summary.warningCount}`} unit="双" sub="即将到期" color="rose" />
          </div>
        )}
      </div>

      {/* 在役跑鞋 */}
      {activeShoes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-12 text-center">
          <Footprints className="mx-auto h-10 w-10 text-slate-300 mb-3" />
          <p className="text-slate-500">还没有添加跑鞋</p>
          <p className="text-xs text-slate-400 mt-1">点击「添加跑鞋」开始记录里程，预防伤病</p>
        </div>
      ) : (
        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-3">在役跑鞋（{activeShoes.length}）</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {activeShoes.map(s => (
              <ShoeCard
                key={s.id}
                shoe={s}
                onEdit={() => handleEdit(s)}
                onDelete={() => handleDelete(s)}
                onRetire={() => handleRetire(s)}
                onAddUsage={() => setUsageDialogShoe(s)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 退役跑鞋 */}
      {retiredShoes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-3 opacity-70">退役跑鞋（{retiredShoes.length}）</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {retiredShoes.map(s => (
              <ShoeCard
                key={s.id}
                shoe={s}
                onEdit={() => handleEdit(s)}
                onDelete={() => handleDelete(s)}
                onRetire={() => handleRetire(s)}
                onAddUsage={() => setUsageDialogShoe(s)}
                compact
              />
            ))}
          </div>
        </div>
      )}

      {/* 编辑/新增对话框 */}
      {dialogOpen && (
        <ShoeEditDialog
          shoe={editingShoe}
          onClose={() => setDialogOpen(false)}
          onSaved={() => { setDialogOpen(false); load() }}
        />
      )}

      {/* 添加使用记录对话框 */}
      {usageDialogShoe && (
        <ShoeUsageDialog
          shoe={usageDialogShoe}
          onClose={() => setUsageDialogShoe(null)}
          onSaved={() => { setUsageDialogShoe(null); load() }}
        />
      )}
    </div>
  )
}

function ShoeCard({ shoe, onEdit, onDelete, onRetire, onAddUsage, compact }: {
  shoe: Shoe
  onEdit: () => void
  onDelete: () => void
  onRetire: () => void
  onAddUsage: () => void
  compact?: boolean
}) {
  const typeCfg = SHOE_TYPES[shoe.type] || SHOE_TYPES.daily
  const typeColor = TYPE_COLORS[typeCfg.color] || TYPE_COLORS.emerald

  const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    active: { label: '正常', icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: 'bg-emerald-100 text-emerald-700' },
    warning: { label: '即将到期', icon: <AlertTriangle className="h-3.5 w-3.5" />, color: 'bg-amber-100 text-amber-700' },
    overdue: { label: '已超期', icon: <XCircle className="h-3.5 w-3.5" />, color: 'bg-rose-100 text-rose-700' },
    retired: { label: '已退役', icon: <XCircle className="h-3.5 w-3.5" />, color: 'bg-slate-100 text-slate-500' },
  }
  const status = statusConfig[shoe.status] || statusConfig.active
  const wearColor = shoe.wearPercent >= 100 ? '[&>div]:bg-rose-500' : shoe.wearPercent >= 85 ? '[&>div]:bg-amber-500' : '[&>div]:bg-emerald-500'

  return (
    <div className={`group rounded-2xl border bg-white p-4 shadow-sm transition-all hover:shadow-md ${shoe.retired ? 'opacity-60 border-slate-200' : shoe.status === 'overdue' ? 'border-rose-200' : shoe.status === 'warning' ? 'border-amber-200' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl border ${typeColor.bg} ${typeColor.border}`}>
            {typeCfg.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">{shoe.name}</span>
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${status.color}`}>
                {status.icon}{status.label}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {[shoe.brand, shoe.model].filter(Boolean).join(' · ') || typeCfg.label}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="h-7 w-7 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-emerald-600" title="编辑">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} className="h-7 w-7 rounded-md hover:bg-rose-50 flex items-center justify-center text-slate-400 hover:text-rose-600" title="删除">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {!compact && (
        <>
          {/* 磨损进度 */}
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-600">里程 {shoe.totalDistance} / {shoe.lifespan} km</span>
              <span className={`font-medium ${shoe.wearPercent >= 100 ? 'text-rose-600' : shoe.wearPercent >= 85 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {shoe.wearPercent}%
              </span>
            </div>
            <Progress value={Math.min(100, shoe.wearPercent)} className={`h-2 ${wearColor}`} />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>剩余 {shoe.remaining} km</span>
              <span>使用 {shoe.usageCount} 次</span>
            </div>
          </div>

          {/* 购买/最后使用 */}
          <div className="flex items-center gap-4 text-[11px] text-slate-500 mb-3">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              购买于 {new Date(shoe.purchasedAt).toLocaleDateString('zh-CN')}
            </span>
            {shoe.lastUsed && (
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                最后使用 {new Date(shoe.lastUsed).toLocaleDateString('zh-CN')}
              </span>
            )}
          </div>

          {shoe.notes && (
            <div className="text-xs text-slate-500 italic bg-slate-50 rounded p-2 mb-3">
              📝 {shoe.notes}
            </div>
          )}
        </>
      )}

      <div className="flex gap-2">
        {!shoe.retired && (
          <Button size="sm" variant="outline" className="flex-1 h-8 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={onAddUsage}>
            <Plus className="h-3 w-3 mr-1" />记录里程
          </Button>
        )}
        <Button size="sm" variant="ghost" className="h-8 text-xs text-slate-500" onClick={onRetire}>
          {shoe.retired ? '重新启用' : '退役'}
        </Button>
      </div>
    </div>
  )
}

function ShoeEditDialog({ shoe, onClose, onSaved }: { shoe: Shoe | null; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: shoe?.name || '',
    brand: shoe?.brand || '',
    model: shoe?.model || '',
    type: shoe?.type || 'daily',
    color: shoe?.color || '',
    purchasedAt: shoe ? shoe.purchasedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
    lifespan: shoe?.lifespan?.toString() || '800',
    notes: shoe?.notes || '',
  })

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: '请填写跑鞋名称', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        brand: form.brand || null,
        model: form.model || null,
        type: form.type,
        color: form.color || null,
        purchasedAt: form.purchasedAt,
        lifespan: form.lifespan,
        notes: form.notes || null,
      }
      const res = shoe
        ? await fetch(`/api/shoes/${shoe.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch('/api/shoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast({ title: `✅ ${shoe ? '已更新' : '已添加'}跑鞋` })
      onSaved()
    } catch (e) {
      toast({ title: '保存失败', description: (e as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">{shoe ? '编辑跑鞋' : '添加跑鞋'}</h3>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">跑鞋名称 *</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="如：Nike Pegasus 40" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">品牌</Label>
              <Input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} placeholder="Nike" />
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">型号</Label>
              <Input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} placeholder="Pegasus 40" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">类型</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SHOE_TYPES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.icon} {v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">颜色</Label>
              <Input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} placeholder="黑/白" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">购买日期</Label>
              <Input type="date" value={form.purchasedAt} onChange={e => setForm({ ...form, purchasedAt: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">建议寿命</Label>
              <Input type="number" value={form.lifespan} onChange={e => setForm({ ...form, lifespan: e.target.value })} placeholder="800" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">备注</Label>
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="如：适合长距离、缓震良好..." className="resize-none" rows={2} />
          </div>
        </div>
        <div className="flex justify-end gap-2 p-5 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose}>取消</Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 gap-1.5">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {shoe ? '保存修改' : '添加跑鞋'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function ShoeUsageDialog({ shoe, onClose, onSaved }: { shoe: Shoe; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [distance, setDistance] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')

  const handleSave = async () => {
    if (!distance || parseFloat(distance) <= 0) {
      toast({ title: '请输入有效距离', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/shoes/${shoe.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distance, date, note: note || null }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast({ title: '✅ 已记录里程', description: `${shoe.name} +${distance}km` })
      onSaved()
    } catch (e) {
      toast({ title: '保存失败', description: (e as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">记录里程 · {shoe.name}</h3>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="p-5 space-y-3">
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            当前里程 <span className="font-semibold text-slate-800">{shoe.totalDistance}km</span> / {shoe.lifespan}km · 剩余 {shoe.remaining}km
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">本次距离 (km) *</Label>
            <Input type="number" step="0.1" value={distance} onChange={e => setDistance(e.target.value)} placeholder="10.5" autoFocus />
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">日期</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">备注</Label>
            <Input value={note} onChange={e => setNote(e.target.value)} placeholder="如：长跑 18km" />
          </div>
        </div>
        <div className="flex justify-end gap-2 p-5 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose}>取消</Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 gap-1.5">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            记录
          </Button>
        </div>
      </div>
    </div>
  )
}

function SummaryStat({ icon, label, value, unit, sub, color }: { icon: React.ReactNode; label: string; value: string; unit?: string; sub: string; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600',
    sky: 'bg-sky-50 text-sky-600',
    orange: 'bg-orange-50 text-orange-600',
    rose: 'bg-rose-50 text-rose-600',
  }
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
      <div className={`inline-flex items-center justify-center h-7 w-7 rounded-lg mb-1.5 ${colorMap[color]}`}>{icon}</div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-lg font-bold text-slate-900">{value}</span>
        {unit && <span className="text-xs text-slate-400">{unit}</span>}
      </div>
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="text-[10px] text-slate-400">{sub}</div>
    </div>
  )
}
