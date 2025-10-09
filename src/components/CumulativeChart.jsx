import { useMemo, useState, useEffect } from 'react'
import { ChartSkeleton } from './LoadingSkeleton'

function CumulativeChart({ data = [] }) {
  const [isLoading, setIsLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  
  // Only show loading skeleton on initial load, not on data refreshes
  useEffect(() => {
    if (initialLoad) {
      setIsLoading(true)
      const timer = setTimeout(() => {
        setIsLoading(false)
        setInitialLoad(false)
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [initialLoad])
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null

    const maxCumulative = Math.max(...data.map(d => d.cumulative), 1)
    
    const width = 800
    const height = 200
    const padding = { top: 20, right: 60, bottom: 40, left: 80 }

    // Generate SVG path for the cumulative line
    const points = data.map((point, index) => {
      const x = padding.left + (index / Math.max(data.length - 1, 1)) * (width - padding.left - padding.right)
      const y = padding.top + ((maxCumulative - point.cumulative) / maxCumulative) * (height - padding.top - padding.bottom)
      return `${x},${y}`
    })

    const pathData = points.length > 0 ? `M ${points[0]} L ${points.slice(1).join(' L ')}` : ''

    return {
      width,
      height,
      padding,
      maxCumulative,
      pathData,
      points: data.map((point, index) => ({
        ...point,
        x: padding.left + (index / Math.max(data.length - 1, 1)) * (width - padding.left - padding.right),
        y: padding.top + ((maxCumulative - point.cumulative) / maxCumulative) * (height - padding.top - padding.bottom)
      }))
    }
  }, [data])

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('cs-CZ', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (isLoading) {
    return <ChartSkeleton />
  }

  if (!chartData || data.length === 0) {
    return (
      <div className="p-4 h-full">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">
            Denní Kumulativní Graf
          </h3>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-white/30"></div>
            <span className="text-xs text-white/60 font-medium">Žádná data</span>
          </div>
        </div>
        <div className="flex items-center justify-center h-40 text-white/60">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm font-medium text-white">Žádné platby dnes</p>
            <p className="text-xs text-white/50 mt-1">Graf se zobrazí po první platbě</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 h-full overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">
          Denní Kumulativní Graf
        </h3>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
          <span className="text-xs text-white/60 font-medium">Příjem</span>
        </div>
      </div>
      
      <div className="relative overflow-x-auto">
        <svg
          width={chartData.width}
          height={chartData.height}
          className="w-full h-auto"
          viewBox={`0 0 ${chartData.width} ${chartData.height}`}
        >
          <defs>
            {/* Modern gradient for area */}
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.15)" />
              <stop offset="50%" stopColor="rgba(147, 51, 234, 0.1)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0.05)" />
            </linearGradient>
            
            {/* Modern gradient for line */}
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
            
            {/* Glow effect */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Background area under the line */}
          {chartData.points.length > 0 && (
            <path
              d={`M ${chartData.padding.left},${chartData.height - chartData.padding.bottom} L ${chartData.pathData.split('L')[0].replace('M ', '')} L ${chartData.pathData.split('L').slice(1).join('L')} L ${chartData.width - chartData.padding.right},${chartData.height - chartData.padding.bottom} Z`}
              fill="url(#areaGradient)"
            />
          )}

          {/* Modern grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const y = chartData.padding.top + (ratio * (chartData.height - chartData.padding.top - chartData.padding.bottom))
            const value = Math.round(chartData.maxCumulative * (1 - ratio))
            return (
              <g key={`h-${index}`}>
                      <line
                        x1={chartData.padding.left}
                        y1={y}
                        x2={chartData.width - chartData.padding.right}
                        y2={y}
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="0.5"
                      />
                <text
                  x={chartData.padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] fill-white/40 font-light"
                >
                  {value > 1000 ? `${(value/1000).toFixed(1)}k` : value}
                </text>
              </g>
            )
          })}

          {/* Main line with glow effect */}
          <path
            d={chartData.pathData}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
          />

          {/* Data points */}
          {chartData.points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill="white"
                stroke="url(#lineGradient)"
                strokeWidth="2"
                className="hover:r-6 transition-all cursor-pointer drop-shadow-sm"
              />
              {/* Tooltip */}
              <title>
                {formatTime(point.time)} - +{formatCurrency(point.amount)} 
                {'\n'}Celkem: {formatCurrency(point.cumulative)}
              </title>
            </g>
          ))}

          {/* X-axis line - subtle */}
          <line
            x1={chartData.padding.left}
            y1={chartData.height - chartData.padding.bottom}
            x2={chartData.width - chartData.padding.right}
            y2={chartData.height - chartData.padding.bottom}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />

          {/* Time labels on X-axis - more visible */}
          {chartData.points.map((point, index) => {
            const shouldShow = chartData.points.length <= 12 || index % Math.ceil(chartData.points.length / 10) === 0 || index === chartData.points.length - 1
            if (!shouldShow) return null
            
            return (
              <g key={`time-${index}`}>
                {/* Tick mark - subtle */}
                <line
                  x1={point.x}
                  y1={chartData.height - chartData.padding.bottom}
                  x2={point.x}
                  y2={chartData.height - chartData.padding.bottom + 6}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="1"
                />
                {/* Time label - subtle */}
                <text
                  x={point.x}
                  y={chartData.height - chartData.padding.bottom + 16}
                  textAnchor="middle"
                  className="text-[10px] fill-white/50 font-light"
                >
                  {formatTime(point.time)}
                </text>
              </g>
            )
          })}

          {/* Y-axis line - subtle */}
          <line
            x1={chartData.padding.left}
            y1={chartData.padding.top}
            x2={chartData.padding.left}
            y2={chartData.height - chartData.padding.bottom}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />

          {/* Y-axis label */}
          <text
            x={chartData.padding.left / 2}
            y={chartData.height / 2}
            textAnchor="middle"
            className="text-[10px] fill-white/40 font-light"
            transform={`rotate(-90, ${chartData.padding.left / 2}, ${chartData.height / 2})`}
          >
            Kč
          </text>

          {/* X-axis label - removed to save space */}
        </svg>
      </div>

      {/* Compact Summary */}
      <div className="mt-3 grid grid-cols-4 gap-2">
        <div className="bg-white/5 rounded p-2 border border-white/10">
          <p className="text-white/60 text-xs mb-0.5">Platby</p>
          <p className="text-white text-sm font-bold">{chartData.points.length}</p>
        </div>
        <div className="bg-white/5 rounded p-2 border border-white/10">
          <p className="text-white/60 text-xs mb-0.5">Celkem</p>
          <p className="text-white text-sm font-bold">{formatCurrency(chartData.maxCumulative)}</p>
        </div>
        <div className="bg-white/5 rounded p-2 border border-white/10">
          <p className="text-white/60 text-xs mb-0.5">Průměr</p>
          <p className="text-white text-sm font-bold">
            {formatCurrency(chartData.points.length > 0 ? chartData.maxCumulative / chartData.points.length : 0)}
          </p>
        </div>
        <div className="bg-white/5 rounded p-2 border border-white/10">
          <p className="text-white/60 text-xs mb-0.5">Nejvyšší</p>
          <p className="text-white text-sm font-bold">
            {formatCurrency(Math.max(...chartData.points.map(p => p.amount)))}
          </p>
        </div>
      </div>
    </div>
  )
}

export default CumulativeChart
