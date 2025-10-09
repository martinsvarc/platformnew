import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Confetti from 'react-confetti'
import { createPayment } from '../api/payments'
import { listClients } from '../api/queries'
import { listBankAccounts } from '../api/banks'
import { listModels } from '../api/models'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

function PaymentWizard({ onSuccess, onClose }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { toast } = useToast()
  const amountPresets = [100, 200, 300, 500, 750, 1000, 1500, 2000, 5000]
  const platforms = ['WhatsApp', 'FB Stranka', 'Other']
  const [bankaOptions, setBankaOptions] = useState([])
  const [banksLoading, setBanksLoading] = useState(true)
  const [modelOptions, setModelOptions] = useState([])
  const [modelsLoading, setModelsLoading] = useState(true)
  const [clients, setClients] = useState([])
  const [allClients, setAllClients] = useState([]) // Store all clients for instant filtering
  const [clientsLoading, setClientsLoading] = useState(false)

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    amount: '',
    client: '',
    newClient: '',
    newClientEmail: '',
    newClientVyplataDay: '',
    newClientPhone: '',
    newClientNotes: '',
    sold: '',
    platform: '',
    model: '',
    banka: '',
    message: ''
  })
  const [clientSearch, setClientSearch] = useState('')
  const [showNewClient, setShowNewClient] = useState(false)
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState(null)
  const [isFading, setIsFading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [isEntering, setIsEntering] = useState(true)

  const canNext = () => {
    switch (step) {
      case 1: return Boolean(form.amount)
      case 2: return Boolean(form.client || form.newClient) && (selectedClientId || form.newClient)
      case 3: return Boolean(form.sold)
      case 4: return Boolean(form.platform)
      case 5: return Boolean(form.model)
      case 6: return Boolean(form.banka)
      case 7: return true
      default: return false
    }
  }

  const next = () => setStep((s) => Math.min(7, s + 1))
  const prev = () => setStep((s) => Math.max(1, s - 1))

  // Load bank accounts when component mounts
  useEffect(() => {
    const loadBanks = async () => {
      if (!user?.team_id) return
      setBanksLoading(true)
      try {
        const banks = await listBankAccounts(user.team_id)
        setBankaOptions(banks.map(b => b.name))
        // Set default to first bank if available
        if (banks.length > 0 && !form.banka) {
          setForm(f => ({ ...f, banka: banks[0].name }))
        }
      } catch (err) {
        console.error('Failed to load bank accounts:', err)
        // Fallback to empty
        setBankaOptions([])
      } finally {
        setBanksLoading(false)
      }
    }
    loadBanks()
  }, [user?.team_id])

  // Load models when component mounts
  useEffect(() => {
    const loadModels = async () => {
      if (!user?.team_id) return
      setModelsLoading(true)
      try {
        const models = await listModels(user.team_id)
        setModelOptions(models.map(m => m.name))
      } catch (err) {
        console.error('Failed to load models:', err)
        setModelOptions([])
      } finally {
        setModelsLoading(false)
      }
    }
    loadModels()
  }, [user?.team_id])

  // Load all clients once on mount
  useEffect(() => {
    if (!user?.team_id) return
    
    const loadAllClients = async () => {
      setClientsLoading(true)
      try {
        const results = await listClients(user.team_id, { search: '' })
        setAllClients(results)
        setClients(results)
      } catch (error) {
        console.error('Failed to load clients:', error)
        setAllClients([])
        setClients([])
      } finally {
        setClientsLoading(false)
      }
    }

    loadAllClients()
  }, [user?.team_id])

  // Helper function to remove diacritics for search
  const removeDiacritics = (str) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  }

  // Filter clients instantly on client-side as user types
  const filteredClients = useMemo(() => {
    if (!clientSearch || !clientSearch.trim()) {
      return allClients
    }

    const searchTerm = removeDiacritics(clientSearch.toLowerCase().trim())
    return allClients.filter(client => {
      const name = removeDiacritics(client.name?.toLowerCase() || '')
      const email = removeDiacritics(client.email?.toLowerCase() || '')
      const phone = removeDiacritics(client.phone?.toLowerCase() || '')
      
      return name.includes(searchTerm) || 
             email.includes(searchTerm) || 
             phone.includes(searchTerm)
    })
  }, [allClients, clientSearch])

  const handleClientSelect = (client) => {
    setSelectedClientId(client.id)
    setForm(f => ({ ...f, client: client.name }))
    setClientSearch(client.name)
    setShowClientDropdown(false)
  }

  const handleClientSearchChange = (e) => {
    const value = e.target.value
    setClientSearch(value)
    setForm(f => ({ ...f, client: value, newClient: '' }))
    setSelectedClientId(null)
    // Show dropdown immediately as filtering is instant now
    setShowClientDropdown(true)
  }

  const handleConfirm = async () => {
    try {
      if (!user || !user.team_id || !user.id) {
        throw new Error('Uživatel není přihlášen nebo chybí informace o týmu')
      }
      
      const amount = Number(form.amount)
      
      if (!amount || amount <= 0) {
        throw new Error('Neplatná částka')
      }
      
      const client = form.newClient
        ? { name: form.newClient, email: form.newClientEmail, phone: form.newClientPhone, notes: form.newClientNotes, vyplata: form.newClientVyplataDay }
        : (selectedClientId ? { id: selectedClientId } : null)
      
      console.log('PaymentWizard: Creating payment with client data:', client)
      console.log('PaymentWizard: Form data:', form)
      
      await createPayment({
        teamId: user.team_id,
        userId: user.id,
        client,
        // paidAt will be automatically set to Prague timezone
        amount,
        currency: 'CZK',
        prodano: form.sold,
        platforma: form.platform,
        model: form.model,
        banka: form.banka,
        message: form.message || null,
      })
      setShowConfetti(true)
      setIsFading(true)
      setTimeout(() => {
        setForm({
          amount: '',
          client: '',
          newClient: '',
          newClientEmail: '',
          newClientVyplataDay: '',
          newClientPhone: '',
          newClientNotes: '',
          sold: '',
          platform: '',
          model: '',
          banka: bankaOptions.length > 0 ? bankaOptions[0] : '',
          message: ''
        })
        setClientSearch('')
        setShowNewClient(false)
        setShowClientDropdown(false)
        setSelectedClientId(null)
        setStep(1)
        setIsFading(false)
        setTimeout(() => {
          setShowConfetti(false)
          // Call the success callback to close the popover
          if (onSuccess) {
            onSuccess()
          }
        }, 400)
      }, 900)
    } catch (e) {
      console.error('Payment creation error:', e)
      toast.error('Uložení platby selhalo. Zkontrolujte připojení a údaje.')
    }
  }

  // TV/mobile: arrow key navigation and Enter to proceed
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') {
        if (canNext() && step < 7) next()
      } else if (e.key === 'ArrowLeft') {
        if (step > 1) prev()
      } else if (e.key === 'Enter') {
        if (step < 7 && canNext()) next()
        else if (step === 7) handleConfirm()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, form])

  useEffect(() => {
    const onResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    setIsEntering(false)
    const t = setTimeout(() => setIsEntering(true), 20)
    return () => clearTimeout(t)
  }, [step])

  const renderStepHeader = () => (
    <div className="text-center mb-6">
      <div className="text-pearl/70 text-sm">Krok {step}/7</div>
      <h1 className="text-2xl md:text-3xl font-bold text-gradient-primary mt-1">Nová Platba</h1>
    </div>
  )

  const containerBase = 'w-full max-w-md mx-auto flex flex-col items-center justify-center text-pearl'
  const cardBase = 'w-full frosted-glass frosted-glass-no-hover p-6'
  const gridButtons = 'grid grid-cols-3 gap-3'
  const btn = 'py-3 px-4 rounded-xl font-semibold transition-all duration-300'
  const btnActive = 'bg-gradient-to-r from-neon-orchid to-crimson text-white shadow-glow-purple ring-2 ring-[rgba(255,204,0,0.5)] shadow-[0_0_8px_rgba(255,215,0,0.6)]'
  const btnIdle = 'bg-obsidian border border-velvet-gray text-pearl'

  return (
    <div className="w-full max-w-2xl mx-auto flex items-center justify-center overflow-hidden">
      <div className={containerBase}>
        {renderStepHeader()}

        <div className={`${cardBase} transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'} relative`}
          style={{
            minHeight: '420px'
          }}
        >
          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-20 bg-obsidian/80 text-pearl p-2 rounded-full border border-velvet-gray transition-all duration-300"
              title="Zavřít"
            >
              <span className="text-xl">✕</span>
            </button>
          )}
          {showConfetti && (
            <div className="pointer-events-none absolute inset-0">
              <Confetti width={viewport.width} height={viewport.height} numberOfPieces={250} recycle={false} gravity={0.25} />
            </div>
          )}
          <div key={step} className={`transition-all duration-250 ease-out ${isEntering ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center text-lg font-medium">Částka (CZK)</div>
              <div className={gridButtons}>
                {amountPresets.map((val) => (
                  <button
                    key={val}
                    className={`${btn} ${form.amount === String(val) ? btnActive : btnIdle}`}
                    onClick={() => setForm(f => ({ ...f, amount: String(val) }))}
                  >{val}</button>
                ))}
              </div>
              <input
                type="number"
                inputMode="numeric"
                placeholder="Vlastní částka"
                value={form.amount}
                onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full py-3 px-4 rounded-xl bg-obsidian border border-velvet-gray focus:border-neon-orchid focus:shadow-glow-purple outline-none"
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center text-lg font-medium">Klient</div>
              {!showNewClient && (
                <>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Hledat nebo zadat klienta..."
                      value={clientSearch}
                      onChange={handleClientSearchChange}
                      onFocus={() => setShowClientDropdown(clientSearch.length > 0)}
                      className="w-full py-3 px-4 rounded-xl bg-obsidian border border-velvet-gray focus:border-neon-orchid focus:shadow-glow-purple outline-none"
                    />
                    {showClientDropdown && filteredClients.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-obsidian border border-velvet-gray rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                        {filteredClients.map((client) => (
                          <button
                            key={client.id}
                            onClick={() => handleClientSelect(client)}
                            className="w-full px-4 py-3 text-left border-b border-velvet-gray last:border-b-0 transition-colors"
                          >
                            <div className="font-medium text-pearl">{client.name}</div>
                            {client.email && (
                              <div className="text-sm text-pearl/60">{client.email}</div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    {clientsLoading && !allClients.length && (
                      <div className="absolute top-1/2 right-3 transform -translate-y-1/2 text-pearl/60">
                        <div className="animate-spin w-4 h-4 border-2 border-neon-orchid border-t-transparent rounded-full"></div>
                      </div>
                    )}
                  </div>
              {!selectedClientId && clientSearch && !clientsLoading && allClients.length > 0 && filteredClients.length === 0 && (
                <div className="text-center text-pearl/60 text-sm">
                  Klient nenalezen. Vytvořte nového klienta.
                </div>
              )}
                </>
              )}
              <button
                className={`${btn} w-full ${showNewClient ? btnActive : btnIdle}`}
                onClick={() => setShowNewClient(v => !v)}
              >{showNewClient ? 'Zrušit' : '+ Nový Klient'}</button>
              {showNewClient && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Jméno a příjmení"
                    value={form.newClient}
                    onChange={(e) => {
                      setForm(f => ({ ...f, newClient: e.target.value, client: '' }))
                      setSelectedClientId(null)
                      setClientSearch('')
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-obsidian border border-velvet-gray focus:border-neon-orchid focus:shadow-glow-purple outline-none"
                  />
                  <select
                    value={form.newClientVyplataDay}
                    onChange={(e) => setForm(f => ({ ...f, newClientVyplataDay: e.target.value }))}
                    className="w-full py-3 px-4 rounded-xl bg-obsidian border border-velvet-gray focus:border-neon-orchid focus:shadow-glow-purple outline-none"
                  >
                    <option value="">Výplata den (1-30)</option>
                    {Array.from({ length: 30 }).map((_, i) => (
                      <option key={i+1} value={String(i+1)}>{i+1}</option>
                    ))}
                  </select>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="email"
                      placeholder="Email"
                      value={form.newClientEmail}
                      onChange={(e) => setForm(f => ({ ...f, newClientEmail: e.target.value }))}
                      className="w-full py-3 px-4 rounded-xl bg-obsidian border border-velvet-gray focus:border-neon-orchid focus:shadow-glow-purple outline-none"
                    />
                    <input
                      type="tel"
                      placeholder="Telefon"
                      value={form.newClientPhone}
                      onChange={(e) => setForm(f => ({ ...f, newClientPhone: e.target.value }))}
                      className="w-full py-3 px-4 rounded-xl bg-obsidian border border-velvet-gray focus:border-neon-orchid focus:shadow-glow-purple outline-none"
                    />
                  </div>
                  <textarea
                    placeholder={t('common.notes')}
                    value={form.newClientNotes}
                    onChange={(e) => setForm(f => ({ ...f, newClientNotes: e.target.value }))}
                    className="w-full min-h-[84px] py-3 px-4 rounded-xl bg-obsidian border border-velvet-gray focus:border-neon-orchid focus:shadow-glow-purple outline-none"
                  />
                  <div className="flex justify-end">
                    <button
                      className={`${btn} ${btnActive}`}
                      onClick={() => {
                        if (form.newClient) {
                          setForm(f => ({ ...f, client: f.newClient }))
                          setShowNewClient(false)
                          setSelectedClientId(null)
                          setClientSearch(form.newClient)
                          next()
                        }
                      }}
                    >Přidat Klienta</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center text-lg font-medium">Prodáno</div>
              <div className="grid grid-cols-2 gap-3">
                {['obrázky', 'video', 'chat', 'dárek'].map(opt => (
                  <button key={opt} className={`${btn} ${form.sold === opt ? btnActive : btnIdle}`}
                    onClick={() => setForm(f => ({ ...f, sold: opt }))}>{opt}</button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Vlastní položka (např. balíček videí)"
                value={form.sold}
                onChange={(e) => setForm(f => ({ ...f, sold: e.target.value }))}
                className="w-full py-3 px-4 rounded-xl bg-obsidian border border-velvet-gray focus:border-neon-orchid focus:shadow-glow-purple outline-none"
              />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center text-lg font-medium">Platforma</div>
              <div className="space-y-3">
                {platforms.map(p => (
                  <button key={p} className={`${btn} w-full flex items-center justify-center gap-2 ${form.platform === p ? btnActive : btnIdle}`}
                    onClick={() => setForm(f => ({ ...f, platform: p }))}
                  >
                    {p === 'WhatsApp' && <span>📱</span>}
                    {p === 'FB Stranka' && <span>📘</span>}
                    {p === 'Other' && <span>🌐</span>}
                    <span>{p}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="text-center text-lg font-medium">Model</div>
              {modelsLoading ? (
                <div className="text-center text-pearl/60">{t('common.loadingModels')}</div>
              ) : modelOptions.length === 0 ? (
                <div className="text-center text-pearl/60">Žádné modelky. Přidejte je v Admin.</div>
              ) : (
                <div className="space-y-3">
                  {modelOptions.map(m => (
                    <button key={m} className={`${btn} w-full ${form.model === m ? btnActive : btnIdle}`}
                      onClick={() => setForm(f => ({ ...f, model: m }))}>{m}</button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div className="text-center text-lg font-medium">Banka</div>
              {banksLoading ? (
                <div className="text-center text-pearl/60">{t('common.loadingAccounts')}</div>
              ) : bankaOptions.length === 0 ? (
                <div className="text-center text-pearl/60">Žádné účty. Přidejte je v Admin.</div>
              ) : (
                <div className="space-y-3">
                  {bankaOptions.map(b => (
                    <button key={b} className={`${btn} w-full ${form.banka === b ? btnActive : btnIdle}`}
                      onClick={() => setForm(f => ({ ...f, banka: b }))}>{b}</button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 7 && (
            <div className="space-y-6">
              <div className="text-center text-lg font-medium">Schválit</div>
              <div className="bg-obsidian border border-velvet-gray rounded-xl p-4 space-y-2 text-pearl/90">
                <div><span className="text-pearl/60">Částka:</span> {form.amount} CZK</div>
                <div><span className="text-pearl/60">Klient:</span> {form.client || form.newClient}</div>
                <div><span className="text-pearl/60">Prodáno:</span> {form.sold}</div>
                <div><span className="text-pearl/60">Platforma:</span> {form.platform}</div>
                <div><span className="text-pearl/60">Model:</span> {form.model}</div>
                <div><span className="text-pearl/60">Banka:</span> {form.banka}</div>
              </div>
              
              {/* Message field for TTS */}
              <div className="space-y-2">
                <label className="text-pearl/80 text-sm flex items-center gap-2">
                  <span>🔊</span>
                  <span>Zpráva (bude přečtena nahlas)</span>
                  <span className="text-pearl/40 text-xs">(volitelné)</span>
                </label>
                <textarea
                  placeholder="Např: Díky za vaši podporu! Jste úžasní!"
                  value={form.message}
                  onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                  maxLength={200}
                  className="w-full py-3 px-4 rounded-xl bg-obsidian border border-velvet-gray focus:border-neon-orchid focus:shadow-glow-purple outline-none min-h-[80px] resize-none"
                />
                <div className="text-right text-xs text-pearl/40">
                  {form.message.length}/200 znaků
                </div>
              </div>
              
              <button
                onClick={handleConfirm}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-neon-orchid to-crimson text-white font-bold text-xl transition-all duration-300 flex items-center justify-center gap-3"
              >
                <span>✓</span>
                <span>Schválit</span>
              </button>
            </div>
          )}
          </div>
        </div>
        {/* Buttons below the form, aligned to the right */}
        <div className="mt-4 w-full max-w-3xl mx-auto flex justify-end gap-3">
          <button
            onClick={prev}
            disabled={step === 1}
            className={`px-5 py-3 rounded-xl font-semibold transition-all ${step === 1 ? 'opacity-40 cursor-not-allowed bg-velvet-gray text-pearl' : 'bg-obsidian border border-velvet-gray text-pearl'}`}
          >← Předchozí</button>
          <button
            onClick={next}
            disabled={!canNext() || step === 7}
            className={`px-5 py-3 rounded-xl font-semibold transition-all ${(!canNext() || step === 7) ? 'opacity-40 cursor-not-allowed bg-velvet-gray text-pearl' : 'bg-gradient-to-r from-neon-orchid to-crimson text-white'}`}
          >Další →</button>
        </div>
      </div>
    </div>
  )
}

export default PaymentWizard


