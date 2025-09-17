import League from '../components/League'
import StatsDashboard from '../components/StatsDashboard'
import { useEffect, useMemo, useState } from 'react'
import { getUserTotals } from '../api/queries'
import { TEAM_ID, USER_ID } from '../api/config'

function TvujVykon() {
  const chatters = useMemo(() => ['Všichni', 'Vy', 'Jana', 'Alex', 'Marie'], [])
  const [selectedChatter, setSelectedChatter] = useState('Všichni')

  // Mock per-chatter stats mapping; in real app fetch via API using selectedChatter
  const [stats, setStats] = useState({ dailyVolume: 0, newClients: 0, lastHour: 0, totalClients: 0, totalEarned: 0, avgClient: 0 })

  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!TEAM_ID) return
      try {
        const totals = await getUserTotals(TEAM_ID, USER_ID)
        if (!mounted) return
        const total = totals?.total || 0
        const today = totals?.today || 0
        // Placeholder values for non-financial metrics until implemented
        setStats({ dailyVolume: today, newClients: 0, lastHour: 0, totalClients: 0, totalEarned: total, avgClient: 0 })
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Načtení výkonu selhalo', e)
      }
    }
    load()
    const id = setInterval(load, 15000)
    return () => { mounted = false; clearInterval(id) }
  }, [])
  return (
    <div className="min-h-screen p-6 ml-64">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gradient-primary mb-2">
            Liga
          </h1>
          <p className="text-pearl/70 text-lg">
            Top výkony a trendy
          </p>
        </div>

        {/* Filter */}
        <div className="mb-4 flex items-center justify-center gap-2">
          <label className="text-pearl/80 text-sm">Chatter:</label>
          <select
            className="bg-obsidian border border-velvet-gray rounded-lg px-3 py-2 text-pearl focus:border-neon-orchid focus:shadow-glow-purple outline-none"
            value={selectedChatter}
            onChange={(e) => setSelectedChatter(e.target.value)}
          >
            {chatters.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Stats + League side-by-side on xl, stacked on small */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
          <div className="flex flex-col h-full">
            <h2 className="text-lg md:text-xl font-bold text-gradient-gold mb-2 text-center">Tvůj Výkon</h2>
            <StatsDashboard stats={stats} />
          </div>
          <div className="flex flex-col h-full">
            <h2 className="text-lg md:text-xl font-bold text-gradient-gold mb-2 text-center">Liga</h2>
            <League />
          </div>
        </div>
      </div>
    </div>
  )
}

export default TvujVykon
