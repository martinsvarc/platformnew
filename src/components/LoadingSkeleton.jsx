// Epic loading skeletons for various components

// Shimmer animation overlay component - subtle and smooth
const ShimmerOverlay = () => (
  <div 
    className="absolute inset-0 -translate-x-full animate-[shimmer_3s_ease-in-out_infinite]"
    style={{
      background: 'linear-gradient(90deg, transparent 0%, rgba(218, 112, 214, 0.06) 30%, rgba(255, 215, 0, 0.06) 50%, rgba(218, 112, 214, 0.06) 70%, transparent 100%)',
      backgroundSize: '200% 100%'
    }}
  />
)

// Stats Card Skeleton for StatsDashboard - matches exact structure
export function StatsCardSkeleton({ delay = 0 }) {
  return (
    <div 
      className="p-2 text-center rounded-xl flex flex-col justify-between h-full min-h-[70px] relative overflow-hidden animate-fade-in"
      style={{ animationDelay: `${delay}s`, animationFillMode: 'backwards' }}
    >
      {/* Match exact structure of StatCard */}
      <div>
        {/* Icon placeholder - matches mb-2 */}
        <div className="mb-2">
          <div className="relative overflow-hidden w-5 h-5 rounded-full mx-auto bg-gradient-to-r from-charcoal/30 via-neon-orchid/10 to-charcoal/30">
            <ShimmerOverlay />
          </div>
        </div>
        
        {/* Title placeholder - matches mb-2 and exact classes */}
        <div className="mb-2">
          <div className="relative overflow-hidden h-3 w-20 mx-auto rounded bg-gradient-to-r from-charcoal/30 via-velvet-gray/20 to-charcoal/30">
            <ShimmerOverlay />
          </div>
        </div>
        
        {/* Value placeholder - matches text-3xl line-height and mb-2 */}
        <div className="mb-2">
          <div className="relative overflow-hidden h-9 w-16 mx-auto rounded-md bg-gradient-to-r from-charcoal/30 via-neon-orchid/15 to-charcoal/30">
            <ShimmerOverlay />
          </div>
        </div>
      </div>
      
      {/* Subtitle placeholder - matches text-xs */}
      <div className="relative overflow-hidden h-4 w-16 mx-auto rounded bg-gradient-to-r from-charcoal/30 via-velvet-gray/20 to-charcoal/30">
        <ShimmerOverlay />
      </div>
    </div>
  )
}

// League Player Row Skeleton
export function LeagueRowSkeleton({ delay = 0 }) {
  return (
    <div 
      className="relative overflow-hidden flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-charcoal/20 via-velvet-gray/15 to-charcoal/20 border border-neon-orchid/5 animate-fade-in"
      style={{ animationDelay: `${delay}s`, animationFillMode: 'backwards' }}
    >
      <ShimmerOverlay />
      
      <div className="flex items-center space-x-2">
        {/* Rank placeholder */}
        <div className="relative overflow-hidden w-6 h-6 rounded-full bg-gradient-to-r from-charcoal/30 via-velvet-gray/20 to-charcoal/30">
          <ShimmerOverlay />
        </div>
        
        {/* Avatar placeholder */}
        <div className="relative overflow-hidden w-8 h-8 rounded-full bg-gradient-to-r from-charcoal/30 via-neon-orchid/15 to-charcoal/30 shadow-[0_0_6px_rgba(218,112,214,0.08)]">
          <ShimmerOverlay />
        </div>
        
        {/* Name placeholder */}
        <div className="relative overflow-hidden h-4 w-24 rounded bg-gradient-to-r from-charcoal/30 via-velvet-gray/20 to-charcoal/30">
          <ShimmerOverlay />
        </div>
      </div>
      
      {/* Amount placeholder */}
      <div className="relative overflow-hidden h-4 w-20 rounded bg-gradient-to-r from-charcoal/30 via-sunset-gold/15 to-charcoal/30">
        <ShimmerOverlay />
      </div>
    </div>
  )
}

// Chart Skeleton for CumulativeChart
export function ChartSkeleton() {
  return (
    <div className="relative overflow-hidden p-4 h-full animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="relative overflow-hidden h-6 w-48 rounded bg-gradient-to-r from-charcoal/30 via-velvet-gray/20 to-charcoal/30">
          <ShimmerOverlay />
        </div>
        <div className="relative overflow-hidden h-4 w-16 rounded-full bg-gradient-to-r from-charcoal/30 via-velvet-gray/20 to-charcoal/30">
          <ShimmerOverlay />
        </div>
      </div>
      
      {/* Chart area with animated lines */}
      <div className="relative overflow-hidden h-48 rounded-xl bg-gradient-to-br from-charcoal/15 via-velvet-gray/10 to-charcoal/15 border border-neon-orchid/5 mb-3">
        <ShimmerOverlay />
        
        {/* Animated chart lines */}
        <svg className="w-full h-full opacity-10" viewBox="0 0 800 200">
          <defs>
            <linearGradient id="skeletonLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(218, 112, 214, 0.3)" />
              <stop offset="50%" stopColor="rgba(255, 215, 0, 0.3)" />
              <stop offset="100%" stopColor="rgba(218, 112, 214, 0.3)" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <line
              key={index}
              x1="80"
              y1={20 + ratio * 140}
              x2="740"
              y2={20 + ratio * 140}
              stroke="rgba(255,255,255,0.03)"
              strokeWidth="1"
            />
          ))}
          
          {/* Skeleton line */}
          <path
            d="M 80,140 L 200,100 L 320,80 L 440,120 L 560,90 L 680,70 L 740,50"
            fill="none"
            stroke="url(#skeletonLineGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            className="animate-pulse"
          />
          
          {/* Skeleton points */}
          {[80, 200, 320, 440, 560, 680, 740].map((x, index) => {
            const y = [140, 100, 80, 120, 90, 70, 50][index]
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill="rgba(218, 112, 214, 0.2)"
                className="animate-pulse"
                style={{ animationDelay: `${index * 0.1}s` }}
              />
            )
          })}
        </svg>
      </div>
      
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-2">
        {[0, 1, 2, 3].map((index) => (
          <div 
            key={index}
            className="relative overflow-hidden bg-gradient-to-r from-charcoal/20 via-velvet-gray/15 to-charcoal/20 rounded p-2 border border-neon-orchid/5 animate-fade-in"
            style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'backwards' }}
          >
            <ShimmerOverlay />
            <div className="relative overflow-hidden h-3 w-12 rounded bg-gradient-to-r from-charcoal/30 via-velvet-gray/20 to-charcoal/30 mb-1">
              <ShimmerOverlay />
            </div>
            <div className="relative overflow-hidden h-4 w-16 rounded bg-gradient-to-r from-charcoal/30 via-sunset-gold/15 to-charcoal/30">
              <ShimmerOverlay />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default {
  StatsCardSkeleton,
  LeagueRowSkeleton,
  ChartSkeleton
}
