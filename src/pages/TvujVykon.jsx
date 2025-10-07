import League from '../components/League'
import StatsDashboard from '../components/StatsDashboard'
import CumulativeChart from '../components/CumulativeChart'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { getUserTotals, getTeamUsers, getPaymentsCount, getDailyPaymentTimeline, getClientStats } from '../api/queries'
import { sql } from '../api/db'
import { TEAM_ID, USER_ID } from '../api/config'

function TvujVykon() {
  const [teamUsers, setTeamUsers] = useState([])
  const [selectedChatter, setSelectedChatter] = useState('all')
  const [stats, setStats] = useState({ dailyVolume: 0, newClients: 0, lastHour: 0, totalClients: 0, totalEarned: 0, avgClient: 0 })
  const [timelineData, setTimelineData] = useState([])
  const [refreshKey, setRefreshKey] = useState(0) // Force refresh when day changes

  // Calculate next midnight in Prague time (UTC+1 or UTC+2 depending on DST)
  const getNextMidnightPrague = useCallback(() => {
    const now = new Date()
    
    // Create a date for today at midnight in Prague timezone
    // Prague is UTC+1 (CET) in winter and UTC+2 (CEST) in summer
    const todayInPrague = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Prague"}))
    const midnightInPrague = new Date(todayInPrague)
    midnightInPrague.setHours(24, 0, 0, 0) // Next midnight
    
    // Convert back to local time for setTimeout
    const localMidnight = new Date(midnightInPrague.toLocaleString("en-US", {timeZone: "Europe/Prague"}))
    
    return localMidnight.getTime() - now.getTime()
  }, [])

  // Force refresh all data when day changes
  const forceRefresh = useCallback(() => {
    console.log('Midnight refresh triggered - new day started in Prague')
    setRefreshKey(prev => prev + 1)
  }, [])

  // Set up midnight refresh timer
  useEffect(() => {
    const timeToMidnight = getNextMidnightPrague()
    console.log(`Setting midnight refresh timer for ${Math.round(timeToMidnight / 1000 / 60)} minutes`)
    
    const timeoutId = setTimeout(() => {
      forceRefresh()
      // Set up the next day's refresh
      const nextDayTimeout = setInterval(forceRefresh, 24 * 60 * 60 * 1000) // 24 hours
      return () => clearInterval(nextDayTimeout)
    }, timeToMidnight)

    return () => clearTimeout(timeoutId)
  }, [getNextMidnightPrague, forceRefresh])

  // Create chatters list with "Všichni" option and team users
  const chatters = useMemo(() => {
    const allOption = { id: 'all', name: 'Všichni', display_name: 'Všichni' }
    return [allOption, ...teamUsers]
  }, [teamUsers])

  // Load team users and debug payments
  useEffect(() => {
    let mounted = true
    const loadUsers = async () => {
      if (!TEAM_ID) return
      try {
        const users = await getTeamUsers(TEAM_ID)
        if (!mounted) return
        setTeamUsers(users)
        
        // Debug: Check if there are any payments in the database
        const paymentsInfo = await getPaymentsCount(TEAM_ID)
        console.log('Payments in database:', paymentsInfo)
        
        // Also check recent payments
        const recentPayments = await sql`
          select id, amount, fee_amount, (amount - fee_amount) as net_amount, paid_at, paid_at::date as paid_date, user_id
          from payments
          where team_id = ${TEAM_ID}
          order by paid_at desc
          limit 5
        `
        console.log('Recent payments:', recentPayments)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Načtení uživatelů selhalo', e)
      }
    }
    loadUsers()
    return () => { mounted = false }
  }, [])

  // Load stats based on selected chatter and refresh key
  useEffect(() => {
    let mounted = true
    const loadStats = async () => {
      if (!TEAM_ID) {
        console.log('No TEAM_ID available')
        return
      }
      try {
        const userId = selectedChatter === 'all' ? null : selectedChatter
        console.log('Loading stats for:', { TEAM_ID, userId, selectedChatter, refreshKey })
        
        // Load both financial totals and client statistics
        const [totals, clientStats] = await Promise.all([
          getUserTotals(TEAM_ID, userId),
          getClientStats(TEAM_ID, userId)
        ])
        
        if (!mounted) return
        console.log('Stats loaded:', { totals, clientStats })
        
        const total = totals?.total || 0
        const today = totals?.today || 0
        const lastHour = totals?.last_hour || 0
        
        // Use real client statistics
        setStats({ 
          dailyVolume: today, 
          newClients: clientStats.newClients, 
          lastHour: lastHour, 
          totalClients: clientStats.totalClients, 
          totalEarned: total, 
          avgClient: clientStats.avgClient 
        })
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Načtení výkonu selhalo', e)
      }
    }
    loadStats()
    const id = setInterval(loadStats, 15000)
    return () => { mounted = false; clearInterval(id) }
  }, [selectedChatter, refreshKey])

  // Load timeline data based on selected chatter and refresh key
  useEffect(() => {
    let mounted = true
    const loadTimeline = async () => {
      if (!TEAM_ID) return
      try {
        const userId = selectedChatter === 'all' ? null : selectedChatter
        console.log('Loading timeline for:', { TEAM_ID, userId, selectedChatter, refreshKey })
        const timeline = await getDailyPaymentTimeline(TEAM_ID, userId)
        if (!mounted) return
        setTimelineData(timeline)
      } catch (e) {
        console.error('Načtení timeline dat selhalo', e)
      }
    }
    loadTimeline()
    const id = setInterval(loadTimeline, 15000)
    return () => { mounted = false; clearInterval(id) }
  }, [selectedChatter, refreshKey])

  return (
    <div className="min-h-screen overflow-y-auto p-3 sm:p-4 md:p-6 lg:ml-64">
      <div className="min-h-full flex flex-col">
        {/* Header - centered */}
        <div className="relative mb-4">
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gradient-primary mb-1">
              Liga
            </h1>
            <p className="text-pearl/70 text-xs sm:text-sm">
              Top výkony a trendy
            </p>
          </div>
          
          {/* Filter - responsive positioning */}
          <div className="mt-3 sm:mt-0 sm:absolute sm:top-0 sm:right-0 flex flex-wrap items-center justify-center sm:justify-end gap-2">
            <label className="text-pearl/80 text-xs sm:text-sm">Chatter:</label>
            <select
              className="bg-obsidian border border-velvet-gray rounded-lg px-2 sm:px-3 py-1.5 text-pearl text-xs sm:text-sm focus:border-neon-orchid focus:shadow-glow-purple outline-none flex-1 sm:flex-none min-w-[120px]"
              value={selectedChatter}
              onChange={(e) => setSelectedChatter(e.target.value)}
            >
              {chatters.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.display_name || user.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => window.location.reload()}
              className="bg-neon-orchid text-obsidian px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-neon-orchid/80 transition-colors whitespace-nowrap"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Stats + League side-by-side */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-3 sm:mb-4 md:mb-6">
          {/* Left column - Stats Dashboard */}
          <div className="unified-glass p-2 sm:p-3 md:p-4">
            <h2 className="text-base sm:text-lg font-bold text-gradient-primary mb-2 text-center">Tvůj Výkon</h2>
            <StatsDashboard stats={stats} />
          </div>
          
          {/* Right column - League */}
          <div className="unified-glass p-2 sm:p-3 md:p-4">
            <h2 className="text-base sm:text-lg font-bold text-gradient-primary mb-2 text-center">Liga</h2>
            <League teamId={TEAM_ID} selectedChatter={selectedChatter} refreshKey={refreshKey} />
            {!TEAM_ID && (
              <div className="text-red-400 text-xs text-center mt-2">
                TEAM_ID not available: {TEAM_ID}
              </div>
            )}
          </div>
        </div>

        {/* Chart below the cards for better visibility */}
        <div className="flex-1 flex flex-col">
          <div className="unified-glass p-2 sm:p-3 md:p-4">
            <CumulativeChart data={timelineData} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default TvujVykon
