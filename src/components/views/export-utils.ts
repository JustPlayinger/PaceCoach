import type { Week, Runner } from './types'
import { SESSION_TYPES, PHASE_LABELS, DAY_LABELS, formatDuration, secToPace, getWeekRange } from '@/lib/training'

// 导出课表为 Markdown 文本
export function weekToMarkdown(week: Week, runner: Runner | null): string {
  const sessions = [...week.sessions].sort((a, b) => (a.dayOfWeek === 0 ? 7 : a.dayOfWeek) - (b.dayOfWeek === 0 ? 7 : b.dayOfWeek))
  const completed = sessions.filter(s => s.status === 'completed')
  const plannedTotal = sessions.reduce((sum, s) => sum + (s.plannedDistance || 0), 0)
  const actualTotal = completed.reduce((sum, s) => sum + (s.completion?.distance || 0), 0)
  const completionRate = plannedTotal > 0 ? Math.min(100, Math.round((actualTotal / plannedTotal) * 100)) : 0

  let md = `# 🏃 PaceCoach 训练课表\n\n`
  md += `**第 ${week.weekNumber ?? '?'} 周 · ${PHASE_LABELS[week.phase || ''] || week.phase || '-'}**\n`
  md += `**周期：** ${getWeekRange(week.weekStart, week.weekEnd)}\n`
  if (runner) {
    md += `**跑者：** ${runner.name}`
    if (runner.targetRace) md += ` · 目标 ${runner.targetRace}`
    if (runner.targetTime) md += ` ${runner.targetTime}`
    md += `\n`
  }
  md += `\n**本周目标：** ${week.goal || '-'}\n\n`
  md += `## 📊 概览\n\n`
  md += `- 计划距离：${plannedTotal.toFixed(1)} km\n`
  md += `- 实际距离：${actualTotal.toFixed(1)} km\n`
  md += `- 完成度：${completionRate}%\n`
  md += `- 训练次数：${completed.length}/${sessions.length}\n`
  md += `- 累计时长：${formatDuration(completed.reduce((s, x) => s + (x.completion?.duration || 0), 0))}\n\n`
  md += `## 📅 每日训练\n\n`
  md += `| 日期 | 类型 | 计划 | 实际 | 配速 | 心率 | 状态 |\n`
  md += `|------|------|------|------|------|------|------|\n`
  for (const s of sessions) {
    const cfg = SESSION_TYPES[s.type] || SESSION_TYPES.easy
    const date = new Date(s.date)
    const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${DAY_LABELS[s.dayOfWeek]}`
    const planned = s.plannedDistance != null ? `${s.plannedDistance}km` : '休息'
    const actual = s.completion?.distance != null ? `${s.completion.distance}km` : '-'
    const pace = s.completion?.avgPace || s.plannedPace || '-'
    const hr = s.completion?.avgHr ? `${s.completion.avgHr}bpm` : '-'
    const status = s.status === 'completed' ? '✅' : s.status === 'skipped' ? '⏭️' : '⏳'
    md += `| ${dateStr} | ${cfg.icon} ${cfg.label} | ${planned} | ${actual} | ${pace} | ${hr} | ${status} |\n`
  }
  md += `\n---\n*由 PaceCoach 智能长跑训练指导系统生成 · ${new Date().toLocaleString('zh-CN')}*\n`
  return md
}

// 复制到剪贴板
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

// 下载文本文件
export function downloadTextFile(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 打印当前周（触发浏览器打印对话框，可选另存为 PDF）
export function printWeek(week: Week, runner: Runner | null) {
  const sessions = [...week.sessions].sort((a, b) => (a.dayOfWeek === 0 ? 7 : a.dayOfWeek) - (b.dayOfWeek === 0 ? 7 : b.dayOfWeek))
  const completed = sessions.filter(s => s.status === 'completed')
  const plannedTotal = sessions.reduce((sum, s) => sum + (s.plannedDistance || 0), 0)
  const actualTotal = completed.reduce((sum, s) => sum + (s.completion?.distance || 0), 0)
  const completionRate = plannedTotal > 0 ? Math.min(100, Math.round((actualTotal / plannedTotal) * 100)) : 0

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>PaceCoach 课表 - 第${week.weekNumber ?? '?'}周</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; color: #1e293b; padding: 32px; max-width: 800px; margin: 0 auto; }
  .header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #10b981; }
  .header h1 { font-size: 22px; color: #10b981; margin-bottom: 4px; }
  .header .subtitle { font-size: 13px; color: #64748b; }
  .meta { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; font-size: 12px; color: #475569; background: #f0fdf4; padding: 12px; border-radius: 8px; }
  .meta strong { color: #1e293b; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 20px; }
  .stat { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center; }
  .stat .val { font-size: 18px; font-weight: 700; color: #10b981; }
  .stat .lbl { font-size: 10px; color: #64748b; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #10b981; color: white; padding: 8px; text-align: left; font-weight: 500; }
  th:first-child { border-radius: 6px 0 0 0; }
  th:last-child { border-radius: 0 6px 0 0; }
  td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
  tr:nth-child(even) td { background: #f8fafc; }
  .type-easy { color: #059669; }
  .type-tempo { color: #ea580c; }
  .type-interval { color: #dc2626; }
  .type-long { color: #7c3aed; }
  .type-recovery { color: #0284c7; }
  .type-rest { color: #64748b; }
  .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
  @media print { body { padding: 16px; } .no-print { display: none; } }
</style>
</head>
<body>
  <div class="header">
    <h1>🏃 PaceCoach 训练课表</h1>
    <div class="subtitle">第 ${week.weekNumber ?? '?'} 周 · ${PHASE_LABELS[week.phase || ''] || week.phase || '-'} · ${getWeekRange(week.weekStart, week.weekEnd)}</div>
  </div>
  <div class="meta">
    <div>${runner ? `<strong>跑者：</strong>${runner.name}` : ''}</div>
    <div>${runner?.targetRace ? `<strong>目标：</strong>${runner.targetRace} ${runner.targetTime || ''}` : ''}</div>
    <div><strong>生成：</strong>${new Date().toLocaleString('zh-CN')}</div>
  </div>
  <div class="stats">
    <div class="stat"><div class="val">${plannedTotal.toFixed(1)}</div><div class="lbl">计划 km</div></div>
    <div class="stat"><div class="val">${actualTotal.toFixed(1)}</div><div class="lbl">实际 km</div></div>
    <div class="stat"><div class="val">${completionRate}%</div><div class="lbl">完成度</div></div>
    <div class="stat"><div class="val">${completed.length}/${sessions.length}</div><div class="lbl">训练次数</div></div>
  </div>
  <table>
    <thead><tr><th>日期</th><th>类型</th><th>训练内容</th><th>计划</th><th>实际</th><th>配速</th><th>心率</th></tr></thead>
    <tbody>
      ${sessions.map(s => {
        const cfg = SESSION_TYPES[s.type] || SESSION_TYPES.easy
        const date = new Date(s.date)
        const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${DAY_LABELS[s.dayOfWeek]}`
        const planned = s.plannedDistance != null ? `${s.plannedDistance}km${s.plannedPace ? ' @ ' + s.plannedPace : ''}` : '休息'
        const actual = s.completion?.distance != null ? `${s.completion.distance}km` : '-'
        const pace = s.completion?.avgPace || '-'
        const hr = s.completion?.avgHr ? `${s.completion.avgHr}` : '-'
        return `<tr><td>${dateStr}</td><td class="type-${s.type}">${cfg.icon} ${cfg.label}</td><td>${(s.description || '').slice(0, 40)}</td><td>${planned}</td><td>${actual}</td><td>${pace}</td><td>${hr}</td></tr>`
      }).join('')}
    </tbody>
  </table>
  <div class="footer">由 PaceCoach 智能长跑训练指导系统生成</div>
</body>
</html>`

  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 300)
  }
}
