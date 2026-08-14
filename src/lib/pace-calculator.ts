// 训练配速计算器：基于目标赛事成绩计算各训练区间配速

// 配速格式转换：秒/km <-> "M:SS/km"
export function secToPaceStr(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function paceStrToSec(pace: string): number | null {
  const m = pace.match(/(\d+):(\d+)/)
  if (!m) return null
  return parseInt(m[1]) * 60 + parseInt(m[2])
}

// 时间格式 "H:MM:SS" 或 "MM:SS" -> 秒
export function timeStrToSec(time: string): number | null {
  const parts = time.split(':').map(p => parseInt(p.trim()))
  if (parts.some(isNaN)) return null
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return null
}

export function secToTimeStr(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.round(sec % 60)
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

// 各距离的标准距离系数（用于估算）
export const RACE_DISTANCES = {
  '5K': 5,
  '10K': 10,
  '半马': 21.0975,
  '全马': 42.195,
} as const

// 基于 Riegel 公式从基准距离/时间预估目标距离的时间
export function predictTime(baseDistance: number, baseTimeSec: number, targetDistance: number): number {
  // T2 = T1 * (D2/D1)^1.06
  return Math.round(baseTimeSec * Math.pow(targetDistance / baseDistance, 1.06))
}

// 各训练区间配速系数（相对于阈值配速的百分比）
// 阈值配速 = 跑者能维持约 1 小时的配速（约 10K-15K 比赛配速）
export interface PaceZones {
  easy: { pace: string; paceSec: number; range: string; desc: string; hrZone: string }
  marathon: { pace: string; paceSec: number; range: string; desc: string; hrZone: string }
  tempo: { pace: string; paceSec: number; range: string; desc: string; hrZone: string }
  threshold: { pace: string; paceSec: number; range: string; desc: string; hrZone: string }
  interval: { pace: string; paceSec: number; range: string; desc: string; hrZone: string }
  repetition: { pace: string; paceSec: number; range: string; desc: string; hrZone: string }
  long: { pace: string; paceSec: number; range: string; desc: string; hrZone: string }
  recovery: { pace: string; paceSec: number; range: string; desc: string; hrZone: string }
}

// 基于目标马拉松时间计算各训练区间配速
export function calculatePaceZones(targetRace: string, targetTimeSec: number): PaceZones {
  // 计算阈值配速：约等于 10K-15K 比赛配速
  // 用 Riegel 从全马时间反推 10K 时间，再除以 10 得到阈值配速
  let thresholdPaceSec: number

  if (targetRace === '全马') {
    // 全马时间 -> 10K 时间
    const tenKTime = predictTime(42.195, targetTimeSec, 10)
    thresholdPaceSec = Math.round(tenKTime / 10)
  } else if (targetRace === '半马') {
    const tenKTime = predictTime(21.0975, targetTimeSec, 10)
    thresholdPaceSec = Math.round(tenKTime / 10)
  } else if (targetRace === '10K') {
    thresholdPaceSec = Math.round(targetTimeSec / 10)
  } else if (targetRace === '5K') {
    // 5K -> 10K
    const tenKTime = predictTime(5, targetTimeSec, 10)
    thresholdPaceSec = Math.round(tenKTime / 10)
  } else {
    // 默认：假设 5:00/km 阈值
    thresholdPaceSec = 300
  }

  // 各训练区间配速（基于阈值配速的百分比）
  // 数值越大 = 配速越慢（秒/km 越大）
  const easyPace = Math.round(thresholdPaceSec * 1.25)      // 比阈值慢 25%
  const marathonPace = Math.round(thresholdPaceSec * 1.06)  // 比阈值慢 6%
  const tempoPace = Math.round(thresholdPaceSec * 1.02)     // 比阈值慢 2%
  const intervalPace = Math.round(thresholdPaceSec * 0.95) // 比阈值快 5%
  const repetitionPace = Math.round(thresholdPaceSec * 0.88) // 比阈值快 12%
  const longPace = Math.round(thresholdPaceSec * 1.20)      // 比阈值慢 20%
  const recoveryPace = Math.round(thresholdPaceSec * 1.35)  // 比阈值慢 35%

  return {
    easy: {
      pace: secToPaceStr(easyPace),
      paceSec: easyPace,
      range: `${secToPaceStr(easyPace - 10)} ~ ${secToPaceStr(easyPace + 10)}`,
      desc: '轻松跑/Easy Run，建立有氧基础，能正常对话',
      hrZone: 'Z2',
    },
    marathon: {
      pace: secToPaceStr(marathonPace),
      paceSec: marathonPace,
      range: `${secToPaceStr(marathonPace - 5)} ~ ${secToPaceStr(marathonPace + 5)}`,
      desc: '马拉松配速/M Pace，模拟比赛节奏',
      hrZone: 'Z3',
    },
    tempo: {
      pace: secToPaceStr(tempoPace),
      paceSec: tempoPace,
      range: `${secToPaceStr(tempoPace - 5)} ~ ${secToPaceStr(tempoPace + 5)}`,
      desc: '节奏跑/T Pace，提升乳酸阈值，"舒适地艰苦"',
      hrZone: 'Z4',
    },
    threshold: {
      pace: secToPaceStr(thresholdPaceSec),
      paceSec: thresholdPaceSec,
      range: `${secToPaceStr(thresholdPaceSec - 5)} ~ ${secToPaceStr(thresholdPaceSec + 5)}`,
      desc: '阈值配速，约能维持 1 小时的最快配速',
      hrZone: 'Z4-Z5',
    },
    interval: {
      pace: secToPaceStr(intervalPace),
      paceSec: intervalPace,
      range: `${secToPaceStr(Math.max(0, intervalPace - 8))} ~ ${secToPaceStr(intervalPace + 8)}`,
      desc: '间歇跑/I Pace，提升最大摄氧量 VO2max',
      hrZone: 'Z5',
    },
    repetition: {
      pace: secToPaceStr(repetitionPace),
      paceSec: repetitionPace,
      range: `${secToPaceStr(Math.max(0, repetitionPace - 8))} ~ ${secToPaceStr(repetitionPace + 8)}`,
      desc: '重复跑/R Pace，提升速度与跑姿经济性',
      hrZone: 'Z5+',
    },
    long: {
      pace: secToPaceStr(longPace),
      paceSec: longPace,
      range: `${secToPaceStr(longPace - 10)} ~ ${secToPaceStr(longPace + 15)}`,
      desc: '长跑/L Pace，建立耐力，比轻松跑稍快',
      hrZone: 'Z2',
    },
    recovery: {
      pace: secToPaceStr(recoveryPace),
      paceSec: recoveryPace,
      range: `${secToPaceStr(recoveryPace - 10)} ~ ${secToPaceStr(recoveryPace + 20)}`,
      desc: '恢复跑/Recovery，促进排酸，不求速度',
      hrZone: 'Z1',
    },
  }
}

// 训练类型 -> 推荐配速区间映射
export const TYPE_TO_PACE_ZONE: Record<string, keyof PaceZones> = {
  easy: 'easy',
  tempo: 'tempo',
  interval: 'interval',
  long: 'long',
  recovery: 'recovery',
  cross: 'easy',
  rest: 'recovery',
}
