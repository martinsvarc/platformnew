import { useEffect, useMemo, useState } from 'react'
import GoalSetting from '../components/GoalSetting'
import BankAccountsWidget from '../components/BankAccountsWidget'
import ModelsWidget from '../components/ModelsWidget'
import BackgroundUploadWidget from '../components/BackgroundUploadWidget'
import TeamMembersWidget from '../components/TeamMembersWidget'
import { getBankAccountStats } from '../api/banks'
import { TEAM_ID } from '../api/config'

function Admin() {
  const [bankAccounts, setBankAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const formatCurrency = (amount) => new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(amount)

  const loadBankStats = async () => {
    if (!TEAM_ID) return
    setLoading(true)
    try {
      const startDate = from || null
      const endDate = to || null
      const stats = await getBankAccountStats(TEAM_ID, startDate, endDate)
      setBankAccounts(stats)
    } catch (err) {
      console.error('Failed to load bank stats:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBankStats()
  }, [])

  const handleFilter = () => {
    loadBankStats()
  }

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6 lg:ml-64">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gradient-primary mb-1">Admin</h1>
          <p className="text-pearl/70 text-xs sm:text-sm">Správa cílů a přehled účtů</p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Goals card */}
          <GoalSetting />

          {/* Right column */}
          <div className="space-y-6">
            {/* Banks card */}
            <div className="unified-glass p-4">
              <h2 className="text-lg font-bold text-gradient-gold mb-3">Účty — souhrn</h2>
              {/* Period filter */}
              <div className="mb-3 flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-pearl/80 text-sm mb-1">Od</label>
                  <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-obsidian border border-velvet-gray rounded-lg px-3 py-2 text-pearl focus:border-neon-orchid focus:shadow-glow-purple outline-none" />
                </div>
                <div>
                  <label className="block text-pearl/80 text-sm mb-1">Do</label>
                  <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-obsidian border border-velvet-gray rounded-lg px-3 py-2 text-pearl focus:border-neon-orchid focus:shadow-glow-purple outline-none" />
                </div>
                <button type="button" onClick={handleFilter} className="px-4 py-2 rounded-lg bg-gradient-to-r from-neon-orchid to-crimson text-white shadow-glow-purple hover:shadow-glow transition-all">Filtrovat</button>
              </div>

              {loading ? (
                <div className="text-pearl/70 text-center py-4">Načítání...</div>
              ) : (
                <div className="overflow-x-auto rounded-xl unified-card">
                  <table className="w-full text-left text-sm text-pearl">
                    <thead className="text-pearl/80">
                      <tr className="border-b border-velvet-gray">
                        <th className="p-3">Banka</th>
                        <th className="p-3">Celkem za období</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bankAccounts.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="p-3 text-center text-pearl/60">
                            Žádné účty nenalezeny
                          </td>
                        </tr>
                      ) : (
                        bankAccounts.map((b) => (
                          <tr key={b.id} className="border-b border-velvet-gray/60 hover:bg-velvet-gray/40">
                            <td className="p-3 font-semibold">{b.name}</td>
                            <td className="p-3 whitespace-nowrap">{formatCurrency(Number(b.total))}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Background Upload Widget - Directly below Účty souhrn */}
            <BackgroundUploadWidget />
          </div>
        </div>

        {/* Management Widgets Row */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BankAccountsWidget />
          <ModelsWidget />
        </div>

        {/* Team Members Widget */}
        <div className="mt-6">
          <TeamMembersWidget />
        </div>
      </div>
    </div>
  )
}

export default Admin


