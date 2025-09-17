import { useState } from 'react'

function League() {
  const [activeTab, setActiveTab] = useState('daily')

  // Mock data as specified
  const leagueData = {
    name: 'Vy',
    daily: 7500,
    monthly: 50000
  }

  const topPerformers = [
    { name: 'Alex', vol: 9500, trend: 300 },
    { name: 'Vy', vol: 7500, trend: 200 },
    { name: 'Marie', vol: 6500, trend: 150 },
    { name: 'David', vol: 5500, trend: 100 }
  ]

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const tabs = [
    { id: 'daily', label: 'Denně', value: leagueData.daily },
    { id: 'monthly', label: 'Měsíčně', value: leagueData.monthly }
  ]

  return (
    <div className="bg-gradient-to-br from-charcoal to-velvet-gray rounded-xl shadow-xl border border-neon-orchid/20 p-3 h-full flex flex-col">
      
      {/* Tabs */}
      <div className="flex justify-center mb-3">
        <div className="bg-obsidian rounded-lg p-1 flex space-x-1 border border-velvet-gray">
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
      <div className="bg-obsidian rounded-lg p-3 border border-velvet-gray shadow-lg flex-1 flex flex-col">
        <h4 className="text-pearl font-bold mb-3 text-center text-sm">🏆 Nejlepší Výkonnost</h4>
        <div className="space-y-2 flex-1 overflow-y-auto">
          {topPerformers.map((player, index) => (
            <div
              key={player.name}
              className={`flex items-center justify-between p-2 rounded-lg transition-all duration-300 ${
                player.name === leagueData.name
                  ? 'bg-gradient-to-r from-neon-orchid/20 to-crimson/20 border border-neon-orchid/50'
                  : 'bg-velvet-gray hover:bg-smoke'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
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
                <span className="text-pearl font-semibold text-sm">{player.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-pearl font-bold text-sm">
                  {formatCurrency(player.vol)}
                </span>
                {activeTab === 'daily' && (
                  <span className="text-green-400 font-semibold text-xs flex items-center">
                    <span className="mr-1">↗</span>
                    +{player.trend} CZK
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default League
