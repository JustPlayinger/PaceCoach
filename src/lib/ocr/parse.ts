/**
 * 从 OCR 文本解析训练字段。
 *
 * 利用"跑步 App 截图布局一致"的特点：以中英文标签锚点 + 正则提取核心指标。
 * 数值型字段只信任标签邻近匹配，避免把无关数字（如日期、海拔）误认为心率等。
 */
import { detectAppSource } from './templates'

export { detectAppSource } from './templates'

export interface OcrParsedFields {
  distance?: number
  duration?: number
  avgPace?: string
  avgPaceSec?: number
  avgHr?: number
  maxHr?: number
  elevation?: number
  descent?: number
  cadence?: number
  strideLength?: number
  steps?: number
  calories?: number
  avgSpeed?: number
  vo2max?: number
  weather?: string
  temperature?: number
  appSource?: string
}

/** 清理数字：去千分位逗号、全角转半角、去空白 */
function cleanNum(s: string): string {
  return s
    .replace(/[,，\s]/g, '')
    .replace(/[０-９]/g, (c) => String('０１２３４５６７８９'.indexOf(c)))
}

function toNum(s: string): number | null {
  const n = parseFloat(cleanNum(s))
  return Number.isFinite(n) ? n : null
}

function firstMatch(text: string, patterns: RegExp[]): RegExpMatchArray | null {
  for (const p of patterns) {
    const m = text.match(p)
    if (m) return m
  }
  return null
}

function timeToSec(m: RegExpMatchArray): number | null {
  const nums = m.slice(1).map((x) => parseInt(x, 10))
  if (nums.some((n) => Number.isNaN(n))) return null
  if (nums.length === 2) return nums[0] * 60 + nums[1]
  if (nums.length === 3) return nums[0] * 3600 + nums[1] * 60 + nums[2]
  return null
}

function paceMatchToSec(m: RegExpMatchArray): { str: string; sec: number } | null {
  const min = parseInt(m[1], 10)
  const sec = parseInt(m[2], 10)
  if (Number.isNaN(min) || Number.isNaN(sec) || sec > 59) return null
  const total = min * 60 + sec
  return { str: `${min}:${String(sec).padStart(2, '0')}/km`, sec: total }
}

const WEATHER_WORDS = [
  '晴间多云', '多云', '雷阵雨', '雨夹雪', '阵雨', '小雨', '中雨', '大雨', '暴雨',
  '小雪', '中雪', '大雪', '雾霾', '扬沙', '沙尘', '阴', '晴', '雾', '霾', '雨', '雪',
]

export function parseFieldsFromText(rawText: string): OcrParsedFields {
  const out: OcrParsedFields = {}
  if (!rawText) return out

  // 归一化：tesseract 可能把大字数字识别成 "1 0 0 0"。
  // 仅合并"整段由单个数字+空格组成"的数字串（如 "1 0 0 0"→"1000"），
  // 避免误合并不同字段的数字（如 "00:56:35 787 kcal" 中的 "35 787"）。
  const text = rawText.replace(
    /(^|[\s\D])(\d(?: \d)+)(?=\D|$)/g,
    (_m, a, b) => a + b.replace(/ /g, '')
  )

  // 来源 App
  const appSource = detectAppSource(text)
  if (appSource) out.appSource = appSource

  // 距离：收集所有 "N km/公里" 候选取最大值
  // （兼容两种布局：单一总距离 "10.00 km"，或分段配速表 "…5 km…10 km"，末段=总距离）
  const distancePatterns = [
    /距离\s*[:：]?\s*([\d.]+)/,
    /([\d.]+)\s*(?:公里|千米)\b(?!\/)/,
    /([\d.]+)\s*km\b(?!\/h|H)/,
    /跑量\s*[:：]?\s*([\d.]+)/,
  ]
  const distanceCandidates: number[] = []
  for (const p of distancePatterns) {
    const re = new RegExp(p.source, p.flags + 'g')
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      const v = toNum(m[1])
      if (v != null && v > 0 && v <= 100) distanceCandidates.push(v)
    }
  }
  if (distanceCandidates.length > 0) {
    out.distance = Math.max(...distanceCandidates)
  }

  // 时长（优先带标签；再通用 H:MM:SS）
  const durationM = firstMatch(text, [
    /(?:时长|用时|运动时长|运动时间|总时长|累计时长|duration)\s*[:：]?\s*(\d{1,2}):(\d{2}):(\d{2})/i,
    /(?:时长|用时|运动时长|运动时间|总时长|累计时长|duration)\s*[:：]?\s*(\d{1,3}):(\d{2})/i,
    /(?:(\d{1,2})\s*时\s*(\d{1,2})\s*分\s*(\d{1,2})\s*秒)|(?:(\d{1,3})\s*分\s*(\d{1,2})\s*秒)/,
    /(\d{1,2}):(\d{2}):(\d{2})/,
  ])
  if (durationM) {
    const v = timeToSec(durationM)
    if (v != null && v > 0) out.duration = v
  }

  // 平均配速
  const paceM = firstMatch(text, [
    /(?:平均配速|配速|avg\s*pace|pace)\s*[:：]?\s*(\d{1,2})\s*[:'’′:]\s*(\d{2})(?:″|"|'')?/i,
    /(\d{1,2})\s*[:'’′:]\s*(\d{2})(?:″|"|'')?\s*(?:\/\s*(?:km|公里|千米|KM))/i,
  ])
  if (paceM) {
    const r = paceMatchToSec(paceM)
    if (r) {
      out.avgPace = r.str
      out.avgPaceSec = r.sec
    }
  }

  // 平均心率 / 最大心率
  const avgHrM = firstMatch(text, [
    /(?:平均心率|avg\s*(?:hr|heart\s*rate))\s*[:：]?\s*(\d{2,3})/i,
    /(\d{2,3})\s*bpm/i,
  ])
  if (avgHrM) {
    const v = parseInt(avgHrM[1], 10)
    if (!Number.isNaN(v) && v >= 60) out.avgHr = v
  }
  const maxHrM = firstMatch(text, [
    /(?:最大心率|最高心率|max\s*(?:hr|heart\s*rate)|maximum\s+heart\s*rate)\s*[:：]?\s*(\d{2,3})/i,
  ])
  if (maxHrM) {
    const v = parseInt(maxHrM[1], 10)
    if (!Number.isNaN(v) && v >= 60) out.maxHr = v
  }

  // 步频（优先 "数字+steps/min" 后缀，避免 "Avg cadence 00 Avg stride" 误匹配）
  const cadenceM = firstMatch(text, [
    /(\d{2,3})\s*(?:步\/分|步每分钟|spm|steps?\s*\/\s*min)/i,
    /(?:平均步频|步频|cadence)\s*[:：]?\s*(\d{2,3})/i,
  ])
  if (cadenceM) {
    const v = parseInt(cadenceM[1], 10)
    if (!Number.isNaN(v) && v >= 120) out.cadence = v
  }

  // 爬升 / 下降
  const elevM = firstMatch(text, [
    /(?:累计爬升|爬升|上升|爬高|elevation\s*gain|gain)\s*[:：]?\s*([\d.]+)/i,
    /([\d.]+)\s*(?:m|米)\s*(?:爬升|上升|gain)/i,
  ])
  if (elevM) {
    const v = toNum(elevM[1])
    if (v != null) out.elevation = v
  }
  const descM = firstMatch(text, [
    /(?:累计下降|下降|下坡|total\s*descent|descent|loss)\s*[:：]?\s*([\d.]+)/i,
    /([\d.]+)\s*(?:m|米)\s*(?:下降|下坡|loss)/i,
  ])
  if (descM) {
    const v = toNum(descM[1])
    if (v != null) out.descent = v
  }

  // 卡路里（优先 "数字+kcal/千卡" 后缀；跳过 0 值误匹配）
  const calM = firstMatch(text, [
    /([\d.]+)\s*(?:千卡|大卡|kcal|KCal|卡路里|calories)/i,
    /(?:卡路里|千卡|大卡|消耗|calories|kcal)\s*[:：]?\s*([\d.]+)/i,
  ])
  if (calM) {
    const v = toNum(calM[1])
    if (v != null && v > 0) out.calories = v
  }

  // 平均速度
  const speedM = firstMatch(text, [
    /(?:平均速度|速度|avg\s*speed|speed)\s*[:：]?\s*([\d.]+)\s*km\/h/i,
    /([\d.]+)\s*km\/h/i,
  ])
  if (speedM) {
    const v = toNum(speedM[1])
    if (v != null) out.avgSpeed = v
  }

  // 步数（优先 "数字+steps/步" 后缀，避免匹配 4 位以下数字）
  const stepsM = firstMatch(text, [
    /([\d,]{4,})\s*(?:步|steps?)/i,
    /(?:步数|总步数|steps)\s*[:：]?\s*([\d,]+)/i,
  ])
  if (stepsM) {
    const v = toNum(stepsM[1])
    if (v != null && v > 100) out.steps = v
  }

  // 步幅
  const strideM = firstMatch(text, [
    /(?:步幅|步长)\s*[:：]?\s*([\d.]+)/,
    /([\d.]+)\s*(?:cm|厘米)\s*(?:步幅|步长)/,
  ])
  if (strideM) {
    const v = toNum(strideM[1])
    if (v != null && v > 30) out.strideLength = v
  }

  // 最大摄氧量
  const vo2M = firstMatch(text, [
    /(?:最大摄氧量|vo2\s*max)\s*[:：]?\s*([\d.]+)/i,
  ])
  if (vo2M) {
    const v = toNum(vo2M[1])
    if (v != null) out.vo2max = v
  }

  // 温度
  const tempM = firstMatch(text, [
    /(?:温度|气温)\s*[:：]?\s*(-?[\d.]+)\s*°?\s*c/i,
    /(-?[\d.]+)\s*°\s*c/i,
  ])
  if (tempM) {
    const v = toNum(tempM[1])
    if (v != null && v > -40 && v < 60) out.temperature = v
  }

  // 天气
  for (const w of WEATHER_WORDS) {
    if (text.includes(w)) {
      out.weather = w
      break
    }
  }

  return out
}
