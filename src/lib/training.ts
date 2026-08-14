// 训练类型配置
export const SESSION_TYPES: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  easy: { label: '轻松跑', color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-200', icon: '🍃' },
  tempo: { label: '节奏跑', color: 'text-orange-700', bg: 'bg-orange-100 border-orange-200', icon: '🔥' },
  interval: { label: '间歇跑', color: 'text-red-700', bg: 'bg-red-100 border-red-200', icon: '⚡' },
  long: { label: '长距离', color: 'text-purple-700', bg: 'bg-purple-100 border-purple-200', icon: '🏔️' },
  recovery: { label: '恢复跑', color: 'text-sky-700', bg: 'bg-sky-100 border-sky-200', icon: '💧' },
  rest: { label: '休息', color: 'text-slate-600', bg: 'bg-slate-100 border-slate-200', icon: '😴' },
  cross: { label: '交叉训练', color: 'text-teal-700', bg: 'bg-teal-100 border-teal-200', icon: '🚴' },
}

export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: '待完成', color: 'text-slate-500 bg-slate-100' },
  completed: { label: '已完成', color: 'text-emerald-700 bg-emerald-100' },
  skipped: { label: '已跳过', color: 'text-zinc-500 bg-zinc-100' },
}

export const DAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
export const DAY_LABELS_MON = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

export const PHASE_LABELS: Record<string, string> = {
  base: '基础期',
  build: '强化期',
  peak: '巅峰期',
  taper: '减量期',
  recovery: '恢复期',
}

// 工具函数
export function formatDuration(sec: number | null | undefined): string {
  if (!sec) return '-'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}h${m.toString().padStart(2, '0')}m`
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatPace(secPerKm: number | null | undefined): string {
  if (!secPerKm) return '-'
  const m = Math.floor(secPerKm / 60)
  const s = Math.round(secPerKm % 60)
  return `${m}:${s.toString().padStart(2, '0')}/km`
}

export function paceToSec(pace: string | null | undefined): number | null {
  if (!pace) return null
  const match = pace.match(/(\d+):(\d+)/)
  if (!match) return null
  return parseInt(match[1]) * 60 + parseInt(match[2])
}

export function secToPace(sec: number | null | undefined): string | null {
  if (!sec) return null
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}/km`
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export function getWeekRange(weekStart: Date | string, weekEnd: Date | string): string {
  const s = new Date(weekStart)
  const e = new Date(weekEnd)
  return `${s.getMonth() + 1}/${s.getDate()} - ${e.getMonth() + 1}/${e.getDate()}`
}

// 心率区间计算
export function getHrZones(maxHr: number, restingHr: number) {
  return [
    { zone: 'Z1', label: '恢复', min: restingHr, max: restingHr + (maxHr - restingHr) * 0.5, color: '#94a3b8' },
    { zone: 'Z2', label: '有氧', min: restingHr + (maxHr - restingHr) * 0.5, max: restingHr + (maxHr - restingHr) * 0.6, color: '#10b981' },
    { zone: 'Z3', label: '节奏', min: restingHr + (maxHr - restingHr) * 0.6, max: restingHr + (maxHr - restingHr) * 0.7, color: '#f59e0b' },
    { zone: 'Z4', label: '阈值', min: restingHr + (maxHr - restingHr) * 0.7, max: restingHr + (maxHr - restingHr) * 0.8, color: '#f97316' },
    { zone: 'Z5', label: '无氧', min: restingHr + (maxHr - restingHr) * 0.8, max: maxHr, color: '#ef4444' },
  ]
}
