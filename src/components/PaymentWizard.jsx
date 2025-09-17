import { useEffect, useMemo, useState } from 'react'
import Confetti from 'react-confetti'
import { createPayment } from '../api/payments'
import { TEAM_ID, USER_ID } from '../api/config'

function PaymentWizard() {
  const amountPresets = [100, 200, 300, 500, 750, 1000, 1500, 2000, 5000]
  const platforms = ['WhatsApp', 'FB Stranka', 'Other']
  const models = ['Natálie', 'Nastya', 'Isabella', 'Eliška', 'Other']
  const bankaOptions = ['Raif - Maty', 'Raif - Tisa', 'Fio - Martin', 'Paysafe', 'Other']
  const topClients = ['Jan Novák', 'Jana Nováková', 'Aleš Brown', 'Marie']
  const mockClients = useMemo(() => [
    { id: 1, name: 'Jan Novák' },
    { id: 2, name: 'Jana Nováková' },
    { id: 3, name: 'Aleš Brown' },
    { id: 4, name: 'Marie' },
    { id: 5, name: 'David Wilson' }
  ], [])

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
    banka: ''
  })
  const [clientSearch, setClientSearch] = useState('')
  const [showNewClient, setShowNewClient] = useState(false)
  const [isFading, setIsFading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [isEntering, setIsEntering] = useState(true)

  const canNext = () => {
    switch (step) {
      case 1: return Boolean(form.amount)
      case 2: return Boolean(form.client || form.newClient)
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

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase()
    if (!q) return mockClients
    return mockClients.filter(c => c.name.toLowerCase().includes(q))
  }, [clientSearch, mockClients])

  const handleConfirm = async () => {
    try {
      const paidAt = new Date().toISOString()
      const amount = Number(form.amount)
      const client = form.newClient
        ? { name: form.newClient, email: form.newClientEmail, phone: form.newClientPhone, notes: form.newClientNotes }
        : (form.client ? { name: form.client } : null)
      await createPayment({
        teamId: TEAM_ID,
        userId: USER_ID,
        client,
        paidAt,
        amount,
        currency: 'CZK',
        prodano: form.sold,
        platforma: form.platform,
        model: form.model,
        banka: form.banka,
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
          banka: ''
        })
        setClientSearch('')
        setShowNewClient(false)
        setStep(1)
        setIsFading(false)
        setTimeout(() => setShowConfetti(false), 400)
      }, 900)
    } catch (e) {
      alert('Uložení platby selhalo. Zkontrolujte připojení a údaje.')
      // eslint-disable-next-line no-console
      console.error(e)
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
  const cardBase = 'w-full bg-gradient-to-br from-neon-orchid/10 via-obsidian/85 to-crimson/10 border border-neon-orchid/30 rounded-2xl p-6 shadow-[0_0_20px_rgba(255,105,180,0.35)] relative backdrop-blur-sm'
  const gridButtons = 'grid grid-cols-3 gap-3'
  const btn = 'py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105'
  const btnActive = 'bg-gradient-to-r from-neon-orchid to-crimson text-white shadow-glow-purple ring-2 ring-[rgba(255,204,0,0.5)] shadow-[0_0_8px_rgba(255,215,0,0.6)]'
  const btnIdle = 'bg-obsidian border border-velvet-gray text-pearl hover:border-neon-orchid hover:shadow-glow hover:bg-charcoal'

  return (
    <div className="h-screen w-full flex items-center justify-center overflow-hidden">
      <div className={containerBase}>
        {renderStepHeader()}

        <div className={`${cardBase} transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}
          style={{
            minHeight: '420px'
          }}
        >
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
              <input
                type="text"
                placeholder="Hledat nebo zadat klienta..."
                value={clientSearch}
                onChange={(e) => { setClientSearch(e.target.value); setForm(f => ({ ...f, client: e.target.value, newClient: '' })) }}
                className="w-full py-3 px-4 rounded-xl bg-obsidian border border-velvet-gray focus:border-neon-orchid focus:shadow-glow-purple outline-none"
              />
              <button
                className={`${btn} w-full ${showNewClient ? btnActive : btnIdle}`}
                onClick={() => setShowNewClient(v => !v)}
              >{showNewClient ? 'Zrušit' : '+ Nový Klient'}</button>
              {showNewClient && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Jméno a příjmení"
                    value={form.newClient}
                    onChange={(e) => setForm(f => ({ ...f, newClient: e.target.value, client: '' }))}
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
                  <textarea
                    placeholder="Poznámky"
                    value={form.newClientNotes}
                    onChange={(e) => setForm(f => ({ ...f, newClientNotes: e.target.value }))}
                    className="md:col-span-3 w-full min-h-[84px] py-3 px-4 rounded-xl bg-obsidian border border-velvet-gray focus:border-neon-orchid focus:shadow-glow-purple outline-none"
                  />
                  <div className="md:col-span-3 flex justify-end">
                    <button
                      className={`${btn} ${btnActive}`}
                      onClick={() => {
                        if (form.newClient) {
                          setForm(f => ({ ...f, client: f.newClient }))
                          setShowNewClient(false)
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
              <div className="space-y-3">
                {models.map(m => (
                  <button key={m} className={`${btn} w-full ${form.model === m ? btnActive : btnIdle}`}
                    onClick={() => setForm(f => ({ ...f, model: m }))}>{m}</button>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div className="text-center text-lg font-medium">Banka</div>
              <div className="space-y-3">
                {bankaOptions.map(b => (
                  <button key={b} className={`${btn} w-full ${form.banka === b ? btnActive : btnIdle}`}
                    onClick={() => setForm(f => ({ ...f, banka: b }))}>{b}</button>
                ))}
              </div>
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
              <button
                onClick={handleConfirm}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-neon-orchid to-crimson text-white font-bold text-xl hover:shadow-glow-purple hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3"
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
            className={`px-5 py-3 rounded-xl font-semibold transition-all ${step === 1 ? 'opacity-40 cursor-not-allowed bg-velvet-gray text-pearl' : 'bg-obsidian border border-velvet-gray text-pearl hover:border-neon-orchid hover:shadow-glow hover:bg-charcoal'}`}
          >← Předchozí</button>
          <button
            onClick={next}
            disabled={!canNext() || step === 7}
            className={`px-5 py-3 rounded-xl font-semibold transition-all ${(!canNext() || step === 7) ? 'opacity-40 cursor-not-allowed bg-velvet-gray text-pearl' : 'bg-gradient-to-r from-neon-orchid to-crimson text-white hover:shadow-glow-purple hover:scale-105'}`}
          >Další →</button>
        </div>
      </div>
    </div>
  )
}

export default PaymentWizard


