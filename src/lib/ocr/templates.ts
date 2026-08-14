/**
 * 训练 App 来源识别（templates）
 *
 * 利用"跑步 App 截图布局往往一致"的特点：通过 OCR 文本中的品牌关键字
 * 识别来源 App，后续可针对各 App 的固定布局做模板级字段锚点提取。
 */
import type { OcrLine } from './ocr'

/** 来源 App 检测规则（按优先级排列） */
const APP_RULES: { key: string; label: string; patterns: RegExp[] }[] = [
  { key: 'keep', label: 'Keep', patterns: [/keep/i, /即刻运动/] },
  { key: 'garmin', label: 'Garmin', patterns: [/garmin/i, /佳明/, /connect\s*iq/i] },
  { key: 'strava', label: 'Strava', patterns: [/strava/i] },
  { key: 'huawei', label: '华为运动健康', patterns: [/华为运动/, /华为健康/, /华为穿戴/, /huawei/i, /华为/i] },
  { key: 'huawei_health', label: '华为运动健康', patterns: [/运动健康/i] },
  { key: 'codoon', label: '咕咚', patterns: [/咕咚/, /codoon/i] },
  { key: 'joyrun', label: '悦跑圈', patterns: [/悦跑圈/, /joyrun/i] },
  { key: 'xiaomi', label: '小米运动', patterns: [/小米运动/, /zepp/i, /amazfit/i] },
  { key: 'coros', label: '高驰', patterns: [/高驰/, /coros/i] },
  { key: 'suunto', label: '颂拓', patterns: [/颂拓/, /suunto/i] },
  { key: 'polar', label: 'Polar', patterns: [/polar/i] },
  { key: 'apple', label: 'Apple 健身', patterns: [/apple\s*(?:watch|fitness|health)/i, /体能训练/] },
  { key: 'nihao', label: 'NIKE', patterns: [/nike/i, /nike\s*run/i] },
]

export function detectAppSource(text: string): string | null {
  if (!text) return null
  for (const rule of APP_RULES) {
    for (const p of rule.patterns) {
      if (p.test(text)) return rule.label
    }
  }
  return null
}

/** 布局辅助：在 OCR 行中定位某标签行的上下文（标签行 + 其下方若干行） */
export function findLabelContext(lines: OcrLine[], labelPattern: RegExp, belowLines = 2): string[] {
  const out: string[] = []
  for (let i = 0; i < lines.length; i++) {
    if (labelPattern.test(lines[i].text)) {
      out.push(lines[i].text)
      for (let j = 1; j <= belowLines && i + j < lines.length; j++) {
        out.push(lines[i + j].text)
      }
    }
  }
  return out
}
