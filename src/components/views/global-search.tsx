'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Loader2, Calendar, Activity, Footprints, Heart, Trophy } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface SearchResult {
  type: string
  id: string
  title: string
  subtitle: string
  meta: string
  icon: string
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  week: { label: '训练周', icon: <Calendar className="h-3.5 w-3.5" />, color: 'text-emerald-600 bg-emerald-50' },
  session: { label: '训练课', icon: <Activity className="h-3.5 w-3.5" />, color: 'text-sky-600 bg-sky-50' },
  shoe: { label: '跑鞋', icon: <Footprints className="h-3.5 w-3.5" />, color: 'text-purple-600 bg-purple-50' },
  recovery: { label: '恢复记录', icon: <Heart className="h-3.5 w-3.5" />, color: 'text-rose-600 bg-rose-50' },
  record: { label: 'PB 记录', icon: <Trophy className="h-3.5 w-3.5" />, color: 'text-amber-600 bg-amber-50' },
}

export function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 1) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.results || [])
      setActiveIndex(0)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300)
    return () => clearTimeout(timer)
  }, [query, search])

  // 点击外部关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // 键盘快捷键 Cmd/Ctrl + K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
      if (e.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const r = results[activeIndex]
      if (r) handleSelect(r)
    }
  }

  const handleSelect = (r: SearchResult) => {
    // 根据类型跳转
    const tabs: Record<string, string> = {
      week: 'history',
      session: 'history',
      shoe: 'shoes',
      recovery: 'recovery',
      record: 'records',
    }
    const tab = tabs[r.type] || 'dashboard'
    // 触发自定义事件让主页面切换 tab
    window.dispatchEvent(new CustomEvent('pacecoach-navigate', { detail: tab }))
    setOpen(false)
    setQuery('')
    setResults([])
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="搜索训练/跑鞋/PB... (⌘K)"
          className="pl-8 pr-7 h-8 text-xs bg-slate-50/80 border-slate-200 focus:bg-white"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]) }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {loading && (
          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-500 animate-spin" />
        )}
      </div>

      {/* 搜索结果下拉 */}
      {open && query.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-xl border border-slate-200 max-h-80 overflow-y-auto z-50">
          {results.length === 0 && !loading ? (
            <div className="p-6 text-center text-xs text-slate-400">
              <Search className="h-6 w-6 mx-auto mb-1.5 text-slate-300" />
              未找到「{query}」相关结果
            </div>
          ) : (
            <div className="py-1">
              {results.map((r, i) => {
                const cfg = TYPE_CONFIG[r.type] || TYPE_CONFIG.session
                return (
                  <button
                    key={`${r.type}-${r.id}`}
                    onClick={() => handleSelect(r)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                      i === activeIndex ? 'bg-emerald-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-lg shrink-0">{r.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-slate-800 truncate">{r.title}</div>
                      {r.subtitle && <div className="text-[10px] text-slate-500 truncate">{r.subtitle}</div>}
                    </div>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] ${cfg.color}`}>
                        {cfg.icon}
                        {cfg.label}
                      </span>
                      <span className="text-[9px] text-slate-400">{r.meta}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
