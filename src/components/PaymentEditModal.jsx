import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { listBankAccounts } from '../api/banks'
import { listModels } from '../api/models'
import { getTeamUsers } from '../api/queries'

function PaymentEditModal({ payment, onClose, onSave, teamId }) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    amount: '',
    client: '',
    prodano: '',
    platforma: 'Other',
    model: '',
    banka: '',
    chatter: '',
    paidAt: ''
  })
  
  const [bankaOptions, setBankaOptions] = useState([])
  const [modelOptions, setModelOptions] = useState([])
  const [chatterOptions, setChatterOptions] = useState([])
  const [loading, setLoading] = useState(true)

  // Load options and payment data
  useEffect(() => {
    const loadOptions = async () => {
      if (!teamId) return
      
      setLoading(true)
      try {
        const [banks, models, users] = await Promise.all([
          listBankAccounts(teamId),
          listModels(teamId),
          getTeamUsers(teamId)
        ])
        
        setBankaOptions(banks.map(b => b.name))
        setModelOptions(models.map(m => m.name))
        setChatterOptions(users.map(u => ({
          id: u.id,
          name: u.display_name || u.username
        })))
        
        // Set form data from payment
        if (payment) {
          // Use user_id if available, otherwise find by chatter name
          let chatterId = payment.user_id || ''
          if (!chatterId && payment.chatter) {
            const chatterUser = users.find(u => 
              (u.display_name || u.username) === payment.chatter
            )
            chatterId = chatterUser?.id || ''
          }
          
          // Format date for datetime-local input
          let formattedDate = ''
          if (payment.paid_at) {
            try {
              const date = new Date(payment.paid_at)
              // Convert to local timezone for display
              const year = date.getFullYear()
              const month = String(date.getMonth() + 1).padStart(2, '0')
              const day = String(date.getDate()).padStart(2, '0')
              const hours = String(date.getHours()).padStart(2, '0')
              const minutes = String(date.getMinutes()).padStart(2, '0')
              formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`
            } catch (e) {
              console.error('Error formatting date:', e)
            }
          }
          
          setFormData({
            amount: payment.amount?.toString() || '',
            client: payment.client_name || '',
            prodano: payment.prodano || '',
            platforma: payment.platforma || 'Other',
            model: payment.model || '',
            banka: payment.banka || '',
            chatter: chatterId,
            paidAt: formattedDate
          })
        }
      } catch (err) {
        console.error('Failed to load options:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadOptions()
  }, [teamId, payment])

  const platforms = ['WhatsApp', 'FB Stranka', 'Other']
  const soldOptions = ['obrázky', 'video', 'chat', 'dárek']

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.amount || Number(formData.amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }
    
    // Convert datetime-local to ISO string if provided
    let paidAtISO
    if (formData.paidAt) {
      const date = new Date(formData.paidAt)
      paidAtISO = date.toISOString()
    }
    
    onSave({
      amount: Number(formData.amount),
      client: formData.client ? { name: formData.client } : null,
      prodano: formData.prodano,
      platforma: formData.platforma,
      model: formData.model,
      banka: formData.banka,
      userId: formData.chatter || null,
      paidAt: paidAtISO
    })
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="unified-glass p-6 max-w-2xl w-full">
          <div className="text-pearl text-center">{t('common.loading')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="unified-glass p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gradient-gold">
            Edit Payment
          </h2>
          <button
            onClick={onClose}
            className="text-pearl/60 hover:text-pearl text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-pearl font-semibold text-sm mb-2">
              Amount (CZK)
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              required
              className="w-full py-2 px-3 rounded-lg bg-obsidian border border-velvet-gray text-pearl placeholder-pearl/50 focus:border-neon-orchid focus:shadow-glow-purple focus:outline-none"
            />
          </div>

          {/* Client */}
          <div>
            <label className="block text-pearl font-semibold text-sm mb-2">
              Client
            </label>
            <input
              type="text"
              name="client"
              value={formData.client}
              onChange={handleInputChange}
              placeholder="Client name"
              className="w-full py-2 px-3 rounded-lg bg-obsidian border border-velvet-gray text-pearl placeholder-pearl/50 focus:border-neon-orchid focus:shadow-glow-purple focus:outline-none"
            />
          </div>

          {/* Chatter */}
          <div>
            <label className="block text-pearl font-semibold text-sm mb-2">
              Chatter
            </label>
            <select
              name="chatter"
              value={formData.chatter}
              onChange={handleInputChange}
              className="w-full py-2 px-3 rounded-lg bg-obsidian border border-velvet-gray text-pearl focus:border-neon-orchid focus:shadow-glow-purple focus:outline-none"
            >
              <option value="">Select chatter...</option>
              {chatterOptions.map((chatter) => (
                <option key={chatter.id} value={chatter.id}>
                  {chatter.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div>
            <label className="block text-pearl font-semibold text-sm mb-2">
              Date & Time
            </label>
            <input
              type="datetime-local"
              name="paidAt"
              value={formData.paidAt}
              onChange={handleInputChange}
              className="w-full py-2 px-3 rounded-lg bg-obsidian border border-velvet-gray text-pearl focus:border-neon-orchid focus:shadow-glow-purple focus:outline-none"
            />
          </div>

          {/* Sold */}
          <div>
            <label className="block text-pearl font-semibold text-sm mb-2">
              Sold (Prodáno)
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {soldOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, prodano: option }))}
                  className={`py-2 px-2 rounded-lg font-semibold text-xs transition-all ${
                    formData.prodano === option
                      ? 'bg-gradient-to-r from-neon-orchid to-crimson text-white shadow-glow-purple'
                      : 'bg-obsidian border border-velvet-gray text-pearl hover:border-neon-orchid'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <input
              type="text"
              name="prodano"
              value={formData.prodano}
              onChange={handleInputChange}
              placeholder="What was sold?"
              className="w-full py-2 px-3 rounded-lg bg-obsidian border border-velvet-gray text-pearl placeholder-pearl/50 focus:border-neon-orchid focus:shadow-glow-purple focus:outline-none"
            />
          </div>

          {/* Platform */}
          <div>
            <label className="block text-pearl font-semibold text-sm mb-2">
              Platform
            </label>
            <div className="grid grid-cols-3 gap-2">
              {platforms.map((platform) => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, platforma: platform }))}
                  className={`py-2 px-3 rounded-lg font-semibold text-xs transition-all ${
                    formData.platforma === platform
                      ? 'bg-gradient-to-r from-neon-orchid to-crimson text-white shadow-glow-purple'
                      : 'bg-obsidian border border-velvet-gray text-pearl hover:border-neon-orchid'
                  }`}
                >
                  {platform === 'WhatsApp' && '📱 '}
                  {platform === 'FB Stranka' && '📘 '}
                  {platform === 'Other' && '🌐 '}
                  {platform}
                </button>
              ))}
            </div>
          </div>

          {/* Model */}
          <div>
            <label className="block text-pearl font-semibold text-sm mb-2">
              Model
            </label>
            <select
              name="model"
              value={formData.model}
              onChange={handleInputChange}
              className="w-full py-2 px-3 rounded-lg bg-obsidian border border-velvet-gray text-pearl focus:border-neon-orchid focus:shadow-glow-purple focus:outline-none"
            >
              <option value="">Select model...</option>
              {modelOptions.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>

          {/* Bank */}
          <div>
            <label className="block text-pearl font-semibold text-sm mb-2">
              Bank (Banka)
            </label>
            <select
              name="banka"
              value={formData.banka}
              onChange={handleInputChange}
              className="w-full py-2 px-3 rounded-lg bg-obsidian border border-velvet-gray text-pearl focus:border-neon-orchid focus:shadow-glow-purple focus:outline-none"
            >
              <option value="">Select bank...</option>
              {bankaOptions.map((banka) => (
                <option key={banka} value={banka}>
                  {banka}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-velvet-gray text-pearl hover:bg-smoke transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-neon-orchid to-crimson text-white font-bold hover:shadow-glow-purple transition-all"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PaymentEditModal

