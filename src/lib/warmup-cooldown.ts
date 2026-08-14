// 训练热身/冷身指导库

export interface WarmupStep {
  name: string
  duration: string
  detail: string
}

export interface CooldownStep {
  name: string
  duration: string
  detail: string
}

export interface WarmupCooldownGuide {
  warmup: {
    totalDuration: string
    steps: WarmupStep[]
    tips: string[]
  }
  cooldown: {
    totalDuration: string
    steps: CooldownStep[]
    tips: string[]
  }
  stretches: { name: string; target: string; duration: string }[]
}

// 根据训练类型生成热身/冷身方案
export function getWarmupCooldownGuide(
  type: string,
  intensity?: string | null,
  plannedDistance?: number | null
): WarmupCooldownGuide {
  const isHighIntensity = type === 'interval' || type === 'tempo' || intensity === 'Z4' || intensity === 'Z5'
  const isLong = type === 'long' || (plannedDistance != null && plannedDistance >= 15)
  const isEasy = type === 'easy' || type === 'recovery'

  // 热身步骤
  let warmupSteps: WarmupStep[]
  if (isHighIntensity) {
    warmupSteps = [
      { name: '慢跑热身', duration: '10-15 分钟', detail: '轻松配速慢跑，心率逐渐升至 Z2' },
      { name: '动态拉伸', duration: '5 分钟', detail: '高抬腿、后踢腿、侧向移动、髋部环绕' },
      { name: '加速跑', duration: '4×100m', detail: '逐渐加速至目标配速的 90%，每组间慢走 30s' },
      { name: '激活练习', duration: '3 分钟', detail: '深蹲跳、弓步跳，激活下肢爆发力' },
    ]
  } else if (isLong) {
    warmupSteps = [
      { name: '慢跑热身', duration: '10 分钟', detail: '比目标配速慢 60-90s/km，逐步进入状态' },
      { name: '动态拉伸', duration: '5 分钟', detail: '重点：髋部、腘绳肌、小腿' },
      { name: '关节激活', duration: '3 分钟', detail: '脚踝、膝盖、髋部关节环绕' },
    ]
  } else if (isEasy) {
    warmupSteps = [
      { name: '慢跑热身', duration: '5-8 分钟', detail: '从步行开始，逐渐过渡到轻松跑配速' },
      { name: '动态拉伸', duration: '3 分钟', detail: '简易动态拉伸，唤醒肌肉' },
    ]
  } else {
    warmupSteps = [
      { name: '慢跑热身', duration: '8-10 分钟', detail: '轻松配速，心率升至 Z2' },
      { name: '动态拉伸', duration: '5 分钟', detail: '全身动态拉伸' },
    ]
  }

  // 冷身步骤
  const cooldownSteps: CooldownStep[] = isHighIntensity
    ? [
        { name: '慢跑冷身', duration: '8-10 分钟', detail: '从快走过渡到慢跑，让心率逐渐降至 Z1' },
        { name: '步行', duration: '3-5 分钟', detail: '完全放松步行，帮助乳酸清除' },
      ]
    : isLong
      ? [
          { name: '慢跑/步行冷身', duration: '10 分钟', detail: '最后 1km 放慢配速，结束后步行 3 分钟' },
        ]
      : [
          { name: '慢跑/步行冷身', duration: '5-8 分钟', detail: '降低配速，让心率回落' },
        ]

  // 拉伸（静态）
  const stretches = getStretches(type)

  // 提示
  const warmupTips = getWarmupTips(type, isHighIntensity, isLong)
  const cooldownTips = getCooldownTips(type, isHighIntensity, isLong)

  return {
    warmup: {
      totalDuration: isHighIntensity ? '20-25 分钟' : isLong ? '15-18 分钟' : '8-10 分钟',
      steps: warmupSteps,
      tips: warmupTips,
    },
    cooldown: {
      totalDuration: isHighIntensity ? '15-20 分钟' : isLong ? '15 分钟' : '8-10 分钟',
      steps: cooldownSteps,
      tips: cooldownTips,
    },
    stretches,
  }
}

function getStretches(type: string): { name: string; target: string; duration: string }[] {
  const base = [
    { name: '股四头肌拉伸', target: '大腿前侧', duration: '每侧 30s' },
    { name: '腘绳肌拉伸', target: '大腿后侧', duration: '每侧 30s' },
    { name: '小腿拉伸', target: '小腿', duration: '每侧 30s' },
    { name: '臀部拉伸', target: '臀大肌', duration: '每侧 30s' },
    { name: '髂胫束拉伸', target: '大腿外侧', duration: '每侧 30s' },
  ]
  if (type === 'interval' || type === 'tempo') {
    return [
      ...base,
      { name: '髋屈肌拉伸', target: '髋部前侧', duration: '每侧 30s' },
      { name: '足底拉伸', target: '足底筋膜', duration: '每侧 30s' },
    ]
  }
  if (type === 'long') {
    return [
      ...base,
      { name: '下背部拉伸', target: '腰背', duration: '60s' },
      { name: '比目鱼肌拉伸', target: '小腿深层', duration: '每侧 30s' },
    ]
  }
  return base
}

function getWarmupTips(type: string, isHigh: boolean, isLong: boolean): string[] {
  const tips: string[] = []
  if (isHigh) {
    tips.push('高强度训练前热身务必充分，避免肌肉拉伤')
    tips.push('加速跑时专注跑姿，感受目标配速的节奏')
  }
  if (isLong) {
    tips.push('长跑前 1-2 小时完成进食，补充 200-300 大卡碳水')
    tips.push('出发前确认补给就绪（能量胶、水、电解质）')
  }
  if (type === 'recovery') {
    tips.push('恢复跑不求速度，专注放松与呼吸节奏')
  }
  tips.push('热身时若感到异常疲劳或疼痛，应降低训练强度或休息')
  return tips
}

function getCooldownTips(type: string, isHigh: boolean, isLong: boolean): string[] {
  const tips: string[] = []
  tips.push('冷身后立即进行静态拉伸，此时肌肉温度高、拉伸效果好')
  if (isHigh) {
    tips.push('高强度训练后 30 分钟内补充碳水+蛋白质（比例 3:1）')
    tips.push('当晚保证充足睡眠，促进恢复')
  }
  if (isLong) {
    tips.push('长跑后 1 小时内补充 500-800ml 电解质水')
    tips.push('次日可进行 20 分钟交叉训练（游泳/骑车）促进主动恢复')
  }
  tips.push('使用泡沫轴放松紧张肌群，每个部位 1-2 分钟')
  return tips
}

// 训练类型对应的目标心率区间提示
export function getTargetHeartRate(type: string, intensity?: string | null, maxHr?: number | null, restingHr?: number | null): string {
  if (!maxHr || !restingHr) return '请先在跑者档案设置心率参数'
  const reserve = maxHr - restingHr
  const zones: Record<string, [number, number]> = {
    rest: [0, 0.5],
    Z1: [0.5, 0.6],
    Z2: [0.6, 0.7],
    Z3: [0.7, 0.8],
    Z4: [0.8, 0.9],
    Z5: [0.9, 1.0],
  }
  const zone = intensity && zones[intensity] ? zones[intensity] : zones.Z2
  const min = Math.round(restingHr + reserve * zone[0])
  const max = Math.round(restingHr + reserve * zone[1])
  return `${min}-${max} bpm`
}
