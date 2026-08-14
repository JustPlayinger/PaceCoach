'use client'

import { useState, useEffect } from 'react'
import { Trophy, Calendar, Flag, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Props {
  targetDate: string | null
  targetRace: string | null
  targetTime: string | null
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function calculateTimeLeft(target: Date): TimeLeft {
  const diff = target.getTime() - new Date().getTime()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}

// 根据剩余天数决定紧迫程度配色
function getUrgencyConfig(days: number): { gradient: string; ring: string; label: string; pulse: boolean } {
  if (days <= 0) return { gradient: 'from-rose-600 via-red-600 to-rose-800', ring: 'ring-rose-300', label: '比赛日', pulse: true }
  if (days <= 7) return { gradient: 'from-rose-500 via-red-500 to-orange-600', ring: 'ring-rose-300', label: '比赛周', pulse: true }
  if (days <= 30) return { gradient: 'from-orange-500 via-amber-500 to-yellow-500', ring: 'ring-orange-300', label: '冲刺阶段', pulse: false }
  if (days <= 90) return { gradient: 'from-emerald-500 via-teal-500 to-cyan-600', ring: 'ring-emerald-300', label: '备战阶段', pulse: false }
  return { gradient: 'from-indigo-500 via-purple-500 to-blue-600', ring: 'ring-indigo-300', label: '长期备战', pulse: false }
}

export function RaceCountdown({ targetDate, targetRace, targetTime }: Props) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    if (!targetDate) return
    const target = new Date(targetDate)
    target.setHours(8, 0, 0, 0) // 假设早 8 点开赛
    const update = () => setTimeLeft(calculateTimeLeft(target))
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  if (!targetDate) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-5 text-center">
        <Trophy className="mx-auto h-8 w-8 text-slate-300 mb-2" />
        <p className="text-sm text-slate-500">尚未设置目标赛事</p>
        <p className="text-xs text-slate-400 mt-1">请前往「跑者档案」设置目标赛事日期</p>
      </div>
    )
  }

  const target = new Date(targetDate)
  const config = getUrgencyConfig(timeLeft.days)
  const isPast = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0

  return (
    <div className={`relative overflow-hidden rounded-2xl border shadow-lg ring-1 ${config.ring} bg-gradient-to-br ${config.gradient} text-white`}>
      {/* 装饰元素 */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      {/* 跑道线装饰 */}
      <svg className="absolute right-4 top-4 opacity-20" width="80" height="80" viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="35" stroke="white" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="40" cy="40" r="25" stroke="white" strokeWidth="1.5" strokeDasharray="2 6" />
      </svg>

      <div className="relative p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-white/80 uppercase tracking-wider">赛事倒计时</span>
                {config.pulse && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/20 backdrop-blur text-[9px] font-medium animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                    {config.label}
                  </span>
                )}
                {!config.pulse && (
                  <Badge className="bg-white/20 text-white border-white/30 backdrop-blur text-[10px]">{config.label}</Badge>
                )}
              </div>
              <p className="text-sm font-medium mt-0.5">
                {targetRace || '目标赛事'} {targetTime && <span className="text-white/70">· 目标 {targetTime}</span>}
              </p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-white/70 uppercase tracking-wider">比赛日期</div>
            <div className="text-sm font-medium">{target.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}</div>
          </div>
        </div>

        {/* 倒计时数字 */}
        {isPast ? (
          <div className="text-center py-4">
            <Flag className="h-10 w-10 mx-auto mb-2 animate-bounce" />
            <p className="text-2xl font-bold">比赛日已到来！</p>
            <p className="text-sm text-white/80 mt-1">祝你好运，全力以赴 🏁</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            <TimeUnit value={timeLeft.days} label="天" highlight />
            <TimeUnit value={timeLeft.hours} label="时" />
            <TimeUnit value={timeLeft.minutes} label="分" />
            <TimeUnit value={timeLeft.seconds} label="秒" live />
          </div>
        )}

        {/* 底部信息 */}
        {!isPast && (
          <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-white/80">
              <Calendar className="h-3 w-3" />
              距开赛 {timeLeft.days} 天 {timeLeft.hours} 小时
            </span>
            <span className="flex items-center gap-1.5 text-white/80">
              <TrendingUp className="h-3 w-3" />
              约剩 {Math.ceil(timeLeft.days / 7)} 周训练时间
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function TimeUnit({ value, label, highlight, live }: { value: number; label: string; highlight?: boolean; live?: boolean }) {
  const display = value < 10 ? `0${value}` : `${value}`
  return (
    <div className={`relative rounded-xl backdrop-blur p-3 text-center ${
      highlight ? 'bg-white/25' : 'bg-white/15'
    } ${live ? 'ring-1 ring-white/30' : ''}`}>
      <div className={`font-bold leading-none tabular-nums ${highlight ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'}`}>
        {display}
      </div>
      <div className="text-[10px] text-white/70 uppercase tracking-wider mt-1">{label}</div>
    </div>
  )
}
