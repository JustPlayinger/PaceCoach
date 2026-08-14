'use client'

import { useState, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { Library, ChevronDown, ChevronUp, Check, Loader2, Sparkles, Clock, TrendingUp, Target, Layers, Rocket, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { SESSION_TYPES, DAY_LABELS, PHASE_LABELS } from '@/lib/training'
import type { TrainingTemplate } from '@/lib/templates'
import { LEVEL_LABELS } from '@/lib/templates'

export function TemplatesView({ onApplied }: { onApplied: () => void }) {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<TrainingTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [applyingId, setApplyingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/templates')
      const data = await res.json()
      setTemplates(data.templates || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleApply = async (template: TrainingTemplate) => {
    if (!confirm(`确定应用「${template.name}」生成新一周课表吗？\n\n将创建第 ${template.sampleWeek.phase} 期的典型周课表（${template.sampleWeek.sessions.length} 节训练课）。`)) return
    setApplyingId(template.id)
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: template.id }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast({
        title: '✅ 课表已生成',
        description: `已基于「${template.name}」创建新一周（${data.week.sessions?.length || 0} 节训练课）`,
      })
      onApplied()
    } catch (e) {
      toast({ title: '应用失败', description: (e as Error).message, variant: 'destructive' })
    } finally {
      setApplyingId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-2xl" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* 头部 */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-emerald-50/40 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <Library className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">训练计划模板库</h2>
            <p className="text-xs text-slate-500">预设科学训练计划 · 一键应用生成课表</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <HeaderStat icon={<Target className="h-4 w-4" />} label="模板数量" value={`${templates.length}`} unit="个" color="emerald" />
          <HeaderStat icon={<Layers className="h-4 w-4" />} label="覆盖赛事" value="3" unit="类" color="sky" />
          <HeaderStat icon={<TrendingUp className="h-4 w-4" />} label="难度等级" value="3" unit="级" color="orange" />
          <HeaderStat icon={<Clock className="h-4 w-4" />} label="周期长度" value="8-16" unit="周" color="purple" />
        </div>
      </div>

      {/* 模板列表 */}
      <div className="space-y-3">
        {templates.map(t => {
          const levelCfg = LEVEL_LABELS[t.level] || LEVEL_LABELS.beginner
          const isExpanded = expandedId === t.id
          const isApplying = applyingId === t.id
          return (
            <div key={t.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all hover:shadow-md">
              {/* 折叠头部 */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-slate-900">{t.name}</h3>
                      <Badge variant="outline" className={`text-[10px] ${levelCfg.color}`}>{levelCfg.label}</Badge>
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">{t.targetRace}</Badge>
                      <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">目标 {t.targetTime}</Badge>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{t.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 mb-3 flex-wrap">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{t.durationWeeks} 周</span>
                  <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />周跑量 {t.weeklyMileage}km</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{t.sampleWeek.sessions.length} 节/周</span>
                </div>

                {/* 阶段进度条 */}
                <div className="flex items-center gap-1 mb-3">
                  {t.phases.map((p, i) => {
                    const phaseColors: Record<string, string> = {
                      base: 'bg-emerald-400', build: 'bg-orange-400', peak: 'bg-rose-400', taper: 'bg-purple-400',
                    }
                    return (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${phaseColors[p.phase] || 'bg-slate-300'}`}
                        title={`${PHASE_LABELS[p.phase] || p.phase} · ${p.weeks} · ${p.goal}`}
                      />
                    )
                  })}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-3">
                  {t.phases.map((p, i) => (
                    <span key={i}>{PHASE_LABELS[p.phase] || p.phase}</span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleApply(t)}
                    disabled={isApplying}
                    className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs gap-1.5"
                  >
                    {isApplying ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />生成中...</> : <><Sparkles className="h-3.5 w-3.5" />应用此模板</>}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedId(isExpanded ? null : t.id)}
                    className="h-8 text-xs gap-1"
                  >
                    {isExpanded ? <><ChevronUp className="h-3.5 w-3.5" />收起详情</> : <><ChevronDown className="h-3.5 w-3.5" />查看详情</>}
                  </Button>
                </div>
              </div>

              {/* 展开详情 */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-4">
                  {/* 阶段说明 */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                      <Layers className="h-3 w-3 text-emerald-600" />训练阶段
                    </h4>
                    <div className="space-y-1.5">
                      {t.phases.map((p, i) => {
                        const phaseColors: Record<string, string> = {
                          base: 'border-l-emerald-400', build: 'border-l-orange-400', peak: 'border-l-rose-400', taper: 'border-l-purple-400',
                        }
                        return (
                          <div key={i} className={`pl-3 border-l-2 ${phaseColors[p.phase] || 'border-l-slate-300'}`}>
                            <div className="text-xs font-medium text-slate-700">{PHASE_LABELS[p.phase] || p.phase} · {p.weeks}</div>
                            <div className="text-[11px] text-slate-500">{p.goal}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* 示例周课表 */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-emerald-600" />示例周课表（{PHASE_LABELS[t.sampleWeek.phase] || t.sampleWeek.phase}）
                    </h4>
                    <div className="text-[11px] text-slate-500 mb-2 italic">{t.sampleWeek.weekGoal}</div>
                    <div className="space-y-1.5">
                      {t.sampleWeek.sessions.map((s, i) => {
                        const cfg = SESSION_TYPES[s.type] || SESSION_TYPES.easy
                        return (
                          <div key={i} className="flex items-start gap-2 bg-white rounded-lg p-2 border border-slate-100">
                            <span className="text-base">{cfg.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-medium text-slate-700">{DAY_LABELS[s.dayOfWeek]}</span>
                                <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
                                {s.plannedDistance != null && <span className="text-[10px] text-slate-500">{s.plannedDistance}km</span>}
                                {s.plannedPace && <span className="text-[10px] text-slate-500">@ {s.plannedPace}</span>}
                                {s.intensity && s.intensity !== 'rest' && <span className="text-[9px] px-1 py-0.5 rounded bg-slate-100 text-slate-600">{s.intensity}</span>}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{s.description}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 提示 */}
      <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-3 flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
        <div className="text-xs text-slate-600">
          <p className="font-medium text-emerald-800 mb-0.5">模板使用提示</p>
          应用模板会基于该计划的典型周生成新一周课表。建议根据自身状态在「AI 点评」中让 AI 个性化调整，或在「本周课表」手动编辑具体训练课。
          模板仅作为起点，实际训练请结合身体反馈与 AI 建议灵活调整。
        </div>
      </div>
    </div>
  )
}

function HeaderStat({ icon, label, value, unit, color }: { icon: React.ReactNode; label: string; value: string; unit: string; color: string }) {
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
