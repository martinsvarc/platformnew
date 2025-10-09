import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { listPayments } from '../api/queries'
import { updatePayment, deletePayment } from '../api/payments'
import { useToast } from '../contexts/ToastContext'
import { formatCurrency } from '../utils/currency'
import PaymentEditModal from './PaymentEditModal'
import ConfirmDialog from './ConfirmDialog'

function PaymentManagement({ teamId }) {
  const { t, i18n } = useTranslation()
  const { toast } = useToast()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingPayment, setEditingPayment] = useState(null)
  const [deletingPayment, setDeletingPayment] = useState(null)
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    platform: 'all'
  })

  const formatAmount = (amount) => formatCurrency(amount, i18n.language)

  const loadPayments = useCallback(async () => {
    if (!teamId) return
    
    setLoading(true)
    try {
      const data = await listPayments(teamId, {
        from: filters.from || null,
        to: filters.to || null,
        platform: filters.platform !== 'all' ? filters.platform : null
      })
      setPayments(data)
    } catch (err) {
      console.error('Failed to load payments:', err)
      toast.error('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }, [teamId, filters, toast])

  useEffect(() => {
    loadPayments()
  }, [loadPayments])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const handleEdit = (payment) => {
    setEditingPayment(payment)
  }

  const handleSaveEdit = async (updates) => {
    if (!editingPayment) return
    
    try {
      await updatePayment(editingPayment.id, teamId, updates)
      toast.success('Payment updated successfully!')
      setEditingPayment(null)
      loadPayments()
    } catch (err) {
      console.error('Failed to update payment:', err)
      toast.error('Failed to update payment: ' + err.message)
    }
  }

  const handleDelete = (payment) => {
    setDeletingPayment(payment)
  }

  const confirmDelete = async () => {
    if (!deletingPayment) return
    
    try {
      await deletePayment(deletingPayment.id, teamId)
      toast.success('Payment deleted successfully!')
      setDeletingPayment(null)
      loadPayments()
    } catch (err) {
      console.error('Failed to delete payment:', err)
      toast.error('Failed to delete payment: ' + err.message)
    }
  }

  const formatDate = (dateValue) => {
    if (!dateValue) return '-'
    try {
      const date = new Date(dateValue)
      return date.toLocaleString(i18n.language === 'cs' ? 'cs-CZ' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (e) {
      return '-'
    }
  }

  return (
    <div className="unified-glass p-4">
      <h2 className="text-lg font-bold text-gradient-gold mb-4">
        Payment Management
      </h2>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div>
          <label className="block text-pearl/80 text-sm mb-1">From</label>
          <input
            type="date"
            name="from"
            value={filters.from}
            onChange={handleFilterChange}
            className="bg-obsidian border border-velvet-gray rounded-lg px-3 py-2 text-pearl focus:border-neon-orchid focus:shadow-glow-purple outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-pearl/80 text-sm mb-1">To</label>
          <input
            type="date"
            name="to"
            value={filters.to}
            onChange={handleFilterChange}
            className="bg-obsidian border border-velvet-gray rounded-lg px-3 py-2 text-pearl focus:border-neon-orchid focus:shadow-glow-purple outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-pearl/80 text-sm mb-1">Platform</label>
          <select
            name="platform"
            value={filters.platform}
            onChange={handleFilterChange}
            className="bg-obsidian border border-velvet-gray rounded-lg px-3 py-2 text-pearl focus:border-neon-orchid focus:shadow-glow-purple outline-none text-sm"
          >
            <option value="all">All</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="FB Stranka">FB Stranka</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className="text-pearl/70 text-center py-8">{t('common.loading')}</div>
      ) : (
        <div className="overflow-x-auto rounded-xl">
          <table className="w-full text-left text-sm text-pearl">
            <thead className="text-pearl/80 border-b border-velvet-gray">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Client</th>
                <th className="p-3">Chatter</th>
                <th className="p-3">Model</th>
                <th className="p-3">Sold</th>
                <th className="p-3">Platform</th>
                <th className="p-3">Bank</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-3 text-center text-pearl/60">
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-velvet-gray/60 hover:bg-velvet-gray/20 transition-colors"
                  >
                    <td className="p-3 whitespace-nowrap text-xs">
                      {formatDate(payment.paid_at)}
                    </td>
                    <td className="p-3 font-semibold whitespace-nowrap">
                      {formatAmount(payment.amount)}
                    </td>
                    <td className="p-3">{payment.client_name || '-'}</td>
                    <td className="p-3">{payment.chatter || '-'}</td>
                    <td className="p-3">{payment.model || '-'}</td>
                    <td className="p-3">{payment.prodano || '-'}</td>
                    <td className="p-3">
                      <span className="text-xs">
                        {payment.platforma === 'WhatsApp' && '📱 '}
                        {payment.platforma === 'FB Stranka' && '📘 '}
                        {payment.platforma === 'Other' && '🌐 '}
                        {payment.platforma || '-'}
                      </span>
                    </td>
                    <td className="p-3">{payment.banka || '-'}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(payment)}
                          className="px-3 py-1 rounded-lg bg-neon-orchid/20 text-neon-orchid hover:bg-neon-orchid hover:text-white transition-all text-xs font-semibold"
                          title="Edit payment"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(payment)}
                          className="px-3 py-1 rounded-lg bg-crimson/20 text-crimson hover:bg-crimson hover:text-white transition-all text-xs font-semibold"
                          title="Delete payment"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Info */}
      {payments.length > 0 && (
        <div className="mt-4 text-pearl/60 text-sm text-center">
          Showing {payments.length} payment{payments.length !== 1 ? 's' : ''} 
          {payments.length >= 500 && ' (limited to 500 most recent)'}
        </div>
      )}

      {/* Edit Modal */}
      {editingPayment && (
        <PaymentEditModal
          payment={editingPayment}
          teamId={teamId}
          onClose={() => setEditingPayment(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Delete Confirmation */}
      {deletingPayment && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Payment"
          message={`Are you sure you want to delete this payment of ${formatAmount(deletingPayment.amount)} from ${deletingPayment.client_name || 'unknown client'}? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={confirmDelete}
          onCancel={() => setDeletingPayment(null)}
          variant="danger"
        />
      )}
    </div>
  )
}

export default PaymentManagement

