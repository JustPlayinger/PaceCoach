// 训练计划模板库：预设全马/半马/10K 训练计划

export interface TemplateSession {
  dayOfWeek: number // 1-6, 0=周日
  type: string
  plannedDistance: number | null
  plannedDuration: number | null
  plannedPace: string | null
  intensity: string | null
  description: string
}

export interface TrainingTemplate {
  id: string
  name: string
  targetRace: string
  targetTime: string
  level: string // beginner / intermediate / advanced
  durationWeeks: number
  weeklyMileage: number
  description: string
  phases: {
    phase: string
    weeks: string
    goal: string
  }[]
  // 典型一周课表（作为示例与生成基础）
  sampleWeek: {
    weekGoal: string
    phase: string
    sessions: TemplateSession[]
  }
}

export const TRAINING_TEMPLATES: TrainingTemplate[] = [
  {
    id: 'marathon-beginner',
    name: '全马完赛计划（入门）',
    targetRace: '全马',
    targetTime: '4:30:00',
    level: 'beginner',
    durationWeeks: 16,
    weeklyMileage: 40,
    description: '适合首次挑战全马的跑者，从基础有氧开始，16 周循序渐进建立完赛能力。重点在于逐步增加长跑距离，培养耐力与心理韧性。',
    phases: [
      { phase: 'base', weeks: '第1-4周', goal: '基础有氧打底，建立每周 30-35km 跑量习惯' },
      { phase: 'build', weeks: '第5-10周', goal: '渐进增加跑量至 45km，长跑延伸至 25km' },
      { phase: 'peak', weeks: '第11-14周', goal: '巅峰期，长跑达 30-32km，模拟比赛配速' },
      { phase: 'taper', weeks: '第15-16周', goal: '减量期，保持强度减少跑量，储备体能' },
    ],
    sampleWeek: {
      weekGoal: '基础期典型周：建立有氧基础，周跑量 35km，含 1 次长跑',
      phase: 'base',
      sessions: [
        { dayOfWeek: 1, type: 'easy', plannedDistance: 6, plannedDuration: 38, plannedPace: '6:00/km', intensity: 'Z2', description: '轻松跑 6km，保持鼻吸口呼，结束后 10 分钟拉伸' },
        { dayOfWeek: 2, type: 'rest', plannedDistance: null, plannedDuration: null, plannedPace: null, intensity: 'rest', description: '休息日，可选 20 分钟泡沫轴放松或瑜伽' },
        { dayOfWeek: 3, type: 'tempo', plannedDistance: 10, plannedDuration: 60, plannedPace: '5:30/km', intensity: 'Z3-Z4', description: '热身 2km → 节奏跑 6km @ 5:30/km → 冷身 2km，节奏段心率 165-175' },
        { dayOfWeek: 4, type: 'easy', plannedDistance: 5, plannedDuration: 32, plannedPace: '6:10/km', intensity: 'Z2', description: '恢复跑 5km，专注步频 180+ 与放松' },
        { dayOfWeek: 5, type: 'rest', plannedDistance: null, plannedDuration: null, plannedPace: null, intensity: 'rest', description: '休息日，建议核心训练 15 分钟' },
        { dayOfWeek: 6, type: 'long', plannedDistance: 14, plannedDuration: 90, plannedPace: '5:50/km', intensity: 'Z2', description: '长跑 14km，配速 5:50，每 7km 补给一次能量胶' },
        { dayOfWeek: 0, type: 'recovery', plannedDistance: 4, plannedDuration: 26, plannedPace: '6:20/km', intensity: 'Z1', description: '恢复跑 4km，促进排酸' },
      ],
    },
  },
  {
    id: 'marathon-sub330',
    name: '全马 Sub 3:30 计划（进阶）',
    targetRace: '全马',
    targetTime: '3:30:00',
    level: 'intermediate',
    durationWeeks: 16,
    weeklyMileage: 60,
    description: '适合已有全马完赛经验、目标 sub 3:30 的跑者。强化乳酸阈值与最大摄氧量，周跑量 55-65km，含质量课与长跑。',
    phases: [
      { phase: 'base', weeks: '第1-4周', goal: '有氧基础，周跑量 50-55km，长跑 18-20km' },
      { phase: 'build', weeks: '第5-10周', goal: '强化期，加入间歇与节奏跑，长跑延伸至 25-28km' },
      { phase: 'peak', weeks: '第11-14周', goal: '巅峰期，长跑 30-34km，马拉松配速跑 12-15km' },
      { phase: 'taper', weeks: '第15-16周', goal: '减量期，跑量减半保持强度' },
    ],
    sampleWeek: {
      weekGoal: '强化期典型周：周跑量 60km，含间歇、节奏跑与长跑',
      phase: 'build',
      sessions: [
        { dayOfWeek: 1, type: 'easy', plannedDistance: 10, plannedDuration: 60, plannedPace: '5:30/km', intensity: 'Z2', description: '轻松跑 10km，配速 5:30，保持有氧区间' },
        { dayOfWeek: 2, type: 'interval', plannedDistance: 12, plannedDuration: 70, plannedPace: '4:20/km', intensity: 'Z5', description: '热身 3km → 6×800m @ 4:20/km（间歇 400m 慢跑）→ 冷身 3km' },
        { dayOfWeek: 3, type: 'easy', plannedDistance: 8, plannedDuration: 46, plannedPace: '5:40/km', intensity: 'Z2', description: '恢复跑 8km，配速 5:40，步频 180+' },
        { dayOfWeek: 4, type: 'tempo', plannedDistance: 14, plannedDuration: 80, plannedPace: '4:50/km', intensity: 'Z4', description: '热身 3km → 节奏跑 8km @ 4:50/km → 冷身 3km，心率 170-180' },
        { dayOfWeek: 5, type: 'rest', plannedDistance: null, plannedDuration: null, plannedPace: null, intensity: 'rest', description: '休息日，核心 + 拉伸 20 分钟' },
        { dayOfWeek: 6, type: 'long', plannedDistance: 26, plannedDuration: 155, plannedPace: '5:20/km', intensity: 'Z2-Z3', description: '长跑 26km，前 18km Z2 @ 5:30，后 8km 加速至 Z3 @ 5:00' },
        { dayOfWeek: 0, type: 'recovery', plannedDistance: 6, plannedDuration: 38, plannedPace: '6:00/km', intensity: 'Z1', description: '恢复跑 6km，配速 6:00' },
      ],
    },
  },
  {
    id: 'halfmarathon-sub130',
    name: '半马 Sub 1:30 计划',
    targetRace: '半马',
    targetTime: '1:30:00',
    level: 'intermediate',
    durationWeeks: 12,
    weeklyMileage: 45,
    description: '适合目标半马 sub 1:30 的跑者，强化速度耐力与乳酸阈值。周跑量 40-50km，含间歇与节奏跑。',
    phases: [
      { phase: 'base', weeks: '第1-3周', goal: '有氧基础，周跑量 40km' },
      { phase: 'build', weeks: '第4-8周', goal: '强化期，加入间歇与阈值跑' },
      { phase: 'peak', weeks: '第9-10周', goal: '巅峰期，长跑 18-20km' },
      { phase: 'taper', weeks: '第11-12周', goal: '减量期' },
    ],
    sampleWeek: {
      weekGoal: '强化期典型周：周跑量 45km，含间歇、节奏跑与长跑',
      phase: 'build',
      sessions: [
        { dayOfWeek: 1, type: 'easy', plannedDistance: 8, plannedDuration: 45, plannedPace: '5:20/km', intensity: 'Z2', description: '轻松跑 8km' },
        { dayOfWeek: 2, type: 'interval', plannedDistance: 10, plannedDuration: 55, plannedPace: '4:00/km', intensity: 'Z5', description: '热身 2km → 5×1km @ 4:00/km（间歇 90s 慢跑）→ 冷身 3km' },
        { dayOfWeek: 3, type: 'rest', plannedDistance: null, plannedDuration: null, plannedPace: null, intensity: 'rest', description: '休息日' },
        { dayOfWeek: 4, type: 'tempo', plannedDistance: 12, plannedDuration: 65, plannedPace: '4:25/km', intensity: 'Z4', description: '热身 3km → 节奏跑 6km @ 4:25/km → 冷身 3km' },
        { dayOfWeek: 5, type: 'easy', plannedDistance: 6, plannedDuration: 34, plannedPace: '5:30/km', intensity: 'Z2', description: '恢复跑 6km' },
        { dayOfWeek: 6, type: 'long', plannedDistance: 16, plannedDuration: 85, plannedPace: '5:10/km', intensity: 'Z2-Z3', description: '长跑 16km，后 4km 加速至阈值配速' },
        { dayOfWeek: 0, type: 'recovery', plannedDistance: 5, plannedDuration: 30, plannedPace: '5:50/km', intensity: 'Z1', description: '恢复跑 5km' },
      ],
    },
  },
  {
    id: '10k-sub50',
    name: '10K Sub 50 计划（入门）',
    targetRace: '10K',
    targetTime: '0:50:00',
    level: 'beginner',
    durationWeeks: 8,
    weeklyMileage: 30,
    description: '适合目标 10K 跑进 50 分钟的入门跑者，8 周提升速度与耐力。周跑量 25-35km。',
    phases: [
      { phase: 'base', weeks: '第1-2周', goal: '建立跑量基础 25km' },
      { phase: 'build', weeks: '第3-6周', goal: '加入间歇与节奏跑' },
      { phase: 'taper', weeks: '第7-8周', goal: '减量备战' },
    ],
    sampleWeek: {
      weekGoal: '强化期典型周：周跑量 30km，含间歇与节奏跑',
      phase: 'build',
      sessions: [
        { dayOfWeek: 1, type: 'easy', plannedDistance: 5, plannedDuration: 30, plannedPace: '5:40/km', intensity: 'Z2', description: '轻松跑 5km' },
        { dayOfWeek: 2, type: 'interval', plannedDistance: 7, plannedDuration: 40, plannedPace: '4:40/km', intensity: 'Z5', description: '热身 2km → 6×400m @ 4:40/km（间歇 200m 慢跑）→ 冷身 2km' },
        { dayOfWeek: 3, type: 'rest', plannedDistance: null, plannedDuration: null, plannedPace: null, intensity: 'rest', description: '休息日' },
        { dayOfWeek: 4, type: 'tempo', plannedDistance: 8, plannedDuration: 45, plannedPace: '5:00/km', intensity: 'Z4', description: '热身 2km → 节奏跑 4km @ 5:00/km → 冷身 2km' },
        { dayOfWeek: 5, type: 'easy', plannedDistance: 4, plannedDuration: 24, plannedPace: '5:50/km', intensity: 'Z2', description: '恢复跑 4km' },
        { dayOfWeek: 6, type: 'long', plannedDistance: 10, plannedDuration: 60, plannedPace: '5:30/km', intensity: 'Z2', description: '长跑 10km' },
        { dayOfWeek: 0, type: 'rest', plannedDistance: null, plannedDuration: null, plannedPace: null, intensity: 'rest', description: '休息或交叉训练' },
      ],
    },
  },
  {
    id: '10k-sub40',
    name: '10K Sub 40 计划（进阶）',
    targetRace: '10K',
    targetTime: '0:40:00',
    level: 'advanced',
    durationWeeks: 10,
    weeklyMileage: 50,
    description: '适合目标 10K 跑进 40 分钟的进阶跑者，高强度间歇与阈值训练为主。周跑量 45-55km。',
    phases: [
      { phase: 'base', weeks: '第1-2周', goal: '有氧基础 45km' },
      { phase: 'build', weeks: '第3-7周', goal: '高强度间歇 + 阈值跑' },
      { phase: 'taper', weeks: '第8-10周', goal: '减量备赛' },
    ],
    sampleWeek: {
      weekGoal: '强化期典型周：周跑量 50km，含 2 次质量课',
      phase: 'build',
      sessions: [
        { dayOfWeek: 1, type: 'easy', plannedDistance: 10, plannedDuration: 55, plannedPace: '5:00/km', intensity: 'Z2', description: '轻松跑 10km' },
        { dayOfWeek: 2, type: 'interval', plannedDistance: 12, plannedDuration: 65, plannedPace: '3:50/km', intensity: 'Z5', description: '热身 3km → 8×400m @ 3:50/km（间歇 200m 慢跑）→ 冷身 3km' },
        { dayOfWeek: 3, type: 'easy', plannedDistance: 8, plannedDuration: 42, plannedPace: '5:10/km', intensity: 'Z2', description: '恢复跑 8km' },
        { dayOfWeek: 4, type: 'tempo', plannedDistance: 12, plannedDuration: 62, plannedPace: '4:10/km', intensity: 'Z4', description: '热身 3km → 阈值跑 6km @ 4:10/km → 冷身 3km' },
        { dayOfWeek: 5, type: 'rest', plannedDistance: null, plannedDuration: null, plannedPace: null, intensity: 'rest', description: '休息日' },
        { dayOfWeek: 6, type: 'long', plannedDistance: 16, plannedDuration: 80, plannedPace: '4:50/km', intensity: 'Z2-Z3', description: '长跑 16km，后 4km @ 阈值配速' },
        { dayOfWeek: 0, type: 'recovery', plannedDistance: 6, plannedDuration: 32, plannedPace: '5:30/km', intensity: 'Z1', description: '恢复跑 6km' },
      ],
    },
  },
]

export const LEVEL_LABELS: Record<string, { label: string; color: string }> = {
  beginner: { label: '入门', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  intermediate: { label: '进阶', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  advanced: { label: '高级', color: 'bg-rose-100 text-rose-700 border-rose-200' },
}
