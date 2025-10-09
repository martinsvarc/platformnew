import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { createPayment } from '../api/payments'
import { listBankAccounts } from '../api/banks'
import { listModels } from '../api/models'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

function PaymentForm() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    amount: '',
    client: '',
    newClient: '',
    sold: '',
    platform: 'Other',
    model: '',
    banka: ''
  })
  
  const [showNewClient, setShowNewClient] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [bankaOptions, setBankaOptions] = useState([])
  const [banksLoading, setBanksLoading] = useState(true)
  const [modelOptions, setModelOptions] = useState([])
  const [modelsLoading, setModelsLoading] = useState(true)

  const mockClients = [
    { id: 1, name: 'Jan Novák' },
    { id: 2, name: 'Jana Nováková' },
    { id: 3, name: 'Aleš Brown' },
    { id: 4, name: 'Marie' },
    { id: 5, name: 'David Wilson' }
  ]

  const amountPresets = [100, 200, 300, 500, 750, 1000, 1500, 2000, 5000]
  const platforms = ['WhatsApp', 'FB Stranka', 'Other']
  const soldOptions = ['obrázky', 'video', 'chat', 'dárek']
  const topClients = ['Jan Novák', 'Jana Nováková', 'Aleš Brown', 'Marie']

  // Load bank accounts from API
  useEffect(() => {
    const loadBanks = async () => {
      if (!user?.team_id) return
      setBanksLoading(true)
      try {
        const banks = await listBankAccounts(user.team_id)
        setBankaOptions(banks.map(b => b.name))
        // Set default to first bank if available
        if (banks.length > 0 && !formData.banka) {
          setFormData(prev => ({ ...prev, banka: banks[0].name }))
        }
      } catch (err) {
        console.error('Failed to load bank accounts:', err)
        // Fallback to default options
        setBankaOptions(['Other'])
      } finally {
        setBanksLoading(false)
      }
    }
    loadBanks()
  }, [user?.team_id])

  // Load models from API
  useEffect(() => {
    const loadModels = async () => {
      if (!user?.team_id) return
      setModelsLoading(true)
      try {
        const models = await listModels(user.team_id)
        setModelOptions(models.map(m => m.name))
      } catch (err) {
        console.error('Failed to load models:', err)
        // Fallback to empty
        setModelOptions([])
      } finally {
        setModelsLoading(false)
      }
    }
    loadModels()
  }, [user?.team_id])

  const filteredClients = mockClients.filter(client =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase())
  )

  const handleAmountPreset = (amount) => {
    setSelectedAmount(amount.toString())
    setFormData(prev => ({ ...prev, amount: amount.toString() }))
  }

  const handleCustomAmount = (e) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, amount: value }))
    setSelectedAmount('')
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleClientSearch = (e) => {
    const value = e.target.value
    setClientSearch(value)
    setShowClientDropdown(value.length > 0)
    setFormData(prev => ({ ...prev, client: value }))
  }

  const selectClient = (clientName) => {
    setFormData(prev => ({ ...prev, client: clientName }))
    setClientSearch(clientName)
    setShowClientDropdown(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (!user || !user.team_id || !user.id) {
        throw new Error('Uživatel není přihlášen nebo chybí informace o týmu')
      }
      
      const amount = Number(formData.amount)
      
      if (!amount || amount <= 0) {
        throw new Error('Neplatná částka')
      }
      
      const client = formData.newClient
        ? { name: formData.newClient }
        : (formData.client ? { name: formData.client } : null)
        
      await createPayment({
        teamId: user.team_id,
        userId: user.id,
        client,
        // paidAt will be automatically set to Prague timezone
        amount,
        currency: 'CZK',
        prodano: formData.sold,
        platforma: formData.platform,
        model: formData.model,
        banka: formData.banka,
      })
      
      toast.success('Platba úspěšně uložena!')
      
      // Reset form (keep first bank as default)
      setFormData({
        amount: '',
        client: '',
        newClient: '',
        sold: '',
        platform: 'Other',
        model: '',
        banka: bankaOptions.length > 0 ? bankaOptions[0] : ''
      })
      setSelectedAmount('')
      setShowNewClient(false)
      setClientSearch('')
      setShowClientDropdown(false)
    } catch (error) {
      console.error('Payment creation error:', error)
      toast.error('Uložení platby selhalo: ' + error.message)
    }
  }

  return (
    <div className="w-full p-2 md:p-4">
      <form onSubmit={handleSubmit} className="space-y-4 w-full">
        {/* Form Fields with Top-Aligned Labels */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-3 md:gap-4 xl:gap-6 w-full">
          {/* Amount Section */}
          <div className="lg:col-span-2">
            <h3 className="text-pearl font-semibold text-sm mb-2">Částka (CZK)</h3>
            {/* Preset Buttons - 3 columns */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              {amountPresets.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handleAmountPreset(amount)}
                  className={`py-2 px-2 rounded-lg font-semibold text-xs transition-all duration-300 transform hover:scale-105 ${
                    selectedAmount === amount.toString()
                      ? 'bg-gradient-to-r from-neon-orchid to-crimson text-white shadow-glow-purple'
                      : 'bg-obsidian border border-velvet-gray text-pearl hover:border-neon-orchid hover:shadow-glow hover:bg-charcoal'
                  }`}
                >
                  {amount}
                </button>
              ))}
            </div>
            
            {/* Custom Amount Input */}
            <input
              type="number"
              placeholder="Vlastní částka"
              value={formData.amount}
              onChange={handleCustomAmount}
              className="w-full py-2 px-3 rounded-lg bg-obsidian border border-velvet-gray text-pearl placeholder-pearl/50 focus:border-neon-orchid focus:shadow-glow-purple focus:outline-none transition-all duration-300 text-sm font-medium"
            />
          </div>

          {/* Client Section */}
          <div className="lg:col-span-1">
            <h3 className="text-pearl font-semibold text-sm mb-2">Klient</h3>
            {/* Top 4 Client Quick Options */}
            <div className="grid grid-cols-2 gap-1 mb-2">
              {topClients.map((client) => (
                <button
                  key={client}
                  type="button"
                  onClick={() => selectClient(client)}
                  className={`py-1 px-2 rounded-lg font-semibold text-xs transition-all duration-300 transform hover:scale-105 ${
                    formData.client === client
                      ? 'bg-gradient-to-r from-neon-orchid to-crimson text-white shadow-glow-purple'
                      : 'bg-obsidian border border-velvet-gray text-pearl hover:border-neon-orchid hover:shadow-glow hover:bg-charcoal'
                  }`}
                >
                  {client}
                </button>
              ))}
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Hledat klienta..."
                value={clientSearch}
                onChange={handleClientSearch}
                onFocus={() => setShowClientDropdown(true)}
                className="w-full py-2 px-3 rounded-lg bg-obsidian border border-velvet-gray text-pearl placeholder-pearl/50 focus:border-neon-orchid focus:shadow-glow-purple focus:outline-none transition-all duration-300 text-sm font-medium"
              />
              
              {/* Client Dropdown */}
              {showClientDropdown && filteredClients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-obsidian border border-neon-orchid rounded-lg shadow-xl max-h-32 overflow-y-auto">
                  {filteredClients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => selectClient(client.name)}
                      className="w-full text-left py-2 px-3 text-pearl hover:bg-velvet-gray transition-colors duration-200 text-sm font-medium first:rounded-t-lg last:rounded-b-lg"
                    >
                      {client.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button
              type="button"
              onClick={() => setShowNewClient(!showNewClient)}
              className="w-full mt-2 py-1 px-2 rounded-lg bg-velvet-gray text-pearl hover:bg-smoke hover:shadow-glow transition-all duration-300 text-xs font-medium"
            >
              {showNewClient ? 'Zrušit' : '+ Nový Klient'}
            </button>
            
            {showNewClient && (
              <input
                type="text"
                name="newClient"
                placeholder="Jméno nového klienta"
                value={formData.newClient}
                onChange={handleInputChange}
                className="w-full mt-2 py-2 px-3 rounded-lg bg-obsidian border border-velvet-gray text-pearl placeholder-pearl/50 focus:border-neon-orchid focus:shadow-glow-purple focus:outline-none transition-all duration-300 text-sm font-medium"
              />
            )}
          </div>

          {/* Sold Section */}
          <div className="lg:col-span-1">
            <h3 className="text-pearl font-semibold text-sm mb-2">Prodáno</h3>
            {/* Quick Sold Options */}
            <div className="grid grid-cols-2 gap-1 mb-2">
              {soldOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, sold: option }))}
                  className={`py-1 px-2 rounded-lg font-semibold text-xs transition-all duration-300 transform hover:scale-105 ${
                    formData.sold === option
                      ? 'bg-gradient-to-r from-neon-orchid to-crimson text-white shadow-glow-purple'
                      : 'bg-obsidian border border-velvet-gray text-pearl hover:border-neon-orchid hover:shadow-glow hover:bg-charcoal'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            
            <input
              type="text"
              name="sold"
              placeholder="Co bylo prodáno?"
              value={formData.sold}
              onChange={handleInputChange}
              className="w-full py-2 px-3 rounded-lg bg-obsidian border border-velvet-gray text-pearl placeholder-pearl/50 focus:border-neon-orchid focus:shadow-glow-purple focus:outline-none transition-all duration-300 text-sm font-medium"
            />
          </div>

          {/* Platform Section */}
          <div className="lg:col-span-1">
            <h3 className="text-pearl font-semibold text-sm mb-2">Platforma</h3>
            <div className="space-y-1">
              {platforms.map((platform) => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, platform }))}
                  className={`w-full py-2 px-3 rounded-lg font-semibold text-xs transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-1 ${
                    formData.platform === platform
                      ? 'bg-gradient-to-r from-neon-orchid to-crimson text-white shadow-glow-purple'
                      : 'bg-obsidian border border-velvet-gray text-pearl hover:border-neon-orchid hover:shadow-glow hover:bg-charcoal'
                  }`}
                >
                  {platform === 'WhatsApp' && (
                    <span className="text-sm">📱</span>
                  )}
                  {platform === 'FB Stranka' && (
                    <span className="text-sm">📘</span>
                  )}
                  {platform === 'Other' && (
                    <span className="text-sm">🌐</span>
                  )}
                  <span>{platform}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Model Section */}
          <div className="lg:col-span-1">
            <h3 className="text-pearl font-semibold text-sm mb-2">Model</h3>
            {modelsLoading ? (
              <div className="text-pearl/60 text-xs text-center py-3">{t('common.loading')}</div>
            ) : (
              <div className="space-y-1">
                {modelOptions.length === 0 ? (
                  <div className="text-pearl/60 text-xs text-center py-3">
                    Žádné modelky. Přidejte je v Admin.
                  </div>
                ) : (
                  modelOptions.map((model) => (
                    <button
                      key={model}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, model }))}
                      className={`w-full py-2 px-3 rounded-lg font-semibold text-xs transition-all duration-300 transform hover:scale-105 ${
                        formData.model === model
                          ? 'bg-gradient-to-r from-neon-orchid to-crimson text-white shadow-glow-purple'
                          : 'bg-obsidian border border-velvet-gray text-pearl hover:border-neon-orchid hover:shadow-glow hover:bg-charcoal'
                      }`}
                    >
                      {model}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Banka Section */}
          <div className="lg:col-span-1">
            <h3 className="text-pearl font-semibold text-sm mb-2">Banka</h3>
            {banksLoading ? (
              <div className="text-pearl/60 text-xs text-center py-3">{t('common.loading')}</div>
            ) : (
              <div className="space-y-1">
                {bankaOptions.length === 0 ? (
                  <div className="text-pearl/60 text-xs text-center py-3">
                    Žádné účty. Přidejte je v Admin.
                  </div>
                ) : (
                  bankaOptions.map((banka) => (
                    <button
                      key={banka}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, banka }))}
                      className={`w-full py-2 px-3 rounded-lg font-semibold text-xs transition-all duration-300 transform hover:scale-105 ${
                        formData.banka === banka
                          ? 'bg-gradient-to-r from-neon-orchid to-crimson text-white shadow-glow-purple'
                          : 'bg-obsidian border border-velvet-gray text-pearl hover:border-neon-orchid hover:shadow-glow hover:bg-charcoal'
                      }`}
                    >
                      {banka}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-2">
          <button
            type="submit"
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-neon-orchid to-crimson text-white font-bold text-lg hover:shadow-glow-purple hover:scale-105 transition-all duration-300 transform shadow-xl flex items-center space-x-2"
          >
            <span>✓</span>
            <span>Odeslat</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export default PaymentForm
