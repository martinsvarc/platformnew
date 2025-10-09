import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import AIAssistantBar from '../components/AIAssistantBar'
import { 
  getClientAnalytics, 
  getClientLifespan, 
  getClientValueDistribution,
  getSequentialPaymentAverages,
  getDayOfWeekHeatmap,
  getChatterAnalytics,
  getClientDayRetention,
  getPaymentSequenceRetention
} from '../api/analytics'

function Analytics() {
  const { user } = useAuth()
  const teamId = user?.team_id

  // View state
  const [activeView, setActiveView] = useState('clients') // 'clients' or 'chatters'
  const [retentionView, setRetentionView] = useState('days') // 'days' or 'payments'

  // Date filter state
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  // Data state
  const [loading, setLoading] = useState(true)
  const [clientAnalytics, setClientAnalytics] = useState(null)
  const [clientLifespan, setClientLifespan] = useState(0)
  const [clientValueDistribution, setClientValueDistribution] = useState([])
  const [sequentialPayments, setSequentialPayments] = useState([])
  const [dayOfWeekHeatmap, setDayOfWeekHeatmap] = useState([])
  const [chatterAnalytics, setChatterAnalytics] = useState([])
  const [clientDayRetention, setClientDayRetention] = useState([])
  const [paymentSequenceRetention, setPaymentSequenceRetention] = useState([])

  // Format currency
  const formatCurrency = (amount) => new Intl.NumberFormat('cs-CZ', { 
    style: 'currency', 
    currency: 'CZK', 
    maximumFractionDigits: 0 
  }).format(amount)

  // Format number
  const formatNumber = (num, decimals = 2) => {
    return new Intl.NumberFormat('cs-CZ', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num)
  }

  // Load data based on active view
  const loadData = async () => {
    if (!teamId) return
    
    setLoading(true)
    try {
      const filters = {
        from: from || null,
        to: to || null
      }

      if (activeView === 'clients') {
        // Load client & payment data
        const [analytics, lifespan, distribution, sequential, heatmap, dayRetention, sequenceRetention] = await Promise.all([
          getClientAnalytics(teamId, filters),
          getClientLifespan(teamId, filters),
          getClientValueDistribution(teamId, filters),
          getSequentialPaymentAverages(teamId, filters),
          getDayOfWeekHeatmap(teamId, filters),
          getClientDayRetention(teamId, filters),
          getPaymentSequenceRetention(teamId, filters)
        ])

        setClientAnalytics(analytics)
        setClientLifespan(lifespan)
        setClientValueDistribution(distribution)
        setSequentialPayments(sequential)
        setDayOfWeekHeatmap(heatmap)
        setClientDayRetention(dayRetention)
        setPaymentSequenceRetention(sequenceRetention)
      } else {
        // Load chatter data
        const chatters = await getChatterAnalytics(teamId, filters)
        setChatterAnalytics(chatters)
      }
    } catch (err) {
      console.error('Failed to load analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [teamId, activeView])

  // Quick pick handlers
  const handleQuickPick = (type) => {
    const today = new Date()
    const formatDate = (date) => date.toISOString().split('T')[0]

    switch (type) {
      case 'all':
        setFrom('')
        setTo('')
        break
      case 'last30':
        const last30 = new Date(today)
        last30.setDate(today.getDate() - 30)
        setFrom(formatDate(last30))
        setTo(formatDate(today))
        break
      case 'last7':
        const last7 = new Date(today)
        last7.setDate(today.getDate() - 7)
        setFrom(formatDate(last7))
        setTo(formatDate(today))
        break
      case 'thisMonth':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        setFrom(formatDate(monthStart))
        setTo(formatDate(today))
        break
      case 'lastMonth':
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
        setFrom(formatDate(lastMonthStart))
        setTo(formatDate(lastMonthEnd))
        break
      default:
        break
    }
  }

  // Apply filter
  const handleApplyFilter = () => {
    loadData()
  }

  // Calculate max value for heatmap normalization
  const maxHeatmapValue = useMemo(() => {
    if (!dayOfWeekHeatmap.length) return 0
    return Math.max(...dayOfWeekHeatmap.map(d => d.totalAmount))
  }, [dayOfWeekHeatmap])

  // Get color intensity for heatmap
  const getHeatmapColor = (value) => {
    if (maxHeatmapValue === 0) return 'rgba(157, 0, 255, 0.1)'
    const intensity = value / maxHeatmapValue
    return `rgba(157, 0, 255, ${0.1 + intensity * 0.9})`
  }

  // Calculate max values for bar charts
  const maxClientValue = useMemo(() => {
    if (!clientValueDistribution.length) return 0
    return Math.max(...clientValueDistribution.map(c => c.totalAmount))
  }, [clientValueDistribution])

  const maxSequentialValue = useMemo(() => {
    if (!sequentialPayments.length) return 0
    return Math.max(...sequentialPayments.map(s => s.avgAmount))
  }, [sequentialPayments])

  if (loading) {
    return (
      <div className="min-h-screen p-3 sm:p-4 md:p-6 lg:ml-64 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-neon-orchid mb-4"></div>
          <p className="text-pearl/70">Načítání analytiky...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6 lg:ml-64">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gradient-primary mb-1">
            Analytika
          </h1>
          <p className="text-pearl/70 text-xs sm:text-sm">
            Pokročilá analýza výkonu a statistiky
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setActiveView('clients')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeView === 'clients'
                ? 'bg-gradient-to-r from-neon-orchid to-crimson text-white shadow-glow-purple'
                : 'bg-velvet-gray/40 text-pearl/70 hover:text-pearl'
            }`}
          >
            Klienti & Platby
          </button>
          <button
            onClick={() => setActiveView('chatters')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeView === 'chatters'
                ? 'bg-gradient-to-r from-neon-orchid to-crimson text-white shadow-glow-purple'
                : 'bg-velvet-gray/40 text-pearl/70 hover:text-pearl'
            }`}
          >
            Chatters
          </button>
        </div>

        {/* Date Range Filter */}
        <div className="unified-glass p-3 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Quick picks */}
            <button
              onClick={() => handleQuickPick('all')}
              className="px-3 py-1.5 text-sm rounded-lg bg-velvet-gray/40 text-pearl hover:bg-velvet-gray/60 transition-all"
            >
              Vše
            </button>
            <button
              onClick={() => handleQuickPick('last7')}
              className="px-3 py-1.5 text-sm rounded-lg bg-velvet-gray/40 text-pearl hover:bg-velvet-gray/60 transition-all"
            >
              7 dní
            </button>
            <button
              onClick={() => handleQuickPick('last30')}
              className="px-3 py-1.5 text-sm rounded-lg bg-velvet-gray/40 text-pearl hover:bg-velvet-gray/60 transition-all"
            >
              30 dní
            </button>
            <button
              onClick={() => handleQuickPick('thisMonth')}
              className="px-3 py-1.5 text-sm rounded-lg bg-velvet-gray/40 text-pearl hover:bg-velvet-gray/60 transition-all"
            >
              Tento měsíc
            </button>
            <button
              onClick={() => handleQuickPick('lastMonth')}
              className="px-3 py-1.5 text-sm rounded-lg bg-velvet-gray/40 text-pearl hover:bg-velvet-gray/60 transition-all"
            >
              Minulý měsíc
            </button>

            {/* Divider */}
            <div className="hidden sm:block w-px h-8 bg-velvet-gray/40"></div>

            {/* Custom date range */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="Od"
                className="bg-obsidian border border-velvet-gray rounded-lg px-3 py-1.5 text-sm text-pearl focus:border-neon-orchid focus:shadow-glow-purple outline-none"
              />
              <span className="text-pearl/50">—</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Do"
                className="bg-obsidian border border-velvet-gray rounded-lg px-3 py-1.5 text-sm text-pearl focus:border-neon-orchid focus:shadow-glow-purple outline-none"
              />
            </div>

            <button
              onClick={handleApplyFilter}
              className="px-4 py-1.5 text-sm rounded-lg bg-gradient-to-r from-neon-orchid to-crimson text-white shadow-glow-purple hover:shadow-glow transition-all"
            >
              Filtrovat
            </button>
          </div>
        </div>

        {/* Content based on active view */}
        {activeView === 'clients' ? (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Average Client Value */}
              <div className="unified-glass p-4">
                <h3 className="text-sm text-pearl/70 mb-2">Průměrná hodnota klienta</h3>
                <p className="text-2xl font-bold text-gradient-gold">
                  {formatCurrency(clientAnalytics?.avgClientValue || 0)}
                </p>
                <p className="text-xs text-pearl/50 mt-1">
                  z {clientAnalytics?.totalClients || 0} klientů
                </p>
              </div>

              {/* Average Transactions */}
              <div className="unified-glass p-4">
                <h3 className="text-sm text-pearl/70 mb-2">Průměr transakcí na klienta</h3>
                <p className="text-2xl font-bold text-gradient-primary">
                  {formatNumber(clientAnalytics?.avgTransactionsPerClient || 0, 1)}
                </p>
              </div>

              {/* New Clients */}
              <div className="unified-glass p-4">
                <h3 className="text-sm text-pearl/70 mb-2">Noví klienti</h3>
                <p className="text-2xl font-bold text-gradient-gold">
                  {clientAnalytics?.newClientsCount || 0}
                </p>
              </div>

              {/* Average Lifespan */}
              <div className="unified-glass p-4">
                <h3 className="text-sm text-pearl/70 mb-2">Průměrná doba na modelu</h3>
                <p className="text-2xl font-bold text-gradient-primary">
                  {formatNumber(clientLifespan, 1)} dní
                </p>
                <p className="text-xs text-pearl/50 mt-1">první až poslední platba</p>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Client Values Bar Chart */}
              <div className="unified-glass p-4">
                <h2 className="text-lg font-bold text-gradient-gold mb-4">
                  Top klienti podle hodnoty
                </h2>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {clientValueDistribution.slice(0, 20).map((client) => (
                    <div key={client.clientId} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-pearl truncate">
                            {client.clientName}
                          </span>
                          <span className="text-sm font-semibold text-pearl ml-2 whitespace-nowrap">
                            {formatCurrency(client.totalAmount)}
                          </span>
                        </div>
                        <div className="w-full bg-velvet-gray/40 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-neon-orchid to-crimson h-2 rounded-full transition-all"
                            style={{
                              width: `${maxClientValue > 0 ? (client.totalAmount / maxClientValue) * 100 : 0}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {clientValueDistribution.length === 0 && (
                    <p className="text-center text-pearl/50 py-8">
                      Žádná data k zobrazení
                    </p>
                  )}
                </div>
              </div>

              {/* Sequential Payments Bar Chart */}
              <div className="unified-glass p-4">
                <h2 className="text-lg font-bold text-gradient-gold mb-4">
                  Průměrná hodnota 1., 2., 3... platby
                </h2>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {sequentialPayments.map((payment) => (
                    <div key={payment.sequence} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-pearl">
                            {payment.sequence}. platba
                          </span>
                          <span className="text-sm font-semibold text-pearl ml-2 whitespace-nowrap">
                            {formatCurrency(payment.avgAmount)}
                          </span>
                        </div>
                        <div className="w-full bg-velvet-gray/40 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-sunset-gold to-amber-500 h-2 rounded-full transition-all"
                            style={{
                              width: `${maxSequentialValue > 0 ? (payment.avgAmount / maxSequentialValue) * 100 : 0}%`
                            }}
                          />
                        </div>
                        <span className="text-xs text-pearl/50 mt-0.5">
                          {payment.count} plateb
                        </span>
                      </div>
                    </div>
                  ))}
                  {sequentialPayments.length === 0 && (
                    <p className="text-center text-pearl/50 py-8">
                      Žádná data k zobrazení
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Day of Week Heatmap */}
            <div className="unified-glass p-4">
              <h2 className="text-lg font-bold text-gradient-gold mb-4">
                Heatmapa dní v týdnu
              </h2>
              <p className="text-sm text-pearl/70 mb-4">
                Nejsvětlejší barva = nejvíce vybraných peněz
              </p>
              <div className="grid grid-cols-7 gap-2 sm:gap-4">
                {dayOfWeekHeatmap.map((day) => (
                  <div
                    key={day.dayOfWeek}
                    className="aspect-square rounded-lg flex flex-col items-center justify-center p-2 sm:p-4 transition-all hover:scale-105"
                    style={{
                      backgroundColor: getHeatmapColor(day.totalAmount)
                    }}
                  >
                    <div className="text-xs sm:text-sm font-semibold text-pearl mb-1 text-center">
                      {day.dayNameCzech}
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-white">
                      {formatCurrency(day.totalAmount)}
                    </div>
                    <div className="text-xs text-pearl/70 mt-1">
                      {day.count} plateb
                    </div>
                  </div>
                ))}
              </div>
              {dayOfWeekHeatmap.length === 0 && (
                <p className="text-center text-pearl/50 py-8">
                  Žádná data k zobrazení
                </p>
              )}
            </div>

            {/* Client Retention Chart */}
            <div className="unified-glass p-4 mt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gradient-gold">
                    Retence klientů
                  </h2>
                  <p className="text-sm text-pearl/70 mt-1">
                    {retentionView === 'days' 
                      ? 'Kolik klientů posílá napříč více dny' 
                      : 'Kolik klientů se dostane k další platbě'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRetentionView('days')}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      retentionView === 'days'
                        ? 'bg-gradient-to-r from-neon-orchid to-crimson text-white shadow-glow-purple'
                        : 'bg-velvet-gray/40 text-pearl/70 hover:text-pearl'
                    }`}
                  >
                    Aktivní dny
                  </button>
                  <button
                    onClick={() => setRetentionView('payments')}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      retentionView === 'payments'
                        ? 'bg-gradient-to-r from-neon-orchid to-crimson text-white shadow-glow-purple'
                        : 'bg-velvet-gray/40 text-pearl/70 hover:text-pearl'
                    }`}
                  >
                    Sekvence plateb
                  </button>
                </div>
              </div>

              {retentionView === 'days' ? (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {clientDayRetention.map((item) => (
                    <div key={item.daysActive} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-pearl">
                            {item.daysActive} {item.daysActive === 1 ? 'den' : item.daysActive <= 4 ? 'dny' : 'dní'}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-pearl/70">
                              {item.clientCount} klientů
                            </span>
                            <span className="text-sm font-semibold text-pearl ml-2 whitespace-nowrap">
                              {formatNumber(item.percentage, 1)}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-velvet-gray/40 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all"
                            style={{
                              width: `${item.percentage}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {clientDayRetention.length === 0 && (
                    <p className="text-center text-pearl/50 py-8">
                      Žádná data k zobrazení
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {paymentSequenceRetention.map((item) => (
                    <div key={item.sequence} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-pearl">
                            {item.sequence}. platba
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-pearl/70">
                              {item.clientsReached} klientů
                            </span>
                            <span className="text-sm font-bold text-gradient-primary ml-2 whitespace-nowrap">
                              ({formatNumber(item.percentage, 1)}%)
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-velvet-gray/40 rounded-full h-2 relative">
                          <div
                            className="bg-gradient-to-r from-violet-500 to-purple-500 h-2 rounded-full transition-all"
                            style={{
                              width: `${item.percentage}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {paymentSequenceRetention.length === 0 && (
                    <p className="text-center text-pearl/50 py-8">
                      Žádná data k zobrazení
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Chatters View */}
            <div className="unified-glass p-4">
              <h2 className="text-lg font-bold text-gradient-gold mb-4">
                Výkon chatterů
              </h2>
              <div className="overflow-x-auto rounded-xl">
                <table className="w-full text-left text-sm text-pearl">
                  <thead className="text-pearl/80 border-b border-velvet-gray">
                    <tr>
                      <th className="p-3">Chatter</th>
                      <th className="p-3 text-right">Celkový příjem</th>
                      <th className="p-3 text-right">Unikátní klienti</th>
                      <th className="p-3 text-right">Transakce</th>
                      <th className="p-3 text-right">Průměrná transakce</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chatterAnalytics.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-3 text-center text-pearl/60">
                          Žádná data k zobrazení
                        </td>
                      </tr>
                    ) : (
                      chatterAnalytics.map((chatter) => (
                        <tr
                          key={chatter.id}
                          className="border-b border-velvet-gray/60 hover:bg-velvet-gray/40"
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              {chatter.avatarUrl ? (
                                <img
                                  src={chatter.avatarUrl}
                                  alt={chatter.displayName}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-orchid/30 to-crimson/30 flex items-center justify-center">
                                  <span className="text-lg">👤</span>
                                </div>
                              )}
                              <div>
                                <div className="font-semibold">{chatter.displayName}</div>
                                <div className="text-xs text-pearl/60">@{chatter.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-right font-semibold">
                            {formatCurrency(chatter.totalRevenue)}
                          </td>
                          <td className="p-3 text-right">{chatter.uniqueClients}</td>
                          <td className="p-3 text-right">{chatter.totalTransactions}</td>
                          <td className="p-3 text-right">
                            {formatCurrency(chatter.avgTransactionValue)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* AI Assistant Bar */}
      <AIAssistantBar />
    </div>
  )
}

export default Analytics

