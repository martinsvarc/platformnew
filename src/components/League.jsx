import { useState, useEffect } from 'react'
import { getLeagueData } from '../api/queries'
import { TEAM_ID, USER_ID } from '../api/config'
import { LeagueRowSkeleton } from './LoadingSkeleton'

function League({ teamId, selectedChatter, refreshKey }) {
  const [activeTab, setActiveTab] = useState('daily')
  const [leagueData, setLeagueData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load league data
  useEffect(() => {
    let mounted = true
    const loadLeagueData = async () => {
      if (!teamId) {
        console.log('No teamId provided to League component')
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        setError(null)
        console.log('Loading league data for teamId:', teamId, 'selectedChatter:', selectedChatter, 'refreshKey:', refreshKey)
        const userId = selectedChatter === 'all' ? null : selectedChatter
        const data = await getLeagueData(teamId, userId)
        if (!mounted) return
        console.log('League data loaded:', data)
        setLeagueData(data)
      } catch (e) {
        console.error('Načtení ligy selhalo', e)
        setError('Nepodařilo se načíst data ligy: ' + e.message)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }
    loadLeagueData()
    return () => { mounted = false }
  }, [teamId, selectedChatter, refreshKey])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Get current user's data for tabs
  const currentUser = leagueData.find(user => user.id === USER_ID) || leagueData[0]
  const tabs = [
    { id: 'daily', label: 'Denně', value: currentUser?.daily || 0 },
    { id: 'monthly', label: 'Měsíčně', value: currentUser?.monthly || 0 }
  ]

  // Sort league data based on active tab
  const sortedLeagueData = [...leagueData].sort((a, b) => {
    if (activeTab === 'daily') {
      return b.daily - a.daily
    } else {
      return b.monthly - a.monthly
    }
  })

  if (!teamId) {
    return (
      <div className="p-3 h-full flex flex-col">
        <div className="flex items-center justify-center h-full">
          <div className="text-pearl/70 text-center">
            <div className="text-sm">Čekání na načtení týmu...</div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-3 h-full flex flex-col">
        {/* Tabs skeleton */}
        <div className="flex justify-center mb-3">
          <div className="unified-card p-1 flex space-x-1">
            {['daily', 'monthly'].map((tab, i) => (
              <div
                key={tab}
                className="relative overflow-hidden px-4 py-2 rounded-md w-24 h-10 bg-gradient-to-r from-charcoal/30 via-velvet-gray/20 to-charcoal/30 animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s`, animationFillMode: 'backwards' }}
              >
                <div 
                  className="absolute inset-0 -translate-x-full animate-[shimmer_3s_ease-in-out_infinite]"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(218, 112, 214, 0.06) 50%, transparent 100%)'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* League list skeleton */}
        <div className="unified-card p-3 flex-1 flex flex-col">
          <div className="relative overflow-hidden h-5 w-40 rounded mb-3 mx-auto bg-gradient-to-r from-charcoal/30 via-velvet-gray/20 to-charcoal/30">
            <div 
              className="absolute inset-0 -translate-x-full animate-[shimmer_3s_ease-in-out_infinite]"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(218, 112, 214, 0.06) 50%, transparent 100%)'
              }}
            />
          </div>
          <div className="space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <LeagueRowSkeleton key={i} delay={i * 0.08} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-3 h-full flex flex-col">
        <div className="flex items-center justify-center h-full">
          <div className="text-red-400 text-center">
            <div className="text-sm">{error}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 h-full flex flex-col">
      
      {/* Tabs */}
      <div className="flex justify-center mb-3">
        <div className="unified-card p-1 flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-neon-orchid to-crimson text-white shadow-glow-purple'
                  : 'text-pearl hover:bg-velvet-gray hover:shadow-glow'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top Performers List */}
      <div className="unified-card p-3 flex-1 flex flex-col">
        <h4 className="text-pearl font-bold mb-3 text-center text-sm">
          {activeTab === 'daily' ? '🏆 Denní Výkonnost' : '🏆 Měsíční Body'}
        </h4>
        <div className="space-y-2 flex-1 overflow-y-auto">
          {sortedLeagueData.length === 0 ? (
            <div className="text-center text-pearl/70 py-4">
              Žádná data k zobrazení
            </div>
          ) : (
            sortedLeagueData.map((player, index) => {
              const amount = activeTab === 'daily' ? player.daily : player.monthly
              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-2 rounded-lg transition-all duration-300 ${
                    player.id === USER_ID
                      ? 'bg-gradient-to-r from-neon-orchid/20 to-crimson/20 border border-neon-orchid/50'
                      : 'bg-velvet-gray hover:bg-smoke'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                      index === 0
                        ? 'bg-gradient-to-r from-sunset-gold to-yellow-400 text-obsidian'
                        : index === 1
                        ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-obsidian'
                        : index === 2
                        ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white'
                        : 'bg-velvet-gray text-pearl'
                    }`}>
                      {index + 1}
                    </div>
                    {player.avatar_url ? (
                      <img
                        src={player.avatar_url}
                        alt={player.name}
                        className="w-8 h-8 rounded-full object-cover border-2 border-neon-orchid/40 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full border-2 border-neon-orchid/40 bg-gradient-to-br from-neon-orchid/30 to-crimson/30 flex-shrink-0" />
                    )}
                    <span className="text-pearl font-semibold text-sm">{player.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-pearl font-bold text-sm">
                      {formatCurrency(amount)}
                    </span>
                    {activeTab === 'daily' && player.trend > 0 && (
                      <span className="font-semibold text-xs flex items-center text-green-400">
                        <span className="mr-1">↗</span>
                        {formatCurrency(player.trend)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default League
