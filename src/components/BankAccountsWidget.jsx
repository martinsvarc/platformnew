import { useState, useEffect } from 'react'
import { listBankAccounts, createBankAccount, deleteBankAccount, initializeDefaultBanks } from '../api/banks'
import { TEAM_ID } from '../api/config'
import { useConfirm } from '../hooks/useConfirm'

function BankAccountsWidget() {
  const { confirm, ConfirmDialog } = useConfirm()
  const [banks, setBanks] = useState([])
  const [loading, setLoading] = useState(true)
  const [newBankName, setNewBankName] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [error, setError] = useState('')

  const loadBanks = async () => {
    if (!TEAM_ID) return
    setLoading(true)
    try {
      // Try to load existing banks, or initialize with defaults if none exist
      let bankList = await listBankAccounts(TEAM_ID)
      if (bankList.length === 0) {
        bankList = await initializeDefaultBanks(TEAM_ID)
      }
      setBanks(bankList)
    } catch (err) {
      console.error('Failed to load bank accounts:', err)
      setError('Načtení účtů selhalo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBanks()
  }, [])

  const handleAddBank = async (e) => {
    e.preventDefault()
    if (!newBankName.trim()) return
    
    try {
      setError('')
      const newBank = await createBankAccount(TEAM_ID, newBankName.trim())
      setBanks(prev => [...prev, newBank])
      setNewBankName('')
      setShowAddForm(false)
    } catch (err) {
      console.error('Failed to create bank account:', err)
      setError('Přidání účtu selhalo - možná už existuje')
    }
  }

  const handleDeleteBank = async (bankId, bankName) => {
    const confirmed = await confirm(
      `Opravdu chcete odstranit účet "${bankName}"?`,
      'Odstranit účet'
    )
    if (!confirmed) return
    
    try {
      setError('')
      await deleteBankAccount(bankId, TEAM_ID)
      setBanks(prev => prev.filter(b => b.id !== bankId))
    } catch (err) {
      console.error('Failed to delete bank account:', err)
      setError('Odstranění účtu selhalo')
    }
  }

  if (loading) {
    return (
      <div className="unified-glass p-4">
        <h2 className="text-lg font-bold text-gradient-gold mb-3">Správa bankovních účtů</h2>
        <div className="text-pearl/70 text-center py-4">Načítání...</div>
      </div>
    )
  }

  return (
    <>
      <ConfirmDialog />
      <div className="unified-glass p-4">
        <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-gradient-gold">Správa bankovních účtů</h2>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1 rounded-lg bg-gradient-to-r from-neon-orchid to-crimson text-white text-sm font-semibold shadow-glow-purple hover:shadow-glow transition-all"
        >
          {showAddForm ? '✕ Zrušit' : '+ Přidat účet'}
        </button>
      </div>

      {error && (
        <div className="mb-3 p-2 rounded-lg bg-crimson/20 border border-crimson/40 text-pearl text-sm">
          {error}
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleAddBank} className="mb-3 p-3 rounded-lg bg-obsidian/60 border border-neon-orchid/30">
          <label className="block text-pearl/80 text-sm mb-2">Název nového účtu</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newBankName}
              onChange={(e) => setNewBankName(e.target.value)}
              placeholder="např. Raif - Maty"
              className="flex-1 bg-obsidian border border-velvet-gray rounded-lg px-3 py-2 text-pearl placeholder-pearl/50 focus:border-neon-orchid focus:shadow-glow-purple outline-none"
              autoFocus
            />
            <button
              type="submit"
              disabled={!newBankName.trim()}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-neon-orchid to-crimson text-white font-semibold shadow-glow-purple disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Přidat
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {banks.length === 0 ? (
          <div className="text-pearl/70 text-center py-4">
            Žádné bankovní účty. Klikněte na "+ Přidat účet" pro vytvoření nového.
          </div>
        ) : (
          banks.map((bank) => (
            <div
              key={bank.id}
              className="flex justify-between items-center p-3 rounded-lg bg-obsidian/40 border border-velvet-gray hover:border-neon-orchid/50 transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">🏦</span>
                <span className="text-pearl font-medium">{bank.name}</span>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteBank(bank.id, bank.name)}
                className="px-3 py-1 rounded-lg bg-crimson/20 hover:bg-crimson/40 text-pearl text-sm font-medium transition-all"
                title="Odstranit účet"
              >
                🗑️ Odstranit
              </button>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 text-pearl/60 text-xs">
        <p>💡 Tyto účty se zobrazí při odesílání platby a v přehledu "Účty — souhrn"</p>
      </div>
      </div>
    </>
  )
}

export default BankAccountsWidget

