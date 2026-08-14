'use client'

import { useState, useRef, useEffect } from 'react'
import { Database, Download, Upload, Loader2, AlertTriangle, CheckCircle2, FileJson, RefreshCw, Trash2, Info, Settings, Server } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { getApiBase, setApiBase } from '@/lib/mobile-api'
import { isOfflineModeEnabled, setOfflineMode, getDeepseekConfig, setDeepseekConfig } from '@/lib/offline'

interface ImportResult {
  runner: number
  weeks: number
  sessions: number
  completions: number
  shoes: number
  usages: number
  recovery: number
  reviews: number
}

export function DataView({ onDataChanged }: { onDataChanged: () => void }) {
  const { toast } = useToast()
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge')
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [previewData, setPreviewData] = useState<{ weeks: number; sessions: number; completions: number; shoes: number; recovery: number; runner: boolean } | null>(null)
  const [pendingData, setPendingData] = useState<Record<string, unknown> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [aiConfig, setAiConfig] = useState<{ configured: boolean; source: string; baseUrl?: string; hasApiKey: boolean } | null>(null)
  const [apiBaseInput, setApiBaseInput] = useState('')
  const [offlineEnabled, setOfflineEnabled] = useState(false)
  const [dsKeyInput, setDsKeyInput] = useState('')

  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(d => setAiConfig(d)).catch(() => {})
    setApiBaseInput(getApiBase() || '')
    setOfflineEnabled(isOfflineModeEnabled())
    setDsKeyInput(getDeepseekConfig().apiKey || '')
  }, [])

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/data/export')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `paceon-backup-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast({ title: '✅ 数据已导出', description: `备份文件已下载（${(json.length / 1024).toFixed(1)} KB）` })
    } catch (e) {
      toast({ title: '导出失败', description: (e as Error).message, variant: 'destructive' })
    } finally {
      setExporting(false)
    }
  }

  const handleFileSelect = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const data = JSON.parse(text)
        // 预览
        const preview = {
          runner: !!data.runner,
          weeks: Array.isArray(data.weeks) ? data.weeks.length : 0,
          sessions: Array.isArray(data.weeks) ? data.weeks.reduce((s: number, w: { sessions?: unknown[] }) => s + (w.sessions?.length || 0), 0) : 0,
          completions: Array.isArray(data.weeks)
            ? data.weeks.reduce((s: number, w: { sessions?: Array<{ completion?: unknown }> }) =>
                s + (w.sessions?.filter((sess) => sess.completion).length || 0), 0)
            : 0,
          shoes: Array.isArray(data.shoes) ? data.shoes.length : 0,
          recovery: Array.isArray(data.recoveryLogs) ? data.recoveryLogs.length : 0,
        }
        setPreviewData(preview)
        setPendingData(data)
        setImportResult(null)
      } catch (err) {
        toast({ title: '文件解析失败', description: '请选择有效的 JSON 备份文件', variant: 'destructive' })
      }
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!pendingData) return
    if (importMode === 'replace') {
      if (!confirm('⚠️ 替换模式将清空当前所有数据并用导入数据覆盖！\n\n确定继续吗？此操作不可撤销。')) return
    }
    setImporting(true)
    try {
      const res = await fetch('/api/data/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: pendingData, mode: importMode }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setImportResult(data.imported)
      toast({
        title: '✅ 导入完成',
        description: `${data.imported.weeks} 周 / ${data.imported.sessions} 训练课 / ${data.imported.completions} 完成记录`,
      })
      setPendingData(null)
      setPreviewData(null)
      onDataChanged()
    } catch (e) {
      toast({ title: '导入失败', description: (e as Error).message, variant: 'destructive' })
    } finally {
      setImporting(false)
    }
  }

  const handleClearAll = async () => {
    if (!confirm('⚠️ 确定清空所有数据吗？\n\n此操作将删除所有跑者、课表、完成记录、跑鞋、恢复数据。\n建议先导出备份！\n\n操作不可撤销。')) return
    if (!confirm('再次确认：真的要清空全部数据吗？')) return
    try {
      const res = await fetch('/api/data/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { runner: null, weeks: [], shoes: [], recoveryLogs: [] }, mode: 'replace' }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast({ title: '✅ 已清空所有数据' })
      onDataChanged()
    } catch (e) {
      toast({ title: '清空失败', description: (e as Error).message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* 头部 */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-emerald-50/40 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">数据管理</h2>
            <p className="text-xs text-slate-500">导出备份 · 导入恢复 · 数据迁移</p>
          </div>
        </div>
        <div className="rounded-lg bg-emerald-50/60 border border-emerald-100 p-3 flex items-start gap-2">
          <Info className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
          <div className="text-xs text-slate-600">
            <p className="font-medium text-emerald-800 mb-0.5">数据安全提示</p>
            建议定期导出备份以防数据丢失。导入数据时选择「合并」模式会跳过已存在的周，「替换」模式会清空当前数据后导入。
          </div>
        </div>
      </div>

      {/* AI 配置状态 */}
      {aiConfig && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${aiConfig.configured ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
              <Server className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                AI 服务配置
                <Badge variant="outline" className={`text-[10px] ${aiConfig.configured ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  {aiConfig.configured ? '已配置' : '未配置'}
                </Badge>
              </h3>
              <p className="text-xs text-slate-500">VLM/LLM API 端点配置 · 支持环境变量自定义</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="text-slate-400 mb-0.5">配置来源</div>
              <div className="font-medium text-slate-700">{aiConfig.source}</div>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="text-slate-400 mb-0.5">API 端点</div>
              <div className="font-medium text-slate-700 truncate">{aiConfig.baseUrl || '-'}</div>
            </div>
          </div>
          <div className="mt-3 rounded-lg bg-blue-50/60 border border-blue-100 p-3 text-xs text-slate-600">
            <p className="font-medium text-blue-800 mb-1">💡 如何自定义 API 端点</p>
            <p>在项目根目录创建 <code className="px-1 py-0.5 bg-white rounded text-blue-700">.env</code> 文件，设置环境变量：</p>
            <pre className="mt-1.5 p-2 bg-white rounded text-[10px] overflow-x-auto"><code>{`ZAI_BASE_URL=https://your-api-endpoint.com/v1
ZAI_API_KEY=your_api_key`}</code></pre>
            <p className="mt-1.5">或创建 <code className="px-1 py-0.5 bg-white rounded text-blue-700">.z-ai-config</code> 文件（参考 .z-ai-config.example）。重启服务后生效。</p>
          </div>
        </div>
      )}

      {/* 离线模式（纯前端本地运行） */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <Database className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800">离线模式（本地运行）</h3>
            <p className="text-xs text-slate-500">数据保存在手机本地（SQLite），AI 直连 DeepSeek，无需服务器</p>
          </div>
          <Badge variant={offlineEnabled ? 'default' : 'outline'} className={offlineEnabled ? 'bg-emerald-600' : ''}>
            {offlineEnabled ? '已启用' : '未启用'}
          </Badge>
        </div>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-slate-500 mb-1.5 block">DeepSeek API Key（离线模式用）</Label>
            <div className="flex gap-2">
              <input
                type="password"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                placeholder="sk-..."
                value={dsKeyInput}
                onChange={(e) => setDsKeyInput(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={() => {
                  if (!dsKeyInput.trim()) { toast({ title: '请填写 API Key', variant: 'destructive' }); return }
                  setDeepseekConfig(dsKeyInput.trim())
                  toast({ title: '✅ 已保存', description: 'DeepSeek 配置已保存到本地' })
                }}
                className="gap-1.5"
              >
                <Settings className="h-4 w-4" />保存
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setOfflineMode(true)
                setOfflineEnabled(true)
                toast({ title: '✅ 已启用离线模式', description: '刷新页面后生效' })
              }}
              disabled={offlineEnabled}
              className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 flex-1"
            >
              <Database className="h-4 w-4" />启用离线模式
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setOfflineMode(false)
                setOfflineEnabled(false)
                toast({ title: '已关闭离线模式', description: '刷新页面后生效' })
              }}
              disabled={!offlineEnabled}
              className="gap-1.5 flex-1"
            >
              关闭
            </Button>
          </div>
          <p className="text-[11px] text-slate-400">
            Android APK 首次启动会自动启用离线模式。启用后所有数据存本地，仅 DeepSeek 调用需联网；AI 识图使用手机本地 OCR。
          </p>
        </div>
      </div>

      {/* 远程 API 服务器（APK/静态导出模式） */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
            <Server className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800">远程 API 服务器</h3>
            <p className="text-xs text-slate-500">APK / 静态导出模式下，所有数据请求将发送到该地址</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-sky-500"
            placeholder="https://your-server.com"
            value={apiBaseInput}
            onChange={(e) => setApiBaseInput(e.target.value)}
          />
          <Button
            onClick={() => {
              setApiBase(apiBaseInput.trim())
              toast({ title: '✅ 已保存', description: '远程 API 地址已更新，刷新页面后生效' })
            }}
            className="bg-sky-600 hover:bg-sky-700 gap-1.5"
          >
            <Settings className="h-4 w-4" />保存
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          留空表示同源模式（桌面版/浏览器直连本地服务）。APK 用户填写你部署的 PaceOn 服务器地址（如 https://pace.on 或局域网 IP:3000）。
        </p>
      </div>

      {/* 导出 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">导出备份</h3>
              <p className="text-xs text-slate-500">将所有数据导出为 JSON 文件（跑者档案/课表/完成记录/跑鞋/恢复记录）</p>
            </div>
          </div>
          <Button onClick={handleExport} disabled={exporting} className="bg-emerald-600 hover:bg-emerald-700 gap-1.5">
            {exporting ? <><Loader2 className="h-4 w-4 animate-spin" />导出中...</> : <><Download className="h-4 w-4" />导出 JSON</>}
          </Button>
        </div>
      </div>

      {/* 导入 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">导入数据</h3>
            <p className="text-xs text-slate-500">从 JSON 备份文件恢复或迁移数据</p>
          </div>
        </div>

        {/* 文件选择 */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 hover:border-sky-300 hover:bg-sky-50/30 p-6 text-center transition-all mb-4"
        >
          <FileJson className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <p className="text-sm font-medium text-slate-600">点击选择 JSON 备份文件</p>
          <p className="text-xs text-slate-400 mt-1">支持 PaceOn 导出的 .json 格式</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }}
          />
        </div>

        {/* 预览 */}
        {previewData && (
          <div className="space-y-4">
            <div className="rounded-xl bg-sky-50/60 border border-sky-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-sky-600" />
                <span className="text-sm font-medium text-slate-800">文件解析成功</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <PreviewItem label="跑者档案" value={previewData.runner ? '有' : '无'} />
                <PreviewItem label="训练周" value={`${previewData.weeks} 个`} />
                <PreviewItem label="训练课" value={`${previewData.sessions} 节`} />
                <PreviewItem label="完成记录" value={`${previewData.completions} 条`} />
                <PreviewItem label="跑鞋" value={`${previewData.shoes} 双`} />
                <PreviewItem label="恢复记录" value={`${previewData.recovery} 天`} />
              </div>
            </div>

            {/* 导入模式 */}
            <div>
              <Label className="text-xs text-slate-500 mb-2 block">导入模式</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setImportMode('merge')}
                  className={`text-left rounded-xl border p-3 transition-all ${
                    importMode === 'merge' ? 'border-emerald-400 bg-emerald-50 ring-1 ring-emerald-200' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <RefreshCw className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-slate-800">合并</span>
                    {importMode === 'merge' && <Badge className="text-[10px] bg-emerald-100 text-emerald-700">已选</Badge>}
                  </div>
                  <p className="text-[11px] text-slate-500">跳过已存在的周，仅导入新数据</p>
                </button>
                <button
                  onClick={() => setImportMode('replace')}
                  className={`text-left rounded-xl border p-3 transition-all ${
                    importMode === 'replace' ? 'border-rose-400 bg-rose-50 ring-1 ring-rose-200' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    <span className="text-sm font-medium text-slate-800">替换</span>
                    {importMode === 'replace' && <Badge className="text-[10px] bg-rose-100 text-rose-700">已选</Badge>}
                  </div>
                  <p className="text-[11px] text-slate-500">清空当前所有数据后导入</p>
                </button>
              </div>
            </div>

            {importMode === 'replace' && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
                <div className="text-xs text-rose-700">
                  <p className="font-medium mb-0.5">⚠️ 替换模式警告</p>
                  当前所有数据（跑者/课表/完成记录/跑鞋/恢复）将被永久删除，请确保已导出备份！
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setPendingData(null); setPreviewData(null) }} className="gap-1.5">
                取消
              </Button>
              <Button onClick={handleImport} disabled={importing} className="bg-sky-600 hover:bg-sky-700 gap-1.5 flex-1">
                {importing ? <><Loader2 className="h-4 w-4 animate-spin" />导入中...</> : <><Upload className="h-4 w-4" />确认导入（{importMode === 'merge' ? '合并' : '替换'}）</>}
              </Button>
            </div>
          </div>
        )}

        {/* 导入结果 */}
        {importResult && (
          <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-800">导入完成</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <ResultItem label="跑者" value={importResult.runner} />
              <ResultItem label="训练周" value={importResult.weeks} />
              <ResultItem label="训练课" value={importResult.sessions} />
              <ResultItem label="完成记录" value={importResult.completions} />
              <ResultItem label="跑鞋" value={importResult.shoes} />
              <ResultItem label="跑鞋使用" value={importResult.usages} />
              <ResultItem label="恢复记录" value={importResult.recovery} />
              <ResultItem label="AI 点评" value={importResult.reviews} />
            </div>
          </div>
        )}
      </div>

      {/* 危险操作 */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50/30 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-rose-800">清空所有数据</h3>
            <p className="text-xs text-rose-600">永久删除所有训练数据，操作不可撤销</p>
          </div>
        </div>
        <Button onClick={handleClearAll} variant="destructive" className="gap-1.5">
          <Trash2 className="h-4 w-4" />清空全部数据
        </Button>
      </div>
    </div>
  )
}

function PreviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between bg-white rounded px-2 py-1.5">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  )
}

function ResultItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded px-2 py-1.5 text-center">
      <div className="text-lg font-bold text-emerald-700">{value}</div>
      <div className="text-[10px] text-slate-500">{label}</div>
    </div>
  )
}
