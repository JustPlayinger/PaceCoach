'use client'

import { useMemo } from 'react'
import { X, Flame, Snowflake, Activity, Heart, Timer, Lightbulb, StretchHorizontal, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SESSION_TYPES } from '@/lib/training'
import { getWarmupCooldownGuide, getTargetHeartRate } from '@/lib/warmup-cooldown'

interface Props {
  open: boolean
  onClose: () => void
  session: {
    type: string
    intensity?: string | null
    plannedDistance?: number | null
    plannedPace?: string | null
    description?: string
  } | null
  runner?: {
    maxHr?: number | null
    restingHr?: number | null
  } | null
}

export function WarmupCooldownDialog({ open, onClose, session, runner }: Props) {
  const guide = useMemo(() => {
    if (!session) return null
    return getWarmupCooldownGuide(session.type, session.intensity, session.plannedDistance)
  }, [session])

  const targetHr = useMemo(() => {
    if (!session) return ''
    return getTargetHeartRate(session.type, session.intensity, runner?.maxHr, runner?.restingHr)
  }, [session, runner])

  if (!open || !session || !guide) return null

  const cfg = SESSION_TYPES[session.type] || SESSION_TYPES.easy

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-orange-50/60 to-sky-50/60 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg ${cfg.bg}`}>
              {cfg.icon}
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">热身 / 冷身指导</h3>
              <p className="text-xs text-slate-500">{cfg.label} · {session.intensity || 'Z2'} · 目标心率 {targetHr}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-5 space-y-5">
          {/* 目标配速与心率 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-orange-50 border border-orange-100 p-3 text-center">
              <Timer className="h-4 w-4 text-orange-600 mx-auto mb-1" />
              <div className="text-[10px] text-slate-500">目标配速</div>
              <div className="text-sm font-bold text-slate-800">{session.plannedPace || '-'}</div>
            </div>
            <div className="rounded-xl bg-rose-50 border border-rose-100 p-3 text-center">
              <Heart className="h-4 w-4 text-rose-600 mx-auto mb-1" />
              <div className="text-[10px] text-slate-500">目标心率</div>
              <div className="text-sm font-bold text-slate-800">{targetHr}</div>
            </div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center">
              <Activity className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
              <div className="text-[10px] text-slate-500">训练距离</div>
              <div className="text-sm font-bold text-slate-800">{session.plannedDistance != null ? `${session.plannedDistance}km` : '-'}</div>
            </div>
          </div>

          {/* 热身 */}
          <div className="rounded-xl border border-orange-200 bg-orange-50/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                  <Flame className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">热身方案</h4>
                  <p className="text-[10px] text-slate-500">总时长 {guide.warmup.totalDuration}</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200 text-[10px]">WARM UP</Badge>
            </div>
            <div className="space-y-2">
              {guide.warmup.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3 bg-white rounded-lg p-2.5 border border-orange-100">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-orange-700 text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-800">{step.name}</span>
                      <Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-700 border-orange-200">{step.duration}</Badge>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            {guide.warmup.tips.length > 0 && (
              <div className="mt-3 pt-3 border-t border-orange-200">
                <div className="text-[11px] font-medium text-orange-700 mb-1.5 flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" />热身提示
                </div>
                <ul className="space-y-1">
                  {guide.warmup.tips.map((tip, i) => (
                    <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                      <span className="text-orange-400 mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 冷身 */}
          <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                  <Snowflake className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">冷身方案</h4>
                  <p className="text-[10px] text-slate-500">总时长 {guide.cooldown.totalDuration}</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-sky-100 text-sky-700 border-sky-200 text-[10px]">COOL DOWN</Badge>
            </div>
            <div className="space-y-2">
              {guide.cooldown.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3 bg-white rounded-lg p-2.5 border border-sky-100">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-sky-700 text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-800">{step.name}</span>
                      <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-700 border-sky-200">{step.duration}</Badge>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            {guide.cooldown.tips.length > 0 && (
              <div className="mt-3 pt-3 border-t border-sky-200">
                <div className="text-[11px] font-medium text-sky-700 mb-1.5 flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" />冷身提示
                </div>
                <ul className="space-y-1">
                  {guide.cooldown.tips.map((tip, i) => (
                    <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                      <span className="text-sky-400 mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 拉伸 */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <StretchHorizontal className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800">静态拉伸</h4>
                <p className="text-[10px] text-slate-500">冷身后进行 · 每个动作保持平稳呼吸</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {guide.stretches.map((s, i) => (
                <div key={i} className="flex items-center gap-2 bg-white rounded-lg p-2 border border-emerald-100">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-800">{s.name}</div>
                    <div className="text-[10px] text-slate-500">{s.target} · {s.duration}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 底部提示 */}
          <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 flex items-start gap-2">
            <Zap className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs text-slate-600">
              <span className="font-medium text-amber-800">个性化提醒：</span>
              以上方案为通用指导，请根据自身状态调整。若感到异常疲劳、疼痛或不适，应立即停止训练并休息。长期伤病应咨询专业运动医学医生。
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
