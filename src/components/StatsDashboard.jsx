import { useState, useEffect } from 'react'
import { StatsCardSkeleton } from './LoadingSkeleton'

function StatsDashboard({ stats }) {
  const [isLoading, setIsLoading] = useState(true)
  
  // Mock data as specified
  const statsData = stats || {
    dailyVolume: 7500,
    newClients: 3,
    lastHour: 250,
    totalClients: 15,
    totalEarned: 45000,
    avgClient: 500
  }

  // Simulate loading state
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [stats])

  const getDailyVolumeStyle = (amount) => {
    if (amount > 10000) {
      return 'frosted-stats-primary' // Purple for >10000
    } else if (amount > 5000) {
      return 'frosted-stats-gold' // Green/Gold for >5000
    } else {
      return 'frosted-stats-crimson' // Default for <=5000
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Card wrapper with consistent sizing
  const StatCard = ({ children, className = "", delay = 0 }) => {
    if (isLoading) {
      return <StatsCardSkeleton delay={delay} />
    }
    
    return (
      <div 
        className={`${className} p-1.5 sm:p-2 text-center rounded-lg sm:rounded-xl flex flex-col justify-between h-full min-h-[60px] sm:min-h-[70px] relative overflow-hidden animate-fade-in`}
        style={{ animationDelay: `${delay}s` }}
      >
        {children}
      </div>
    )
  }

  return (
    <div className="p-0.5 sm:p-1 h-full flex flex-col">
      
      {/* Row 1: Daily Volume, New Clients, Last 60 Min */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-1.5 mb-1 flex-shrink-0">
        {/* Daily Volume Card */}
        <StatCard className={`${getDailyVolumeStyle(statsData.dailyVolume)} border border-neon-orchid/20 xs:col-span-2 sm:col-span-1`} delay={0.05}>
          <div>
            <div className="mb-1 sm:mb-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mx-auto text-neon-orchid" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="text-[0.65rem] sm:text-xs font-medium text-pearl/80 mb-1 sm:mb-2 uppercase tracking-wide">Denní Objem</h3>
            <p className="text-2xl sm:text-3xl font-black text-gradient-primary stat-glow leading-none text-center mb-1 sm:mb-2">
              {statsData.dailyVolume > 1000 ? `${(statsData.dailyVolume/1000).toFixed(1)}k` : statsData.dailyVolume}
            </p>
          </div>
          <p className="text-[0.65rem] sm:text-xs font-medium text-pearl/60">
            {statsData.dailyVolume > 10000 ? 'Výborně!' : statsData.dailyVolume > 5000 ? 'Skvěle!' : 'Pokračuj!'}
          </p>
        </StatCard>

        {/* New Clients Card */}
        <StatCard className="frosted-stats-primary" delay={0.1}>
          <div>
            <div className="mb-2">
              <svg className="w-5 h-5 mx-auto text-neon-orchid" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xs font-medium text-pearl/80 mb-2 uppercase tracking-wide">Noví Klienti</h3>
            <p className="text-3xl font-black text-gradient-primary stat-glow leading-none text-center mb-2">
              {statsData.newClients}
            </p>
          </div>
          <p className="text-xs font-medium text-pearl/60">Dnes</p>
        </StatCard>

        {/* Last 60 Min Card */}
        <StatCard className="frosted-stats-gold" delay={0.15}>
          <div>
            <div className="mb-2">
              <svg className="w-5 h-5 mx-auto text-sunset-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xs font-medium text-pearl/80 mb-2 uppercase tracking-wide">60 Min</h3>
            <p className="text-3xl font-black text-gradient-gold stat-glow leading-none text-center mb-2">
              {statsData.lastHour > 1000 ? `${(statsData.lastHour/1000).toFixed(1)}k` : statsData.lastHour}
            </p>
          </div>
          <p className="text-xs font-medium text-pearl/60">Aktivita</p>
        </StatCard>
      </div>

      {/* Row 2: Total Clients, Bonus Remaining, Average Client */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-1.5 flex-shrink-0">
        {/* Total Clients Card */}
        <StatCard className="frosted-stats-primary" delay={0.2}>
          <div>
            <div className="mb-2">
              <svg className="w-5 h-5 mx-auto text-neon-orchid" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xs font-medium text-pearl/80 mb-2 uppercase tracking-wide">Celkoví</h3>
            <p className="text-3xl font-black text-gradient-primary stat-glow leading-none text-center mb-2">
              {statsData.totalClients}
            </p>
          </div>
          <p className="text-xs font-medium text-pearl/60">Klienti</p>
        </StatCard>

        {/* Bonus Remaining Card */}
        <StatCard className="frosted-stats-crimson" delay={0.25}>
          <div>
            <div className="mb-2">
              <svg className="w-5 h-5 mx-auto text-crimson" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            {(() => {
              const amount = statsData.dailyVolume
              const target = amount < 5000 ? 5000 : amount < 10000 ? 10000 : null
              const remaining = target ? target - amount : 0
              return (
                <>
                  <h3 className="text-xs font-medium text-pearl/80 mb-2 uppercase tracking-wide">Do bonusu</h3>
                  <p className={`text-3xl font-black ${target ? 'text-gradient-primary' : 'text-gradient-gold'} stat-glow leading-none text-center mb-2`}>
                    {target ? (remaining > 1000 ? `${(remaining/1000).toFixed(1)}k` : remaining) : '0'}
                  </p>
                </>
              )
            })()}
          </div>
          {(() => {
            const amount = statsData.dailyVolume
            const target = amount < 5000 ? 5000 : amount < 10000 ? 10000 : null
            return (
              <p className="text-xs font-medium text-pearl/60">{target ? `${formatCurrency(target)}` : 'Splněn'}</p>
            )
          })()}
        </StatCard>

        {/* Average Client Card */}
        <StatCard className="frosted-stats-gold" delay={0.3}>
          <div>
            <div className="mb-2">
              <svg className="w-5 h-5 mx-auto text-sunset-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xs font-medium text-pearl/80 mb-2 uppercase tracking-wide">Průměr</h3>
            <p className="text-3xl font-black text-gradient-gold stat-glow leading-none text-center mb-2">
              {formatCurrency(statsData.avgClient)}
            </p>
          </div>
          <p className="text-xs font-medium text-pearl/60">Na klienta</p>
        </StatCard>
      </div>
    </div>
  )
}

export default StatsDashboard