function StatsDashboard({ stats }) {
  // Mock data as specified
  const statsData = stats || {
    dailyVolume: 7500,
    newClients: 3,
    lastHour: 250,
    totalClients: 15,
    totalEarned: 45000,
    avgClient: 500
  }

  const getDailyVolumeStyle = (amount) => {
    if (amount > 10000) {
      return 'stats-card-primary' // Purple for >10000
    } else if (amount > 5000) {
      return 'stats-card-gold' // Green/Gold for >5000
    } else {
      return 'stats-card-crimson' // Default for <=5000
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

  return (
    <div className="bg-gradient-to-br from-charcoal to-velvet-gray rounded-xl shadow-xl border border-neon-orchid/20 p-3 h-full">
      
      {/* Row 1: Daily Volume, New Clients, Last 60 Min */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        {/* Daily Volume Card */}
        <div className={`${getDailyVolumeStyle(statsData.dailyVolume)} p-4 text-center rounded-lg`}>
          <div className="mb-1">
            <svg className="w-6 h-6 mx-auto text-neon-orchid mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-pearl mb-1">Denní Objem</h3>
          <p className="text-2xl font-bold text-gradient-primary stat-glow">
            {formatCurrency(statsData.dailyVolume)}
          </p>
          <p className="text-xs text-pearl/70 mt-1">
            {statsData.dailyVolume > 10000 ? 'Výborně!' : statsData.dailyVolume > 5000 ? 'Skvěle!' : 'Pokračuj!'}
          </p>
        </div>

        {/* New Clients Card */}
        <div className="stats-card-primary p-4 text-center rounded-lg">
          <div className="mb-1">
            <svg className="w-6 h-6 mx-auto text-neon-orchid mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-pearl mb-1">Noví Klienti</h3>
          <p className="text-2xl font-bold text-gradient-primary stat-glow">
            {statsData.newClients}
          </p>
          <p className="text-xs text-pearl/70 mt-1">Dnes</p>
          <p className="text-xs text-pearl/70 mt-1">Hodnota: {formatCurrency(statsData.avgClient)}</p>
        </div>

        {/* Last 60 Min Card */}
        <div className="stats-card-gold p-4 text-center rounded-lg">
          <div className="mb-1">
            <svg className="w-6 h-6 mx-auto text-sunset-gold mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-pearl mb-1">Posledních 60 Min</h3>
          <p className="text-2xl font-bold text-gradient-gold stat-glow">
            {formatCurrency(statsData.lastHour)}
          </p>
          <p className="text-xs text-pearl/70 mt-1">Nedávná aktivita</p>
        </div>
      </div>

      {/* Row 2: Total Clients, Bonus Remaining, Average Client */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Total Clients Card */}
        <div className="stats-card-primary p-4 text-center rounded-lg">
          <div className="mb-1">
            <svg className="w-6 h-6 mx-auto text-neon-orchid mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-pearl mb-1">Celkoví Klienti</h3>
          <p className="text-2xl font-bold text-gradient-primary stat-glow">
            {statsData.totalClients}
          </p>
          <p className="text-xs text-pearl/70 mt-1">Celkem</p>
        </div>

        {/* Bonus Remaining Card */}
        <div className="stats-card-crimson p-4 text-center rounded-lg">
          <div className="mb-1">
            <svg className="w-6 h-6 mx-auto text-crimson mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          {(() => {
            const amount = statsData.dailyVolume
            const target = amount < 5000 ? 5000 : amount < 10000 ? 10000 : null
            const remaining = target ? target - amount : 0
            const subtitle = target ? `k bonusu ${formatCurrency(target)}` : 'Bonus splněn'
            return (
              <>
                <h3 className="text-sm font-semibold text-pearl mb-1">Do bonusu zbývá</h3>
                <p className={`text-2xl font-bold ${target ? 'text-gradient-primary' : 'text-gradient-gold'} stat-glow`}>
                  {target ? formatCurrency(remaining) : '0 Kč'}
                </p>
                <p className="text-xs text-pearl/70 mt-1">{subtitle}</p>
              </>
            )
          })()}
        </div>

        {/* Average Client Card */}
        <div className="stats-card-gold p-4 text-center rounded-lg">
          <div className="mb-1">
            <svg className="w-6 h-6 mx-auto text-sunset-gold mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-pearl mb-1">Průměrný Klient</h3>
          <p className="text-2xl font-bold text-gradient-gold stat-glow">
            {formatCurrency(statsData.avgClient)}
          </p>
          <p className="text-xs text-pearl/70 mt-1">Na klienta</p>
        </div>
      </div>
    </div>
  )
}

export default StatsDashboard
