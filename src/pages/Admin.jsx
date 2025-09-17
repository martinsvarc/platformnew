import { useMemo, useState } from 'react'
import GoalSetting from '../components/GoalSetting'

function Admin() {
  // Mock data
  const bankAccounts = useMemo(() => ([
    { name: 'Raif - Maty', total: 32000 },
    { name: 'Raif - Tisa', total: 18500 },
    { name: 'Fio - Martin', total: 12600 },
    { name: 'Paysafe', total: 7400 },
  ]), [])

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const formatCurrency = (amount) => new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(amount)

  return (
    <div className="min-h-screen p-6 ml-64">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gradient-primary mb-1">Admin</h1>
          <p className="text-pearl/70 text-xs md:text-sm">Správa cílů a přehled účtů</p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Goals card */}
          <GoalSetting />

          {/* Banks card */}
          <div className="bg-gradient-to-br from-charcoal to-velvet-gray rounded-xl shadow-xl border border-neon-orchid/20 p-4">
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
              <button type="button" className="px-4 py-2 rounded-lg bg-gradient-to-r from-neon-orchid to-crimson text-white shadow-glow-purple">Filtrovat</button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-neon-orchid/20 bg-[rgba(30,30,32,0.6)] backdrop-blur-sm">
              <table className="w-full text-left text-sm text-pearl">
                <thead className="text-pearl/80">
                  <tr className="border-b border-velvet-gray">
                    <th className="p-3">Banka</th>
                    <th className="p-3">Celkem za období</th>
                  </tr>
                </thead>
                <tbody>
                  {bankAccounts.map((b) => (
                    <tr key={b.name} className="border-b border-velvet-gray/60 hover:bg-velvet-gray/40">
                      <td className="p-3 font-semibold">{b.name}</td>
                      <td className="p-3 whitespace-nowrap">{formatCurrency(b.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Admin


