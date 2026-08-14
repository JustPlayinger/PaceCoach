'use client'

interface ProgressRingProps {
  /** 0-100 */
  value: number
  size?: number
  strokeWidth?: number
  color?: string
  trackColor?: string
  label?: string
  sublabel?: string
  children?: React.ReactNode
}

export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 10,
  color = '#10b981',
  trackColor = '#e2e8f0',
  label,
  sublabel,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clampedValue = Math.max(0, Math.min(100, value))
  const offset = circumference - (clampedValue / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children || (
          <>
            <span className="text-xl font-bold text-slate-900 leading-none">{Math.round(clampedValue)}<span className="text-xs text-slate-400">%</span></span>
            {label && <span className="text-[10px] text-slate-500 mt-0.5">{label}</span>}
            {sublabel && <span className="text-[9px] text-slate-400">{sublabel}</span>}
          </>
        )}
      </div>
    </div>
  )
}
