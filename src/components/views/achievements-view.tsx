'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trophy, Lock, Star, TrendingUp, Flame, Clock, Award, Target } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface Achievement {
  id: string
  category: string
  icon: string
  name: string
  desc: string
  target: number
  current: number
  unit: string
  unlocked: boolean
}

interface AchievementData {
  achievements: Achievement[]
  categories: Record<string, { label: string; icon: string; achievements: Achievement[] }>
  summary: {
    unlocked: number
    total: number
    percent: number
    totalDistance: number
    totalRuns: number
    totalWeeks: number
    maxStreak: number
    longestRun: number
    totalHours: number
  }
}

export function AchievementsView() {
  const [data, setData] = useState<AchievementData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/achievements')
      const d = await res.json()
      setData(d)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  if (!data) return null

  const { summary, categories } = data

  // 进度环数据
  const unlockedPercent = summary.percent
  const ringColor = unlockedPercent >= 80 ? '#10b981' : unlockedPercent >= 50 ? '#f59e0b' : '#94a3b8'

  return (
    <div className="space-y-5">
      {/* 头部 Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-5 sm:p-6 shadow-lg text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">训练成就</h2>
                <p className="text-xs text-white/80">里程碑徽章 · 持续激励你的训练之旅</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold tabular-nums">{summary.unlocked}<span className="text-lg text-white/70">/{summary.total}</span></div>
              <div className="text-xs text-white/70">已解锁</div>
            </div>
          </div>

          {/* 进度环 + 统计 */}
          <div className="grid grid-cols-[auto_1fr] gap-5 items-center">
            <div className="relative">
              <svg width="80" height="80" className="-rotate-90">
                <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="7" />
                <circle
                  cx="40" cy="40" r="34" fill="none" stroke="white" strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 34}
                  strokeDashoffset={2 * Math.PI * 34 * (1 - unlockedPercent / 100)}
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold">{unlockedPercent}%</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <HeroStat label="累计跑量" value={`${summary.totalDistance}`} unit="km" />
              <HeroStat label="训练次数" value={`${summary.totalRuns}`} unit="次" />
              <HeroStat label="最长连跑" value={`${summary.maxStreak}`} unit="天" />
              <HeroStat label="训练时长" value={`${summary.totalHours}`} unit="h" />
            </div>
          </div>
        </div>
      </div>

      {/* 类别筛选 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <CategoryButton active={activeCategory === 'all'} onClick={() => setActiveCategory('all')} icon="🏆" label="全部" count={data.achievements.length} />
        {Object.entries(categories).map(([key, cat]) => (
          <CategoryButton
            key={key}
            active={activeCategory === key}
            onClick={() => setActiveCategory(key)}
            icon={cat.icon}
            label={cat.label}
            count={cat.achievements.length}
          />
        ))}
      </div>

      {/* 成就网格 */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(activeCategory === 'all'
          ? data.achievements
          : categories[activeCategory]?.achievements || []
        ).map(a => {
          const progress = Math.min(100, (a.current / a.target) * 100)
          return (
            <div
              key={a.id}
              className={`relative rounded-2xl border p-4 transition-all ${
                a.unlocked
                  ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm hover:shadow-md'
                  : 'border-slate-200 bg-slate-50/50'
              }`}
            >
              {a.unlocked && (
                <div className="absolute top-2 right-2">
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
                    <Star className="h-2.5 w-2.5 mr-0.5 fill-amber-500 text-amber-500" />已解锁
                  </Badge>
                </div>
              )}
              <div className="flex items-start gap-3 mb-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${
                  a.unlocked ? 'bg-white shadow-sm' : 'bg-slate-100 grayscale opacity-50'
                }`}>
                  {a.unlocked ? a.icon : <Lock className="h-5 w-5 text-slate-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold ${a.unlocked ? 'text-slate-800' : 'text-slate-500'}`}>
                    {a.name}
                  </div>
                  <div className="text-[11px] text-slate-500 leading-snug mt-0.5">{a.desc}</div>
                </div>
              </div>
              {!a.unlocked && (
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>{a.current}{a.unit}</span>
                    <span>{a.target}{a.unit}</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>
              )}
              {a.unlocked && (
                <div className="text-[10px] text-amber-600 font-medium">
                  ✓ 已达成 {a.target}{a.unit}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function HeroStat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-white/15 backdrop-blur rounded-lg p-2 text-center">
      <div className="text-lg font-bold leading-tight">{value}<span className="text-[10px] text-white/70 ml-0.5">{unit}</span></div>
      <div className="text-[9px] text-white/70">{label}</div>
    </div>
  )
}

function CategoryButton({ active, onClick, icon, label, count }: {
  active: boolean
  onClick: () => void
  icon: string
  label: string
  count: number
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
        active
          ? 'bg-emerald-600 text-white shadow-sm'
          : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
      <span className={`text-[10px] ${active ? 'text-white/70' : 'text-slate-400'}`}>({count})</span>
    </button>
  )
}
