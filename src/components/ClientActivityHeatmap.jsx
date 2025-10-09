import { useState, useEffect, useMemo } from 'react'
import { getClientActivityHeatmap } from '../api/analytics'

function ClientActivityHeatmap({ teamId, filters = {} }) {
  const [heatmapData, setHeatmapData] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState('')
  const [daysToShow] = useState(30)

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Load heatmap data
  useEffect(() => {
    const loadData = async () => {
      if (!teamId) return
      
      setLoading(true)
      try {
        const data = await getClientActivityHeatmap(teamId, {
          startDate: selectedDate || null,
          daysToShow
        })
        setHeatmapData(data)
      } catch (error) {
        console.error('Failed to load heatmap data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [teamId, selectedDate, daysToShow])

  // Calculate max value for color intensity
  const maxDailyAmount = useMemo(() => {
    if (!heatmapData.length) return 0
    let max = 0
    heatmapData.forEach(client => {
      Object.values(client.dailyAmounts).forEach(amount => {
        if (amount > max) max = amount
      })
    })
    return max
  }, [heatmapData])

  // Get color based on amount
  const getHeatColor = (amount) => {
    if (!amount || maxDailyAmount === 0) return 'rgba(45, 45, 45, 0.3)' // Very dark gray for 0
    const intensity = Math.min(amount / maxDailyAmount, 1)
    
    // Color scale: dark -> purple -> bright purple
    if (intensity < 0.25) {
      return `rgba(80, 60, 120, ${0.3 + intensity * 1.2})`
    } else if (intensity < 0.5) {
      return `rgba(120, 80, 180, ${0.4 + intensity * 1.2})`
    } else if (intensity < 0.75) {
      return `rgba(157, 0, 255, ${0.5 + intensity * 1})`
    } else {
      return `rgba(218, 112, 214, ${0.6 + intensity * 0.4})`
    }
  }

  if (loading) {
    return (
      <div className="unified-glass p-4">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-neon-orchid mb-2"></div>
          <p className="text-pearl/70 text-sm">Načítání heatmapy...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="unified-glass p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold text-gradient-gold mb-1">
            Aktivita klientů po dnech
          </h2>
          <p className="text-sm text-pearl/70">
            {selectedDate 
              ? `Klienti, kteří začali: ${selectedDate}` 
              : 'Všichni klienti seřazení podle celkové aktivity'}
          </p>
        </div>
        
        {/* Date filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-pearl/70">Datum prvního zaslání:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-obsidian border border-velvet-gray rounded-lg px-3 py-1.5 text-sm text-pearl focus:border-neon-orchid focus:shadow-glow-purple outline-none"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="px-3 py-1.5 text-sm rounded-lg bg-velvet-gray/40 text-pearl hover:bg-velvet-gray/60 transition-all"
            >
              Zrušit filtr
            </button>
          )}
        </div>
      </div>

      {heatmapData.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-pearl/50">Žádní klienti pro vybrané datum</p>
        </div>
      ) : (
        <>
          {/* Legend */}
          <div className="flex items-center gap-4 mb-4 text-xs text-pearl/70">
            <span>Intenzita barvy = výše zaslané částky</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(45, 45, 45, 0.3)' }}></div>
              <span>0 Kč</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(120, 80, 180, 0.6)' }}></div>
              <span>Nízká</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(157, 0, 255, 0.8)' }}></div>
              <span>Střední</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(218, 112, 214, 1)' }}></div>
              <span>Vysoká</span>
            </div>
          </div>

          {/* Heatmap table */}
          <div className="overflow-auto max-h-[600px] rounded-lg border border-velvet-gray/30">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-charcoal border-b border-velvet-gray/50 z-10">
                <tr>
                  <th className="p-2 text-left text-pearl/80 font-semibold sticky left-0 bg-charcoal z-20 min-w-[150px]">
                    Klient
                  </th>
                  <th className="p-2 text-right text-pearl/80 font-semibold min-w-[100px]">
                    Celkem
                  </th>
                  <th className="p-2 text-right text-pearl/80 font-semibold min-w-[80px]">
                    Aktivní dny
                  </th>
                  {Array.from({ length: daysToShow }).map((_, index) => (
                    <th 
                      key={index} 
                      className="p-1 text-center text-pearl/60 font-medium min-w-[50px]"
                      title={`Den ${index + 1}`}
                    >
                      {index + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapData.map((client) => (
                  <tr 
                    key={client.clientId} 
                    className="border-b border-velvet-gray/30 hover:bg-velvet-gray/20 transition-colors"
                  >
                    <td className="p-2 text-pearl font-medium sticky left-0 bg-charcoal z-10 truncate max-w-[150px]">
                      {client.clientName}
                    </td>
                    <td className="p-2 text-right text-pearl font-semibold whitespace-nowrap">
                      {formatCurrency(client.totalAmount)}
                    </td>
                    <td className="p-2 text-right text-pearl/70">
                      {client.activeDays}
                    </td>
                    {Array.from({ length: daysToShow }).map((_, dayIndex) => {
                      const amount = client.dailyAmounts[dayIndex] || 0
                      return (
                        <td 
                          key={dayIndex}
                          className="p-1"
                        >
                          <div
                            className="w-full h-8 rounded flex items-center justify-center text-xs font-semibold transition-all hover:scale-110 cursor-default"
                            style={{ 
                              backgroundColor: getHeatColor(amount),
                              color: amount > 0 ? 'white' : 'transparent'
                            }}
                            title={amount > 0 ? `Den ${dayIndex + 1}: ${formatCurrency(amount)}` : `Den ${dayIndex + 1}: Bez platby`}
                          >
                            {amount > 0 && (
                              <span className="text-[10px]">
                                {amount >= 1000 ? `${Math.round(amount / 1000)}k` : Math.round(amount)}
                              </span>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Stats */}
          <div className="mt-4 flex justify-between items-center text-sm text-pearl/70">
            <span>Zobrazeno {heatmapData.length} klientů</span>
            <span>Prvních {daysToShow} dní od první platby</span>
          </div>
        </>
      )}
    </div>
  )
}

export default ClientActivityHeatmap

