'use client'

import { useState, useMemo } from 'react'
import { Calculator, Gauge, TrendingUp, Activity, Heart, Info, RefreshCw, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { calculatePaceZones, timeStrToSec, secToTimeStr, predictTime, secToPaceStr, type PaceZones } from '@/lib/pace-calculator'
import { RACE_DISTANCES } from '@/lib/pace-calculator'

const PACE_ZONE_CONFIG: Array<{
  key: keyof PaceZones
  label: string
  icon: string
  color: string
  bgColor: string
  borderColor: string
}> = [
  { key: 'recovery', label: '恢复跑', icon: '💧', color: 'text-sky-700', bgColor: 'bg-sky-50', borderColor: 'border-sky-200' },
  { key: 'easy', label: '轻松跑', icon: '🍃', color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  { key: 'long', label: '长距离', icon: '🏔️', color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  { key: 'marathon', label: '马拉松配速', icon: '🏁', color: 'text-teal-700', bgColor: 'bg-teal-50', borderColor: 'border-teal-200' },
  { key: 'tempo', label: '节奏跑', icon: '🔥', color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  { key: 'threshold', label: '阈值配速', icon: '⚡', color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  { key: 'interval', label: '间歇跑', icon: '🚀', color: 'text-rose-700', bgColor: 'bg-rose-50', borderColor: 'border-rose-200' },
  { key: 'repetition', label: '重复跑', icon: '💨', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
]

export function PaceCalculatorView() {
  const { toast } = useToast()
  const [targetRace, setTargetRace] = useState('全马')
  const [hours, setHours] = useState('3')
  const [minutes, setMinutes] = useState('45')
  const [seconds, setSeconds] = useState('00')

  const targetTimeSec = useMemo(() => {
    const h = parseInt(hours) || 0
    const m = parseInt(minutes) || 0
    const s = parseInt(seconds) || 0
    return h * 3600 + m * 60 + s
  }, [hours, minutes, seconds])

  const paceZones = useMemo(() => {
    if (targetTimeSec <= 0) return null
    return calculatePaceZones(targetRace, targetTimeSec)
  }, [targetRace, targetTimeSec])

  // 预估各距离时间
  const predictions = useMemo(() => {
    if (targetTimeSec <= 0 || !paceZones) return null
    const baseDistance = RACE_DISTANCES[targetRace as keyof typeof RACE_DISTANCES] || 42.195
    return {
      '5K': predictTime(baseDistance, targetTimeSec, 5),
      '10K': predictTime(baseDistance, targetTimeSec, 10),
      '半马': predictTime(baseDistance, targetTimeSec, 21.0975),
      '全马': targetRace === '全马' ? targetTimeSec : predictTime(baseDistance, targetTimeSec, 42.195),
    }
  }, [targetRace, targetTimeSec, paceZones])

  const handleCopy = () => {
    if (!paceZones) return
    let text = `🏃 PaceCoach 配速区间（目标 ${targetRace} ${secToTimeStr(targetTimeSec)}）\n\n`
    for (const cfg of PACE_ZONE_CONFIG) {
      const z = paceZones[cfg.key]
      text += `${cfg.icon} ${cfg.label}：${z.pace}/km（${z.range}）${z.hrZone}\n`
    }
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: '✅ 配速表已复制', description: '可粘贴到笔记或分享' })
    }).catch(() => {
      toast({ title: '复制失败', variant: 'destructive' })
    })
  }

  return (
    <div className="space-y-5">
      {/* 头部 */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-emerald-50/40 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">配速计算器</h2>
            <p className="text-xs text-slate-500">基于目标成绩计算各训练区间配速 · 科学控制训练强度</p>
          </div>
        </div>

        {/* 输入区 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-slate-500 mb-1.5 block">目标赛事</Label>
            <Select value={targetRace} onValueChange={setTargetRace}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['5K', '10K', '半马', '全马'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1.5 block">目标成绩（时:分:秒）</Label>
            <div className="flex items-center gap-1.5">
              <Input type="number" value={hours} onChange={e => setHours(e.target.value)} placeholder="3" className="text-center" />
              <span className="text-slate-400">:</span>
              <Input type="number" value={minutes} onChange={e => setMinutes(e.target.value)} placeholder="45" className="text-center" />
              <span className="text-slate-400">:</span>
              <Input type="number" value={seconds} onChange={e => setSeconds(e.target.value)} placeholder="00" className="text-center" />
            </div>
          </div>
        </div>

        {/* 快捷预设 */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500">快捷目标：</span>
          {[
            { race: '全马', time: '3:30:00', label: '全马 330' },
            { race: '全马', time: '4:00:00', label: '全马 400' },
            { race: '半马', time: '1:45:00', label: '半马 145' },
            { race: '10K', time: '0:50:00', label: '10K 50' },
            { race: '5K', time: '0:25:00', label: '5K 25' },
          ].map(preset => (
            <button
              key={preset.label}
              onClick={() => {
                setTargetRace(preset.race)
                const [h, m, s] = preset.time.split(':')
                setHours(h)
                setMinutes(m)
                setSeconds(s)
              }}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-all"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* 预估成绩 */}
      {predictions && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            各距离预估成绩（Riegel 公式）
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(predictions).map(([dist, time]) => (
              <div key={dist} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <div className="text-xs text-slate-500">{dist}</div>
                <div className="text-lg font-bold text-slate-900">{secToTimeStr(time)}</div>
                <div className="text-[10px] text-slate-400">{dist === '全马' ? '当前目标' : `按 ${secToTimeStr(targetTimeSec)} 推算`}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 配速区间 */}
      {paceZones ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <Gauge className="h-4 w-4 text-emerald-600" />
              各训练区间配速
            </h3>
            <Button size="sm" variant="outline" onClick={handleCopy} className="h-7 text-xs gap-1">
              <Copy className="h-3 w-3" />复制配速表
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PACE_ZONE_CONFIG.map(cfg => {
              const z = paceZones[cfg.key]
              return (
                <div key={cfg.key} className={`rounded-xl border p-3 ${cfg.bgColor} ${cfg.borderColor}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{cfg.icon}</span>
                      <div>
                        <div className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</div>
                        <div className="text-[10px] text-slate-500">{z.hrZone}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${cfg.bgColor} ${cfg.color} ${cfg.borderColor}`}>{z.hrZone}</Badge>
                  </div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-2xl font-bold text-slate-900 tabular-nums">{z.pace}</span>
                    <span className="text-xs text-slate-500">/km</span>
                  </div>
                  <div className="text-[11px] text-slate-500">范围：{z.range} /km</div>
                  <div className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">{z.desc}</div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-12 text-center">
          <Calculator className="mx-auto h-10 w-10 text-slate-300 mb-3" />
          <p className="text-slate-500">请输入目标成绩以计算配速区间</p>
        </div>
      )}

      {/* 说明 */}
      <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-3 flex items-start gap-2">
        <Info className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
        <div className="text-xs text-slate-600">
          <p className="font-medium text-emerald-800 mb-0.5">配速计算说明</p>
          基于阈值配速（约 10K-15K 比赛配速）推算各训练区间。阈值配速通过 Riegel 公式从目标赛事成绩反推 10K 时间得出。
          各区间采用业界通用系数：恢复跑(1.35)、轻松跑(1.25)、长距离(1.20)、马拉松配速(1.06)、节奏跑(1.02)、阈值(1.0)、间歇(0.95)、重复(0.88)。
          配速仅供参考，实际训练应结合个人体能与心率反馈灵活调整。
        </div>
      </div>
    </div>
  )
}
