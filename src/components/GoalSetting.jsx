import { useEffect, useState } from 'react'
import { upsertSimpleGoals } from '../api/queries'
import { TEAM_ID } from '../api/config'

function parseNumberOr(defaultValue, value) {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : defaultValue
}

function GoalSetting() {
  const [daily, setDaily] = useState(40000)
  const [weekly, setWeekly] = useState(150000)
  const [monthly, setMonthly] = useState(500000)

  useEffect(() => {
    try {
      const d = parseNumberOr(40000, localStorage.getItem('goalDaily'))
      const w = parseNumberOr(150000, localStorage.getItem('goalWeekly'))
      const m = parseNumberOr(500000, localStorage.getItem('goalMonthly'))
      setDaily(d)
      setWeekly(w)
      setMonthly(m)
    } catch {}
  }, [])

  const save = async (e) => {
    e.preventDefault()
    try {
      await upsertSimpleGoals(TEAM_ID, { daily, weekly, monthly })
      alert('Cíle byly uloženy.')
    } catch (err) {
      alert('Nepodařilo se uložit cíle. Zkuste to prosím znovu.')
    }
  }

  return (
    <div className="w-full bg-gradient-to-br from-charcoal to-velvet-gray rounded-xl shadow-xl border border-neon-orchid/20 p-6">
      <h2 className="text-xl font-bold text-gradient-primary mb-4">Nastavení cílů</h2>
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="block text-pearl/80 text-sm mb-1">Denní cíl (CZK)</label>
          <input
            type="number"
            min="0"
            step="1000"
            value={daily}
            onChange={(e) => setDaily(parseNumberOr(daily, e.target.value))}
            className="w-full px-3 py-2 rounded-lg bg-obsidian text-pearl border border-velvet-gray focus:border-neon-orchid focus:shadow-glow-purple outline-none"
            placeholder="40 000"
          />
        </div>
        <div>
          <label className="block text-pearl/80 text-sm mb-1">Týdenní cíl (CZK)</label>
          <input
            type="number"
            min="0"
            step="1000"
            value={weekly}
            onChange={(e) => setWeekly(parseNumberOr(weekly, e.target.value))}
            className="w-full px-3 py-2 rounded-lg bg-obsidian text-pearl border border-velvet-gray focus:border-neon-orchid focus:shadow-glow-purple outline-none"
            placeholder="150 000"
          />
        </div>
        <div>
          <label className="block text-pearl/80 text-sm mb-1">Měsíční cíl (CZK)</label>
          <input
            type="number"
            min="0"
            step="1000"
            value={monthly}
            onChange={(e) => setMonthly(parseNumberOr(monthly, e.target.value))}
            className="w-full px-3 py-2 rounded-lg bg-obsidian text-pearl border border-velvet-gray focus:border-neon-orchid focus:shadow-glow-purple outline-none"
            placeholder="500 000"
          />
        </div>
        <button type="submit" className="w-full bg-gradient-to-r from-neon-orchid to-crimson text-white px-4 py-2 rounded-lg shadow-glow-purple hover:brightness-110 transition">
          Uložit cíle
        </button>
      </form>
    </div>
  )
}

export default GoalSetting


