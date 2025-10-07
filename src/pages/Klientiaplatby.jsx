import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { listClients, updateClient, listPayments, debugRecentPayments, debugClientPaymentStats } from '../api/queries'
import { TEAM_ID } from '../api/config'
import TableSkeleton from '../components/TableSkeleton'
import { useToast } from '../contexts/ToastContext'

function Klientiaplatby() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('klienti')
  const [searchQuery, setSearchQuery] = useState('')
  const [lastSentFilter, setLastSentFilter] = useState('all') // all | today | 3 | 7 | 30 | older
  const [salaryFilter, setSalaryFilter] = useState('all') // all | has | none
  const [payoutDayFilter, setPayoutDayFilter] = useState('all') // all | 1..31
  const [chatterFilter, setChatterFilter] = useState('all') // all | specific chatter name
  const [sortBy, setSortBy] = useState('lastSentDesc') // lastSentDesc | lastSentAsc | lastMonthDesc | totalDesc | nameAsc
  const [notesMap, setNotesMap] = useState({})
  const [notesModal, setNotesModal] = useState({ open: false, row: null, text: '' })
  const [expandedClient, setExpandedClient] = useState(null) // jmeno | null
  const [emailMap, setEmailMap] = useState({})
  const [phoneMap, setPhoneMap] = useState({})
  const [emailModal, setEmailModal] = useState({ open: false, jmeno: null, value: '' })
  const [phoneModal, setPhoneModal] = useState({ open: false, jmeno: null, value: '' })
  const [salaryMap, setSalaryMap] = useState({})
  const [banksModal, setBanksModal] = useState({ open: false, jmeno: null, banks: [] })

  const [klientiData, setKlientiData] = useState([])
  const [klientiLoading, setKlientiLoading] = useState(true)
  
  const loadClientData = useCallback(async () => {
    if (!TEAM_ID) {
      setKlientiLoading(false)
      return
    }
    setKlientiLoading(true)
    try {
      const rows = await listClients(TEAM_ID)
      
      // Group clients by name (case-insensitive) to merge duplicates
      const clientMap = new Map()
      rows.forEach(r => {
        console.log('Processing client row:', r)
        const nameKey = r.name.toLowerCase()
        if (clientMap.has(nameKey)) {
          // Merge with existing client
          const existing = clientMap.get(nameKey)
          console.log('Merging with existing client:', existing.jmeno, 'lastMonth:', existing.lastMonth, 'new:', r.last_month)
          existing.ids.push(r.id)
          existing.lastSent = existing.lastSent || r.last_sent || ''
          existing.lastMonth = (existing.lastMonth || 0) + (r.last_month || 0)
          existing.total = (existing.total || 0) + (r.total || 0)
          console.log('After merge - lastMonth:', existing.lastMonth, 'total:', existing.total)
          // Keep non-empty values
          if (!existing.email && r.email) existing.email = r.email
          if (!existing.phone && r.phone) existing.phone = r.phone
          if (!existing.vyplata && r.vyplata) existing.vyplata = r.vyplata
          if (!existing.poznamky && r.notes) existing.poznamky = r.notes
          if (!existing.chatter && r.last_chatter) existing.chatter = r.last_chatter
        } else {
          // Create new client entry
          console.log('Creating new client:', r.name, 'lastMonth:', r.last_month, 'total:', r.total)
          clientMap.set(nameKey, {
            id: r.id,
            ids: [r.id],
            jmeno: r.name,
            vyplata: r.vyplata ? Number(r.vyplata) : '',
            poznamky: r.notes || '',
            email: r.email || '',
            phone: r.phone || '',
            lastSent: r.last_sent || '',
            lastMonth: r.last_month || 0,
            total: r.total || 0,
            chatter: r.last_chatter || '',
            transakce: []
          })
        }
      })
      
      setKlientiData(Array.from(clientMap.values()))
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Načtení klientů selhalo', e)
    } finally {
      setKlientiLoading(false)
    }
  }, [TEAM_ID])

  useEffect(() => {
    loadClientData()
  }, [loadClientData])

  const [platbyData, setPlatbyData] = useState([])
  const [platbyLoading, setPlatbyLoading] = useState(true)
  
  const loadPaymentData = useCallback(async () => {
    if (!TEAM_ID) {
      setPlatbyLoading(false)
      return
    }
    setPlatbyLoading(true)
    try {
      const rows = await listPayments(TEAM_ID)
      
      // Debug: Check what we're getting from the database
      console.log('Raw payment rows from database:', rows)
      await debugRecentPayments(TEAM_ID)
      await debugClientPaymentStats(TEAM_ID)
      
      setPlatbyData(rows.map(r => ({
        id: r.id,
        castka: r.amount,
        klient: r.client_name || '',
        prodano: r.prodano || '',
        platforma: r.platforma || '',
        modelka: r.model || '',
        banka: r.banka || '',
        prislo: r.status === 'completed',
        doruceno: true,
        date: r.paid_date || r.paid_at,
        chatter: r.chatter || ''
      })))
      
      // Also refresh client data when payments are loaded to get updated statistics
      await loadClientData()
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Načtení plateb selhalo', e)
    } finally {
      setPlatbyLoading(false)
    }
  }, [TEAM_ID, loadClientData])

  useEffect(() => {
    loadPaymentData()
  }, [loadPaymentData])

  // Platby filters
  const [platbySearchQuery, setPlatbySearchQuery] = useState('')
  const [platbyPeriod, setPlatbyPeriod] = useState('7') // 'today' | '7' | '30' | 'custom'
  const [platbyChatter, setPlatbyChatter] = useState('all')
  const [platbyPlatform, setPlatbyPlatform] = useState('all')
  const [platbyModel, setPlatbyModel] = useState('all')
  const [platbyBank, setPlatbyBank] = useState('all')
  const [periodFrom, setPeriodFrom] = useState('')
  const [periodTo, setPeriodTo] = useState('')

  const uniqueChatters = useMemo(() => {
    return Array.from(new Set(platbyData.map((p) => p.chatter))).filter(Boolean)
  }, [platbyData])

  const uniqueModels = useMemo(() => {
    return Array.from(new Set(platbyData.map((p) => p.modelka))).filter(Boolean)
  }, [platbyData])

  const uniqueBanks = useMemo(() => {
    return Array.from(new Set(platbyData.map((p) => p.banka))).filter(Boolean)
  }, [platbyData])

  const filteredPlatby = useMemo(() => {
    let list = [...platbyData]

    // Search filter (by client name)
    if (platbySearchQuery.trim()) {
      const query = platbySearchQuery.toLowerCase()
      list = list.filter((p) => p.klient.toLowerCase().includes(query))
    }

    // Period filter
    const parse = (d) => new Date(d + 'T00:00:00')
    const today = new Date()
    let start = null
    let end = null
    if (platbyPeriod === '7') {
      start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (platbyPeriod === '30') {
      start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    } else if (platbyPeriod === 'today') {
      const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      start = t0
      end = t0
    } else if (platbyPeriod === 'custom') {
      start = periodFrom ? parse(periodFrom) : null
      end = periodTo ? parse(periodTo) : null
    }
    list = list.filter((p) => {
      const d = parse(p.date)
      if (start && d < start) return false
      if (end && d > end) return false
      return true
    })

    // Chatter filter
    if (platbyChatter !== 'all') {
      list = list.filter((p) => p.chatter === platbyChatter)
    }

    // Platform filter
    if (platbyPlatform !== 'all') {
      list = list.filter((p) => p.platforma === platbyPlatform)
    }

    // Model filter
    if (platbyModel !== 'all') {
      list = list.filter((p) => p.modelka === platbyModel)
    }

    // Bank filter
    if (platbyBank !== 'all') {
      list = list.filter((p) => p.banka === platbyBank)
    }

    return list
  }, [platbyData, platbySearchQuery, platbyPeriod, periodFrom, periodTo, platbyChatter, platbyPlatform, platbyModel, platbyBank])

  const totalPlatbyCZK = useMemo(() => {
    return filteredPlatby.reduce((sum, p) => sum + (p.castka || 0), 0)
  }, [filteredPlatby])

  const handleEmailClick = (e, row) => {
    e.stopPropagation()
    const current = emailMap[row.jmeno] ?? row.email ?? ''
    setEmailModal({ open: true, jmeno: row.jmeno, value: current })
    setPhoneModal({ open: false, jmeno: null, value: '' })
  }

  const handlePhoneClick = (e, row) => {
    e.stopPropagation()
    const current = phoneMap[row.jmeno] ?? row.phone ?? ''
    setPhoneModal({ open: true, jmeno: row.jmeno, value: current })
    setEmailModal({ open: false, jmeno: null, value: '' })
  }

  const saveEmail = async () => {
    if (!emailModal.jmeno) return
    const row = klientiData.find(r => r.jmeno === emailModal.jmeno)
    try {
      if (row?.id) await updateClient(TEAM_ID, row.id, { email: emailModal.value })
      setEmailMap((prev) => ({ ...prev, [emailModal.jmeno]: emailModal.value }))
      toast.success('Email byl úspěšně uložen')
    } catch (e) {
      toast.error('Uložení emailu selhalo')
    }
    setEmailModal({ open: false, jmeno: null, value: '' })
  }

  const savePhone = async () => {
    if (!phoneModal.jmeno) return
    const row = klientiData.find(r => r.jmeno === phoneModal.jmeno)
    try {
      if (row?.id) await updateClient(TEAM_ID, row.id, { phone: phoneModal.value })
      setPhoneMap((prev) => ({ ...prev, [phoneModal.jmeno]: phoneModal.value }))
      toast.success('Telefon byl úspěšně uložen')
    } catch (e) {
      toast.error('Uložení telefonu selhalo')
    }
    setPhoneModal({ open: false, jmeno: null, value: '' })
  }

  const saveSalary = async (jmeno, value) => {
    const row = klientiData.find(r => r.jmeno === jmeno)
    try {
      if (row?.id) await updateClient(TEAM_ID, row.id, { vyplata: value })
      setSalaryMap((prev) => ({ ...prev, [jmeno]: value }))
      toast.success('Výplata byla úspěšně uložena')
    } catch (e) {
      toast.error('Uložení výplaty selhalo')
    }
  }

  const openBanksModal = (jmeno) => {
    const clientPayments = platbyData.filter(p => p.klient === jmeno)
    const uniqueBanks = [...new Set(clientPayments.map(p => p.banka).filter(Boolean))]
    setBanksModal({ open: true, jmeno, banks: uniqueBanks })
  }

  const closeBanksModal = () => setBanksModal({ open: false, jmeno: null, banks: [] })

  const loadClientTransactions = async (clientName) => {
    try {
      const clientPayments = platbyData.filter(p => p.klient === clientName)
      const transactions = clientPayments.map(p => ({
        datum: p.date,
        castka: p.castka,
        chatter: p.chatter,
        model: p.modelka,
        banka: p.banka,
        platforma: p.platforma,
        prodano: p.prodano
      }))
      
      // Update the client's transactions
      setKlientiData(prev => prev.map(client => 
        client.jmeno === clientName 
          ? { ...client, transakce: transactions }
          : client
      ))
    } catch (e) {
      console.error('Failed to load client transactions:', e)
    }
  }

  const openNotes = (row) => {
    const existing = notesMap[row.jmeno] ?? row.poznamky ?? ''
    setNotesModal({ open: true, row, text: existing })
  }

  const closeNotes = () => setNotesModal({ open: false, row: null, text: '' })

  const saveNotes = async () => {
    if (!notesModal.row) return
    const row = klientiData.find(r => r.jmeno === notesModal.row.jmeno)
    try {
      if (row?.id) await updateClient(TEAM_ID, row.id, { notes: notesModal.text })
      setNotesMap((prev) => ({ ...prev, [notesModal.row.jmeno]: notesModal.text }))
      toast.success('Poznámky byly úspěšně uloženy')
    } catch (e) {
      toast.error('Uložení poznámek selhalo')
    }
    closeNotes()
  }

  const formatRelative = (isoDate) => {
    try {
      const d = new Date(isoDate)
      const now = new Date()
      const diffMs = now.setHours(0,0,0,0) - d.setHours(0,0,0,0)
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      if (days <= 0) return 'dnes'
      if (days === 1) return 'před 1 dnem'
      return `před ${days} dny`
    } catch {
      return isoDate
    }
  }

  const daysSince = (isoDate) => {
    try {
      const d = new Date(isoDate)
      const now = new Date()
      const diffMs = now.setHours(0,0,0,0) - d.setHours(0,0,0,0)
      return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
    } catch {
      return 9999
    }
  }

  // Green (today) → red (older) color based on days
  const heatColor = (days) => {
    const clamped = Math.min(Math.max(days, 0), 30)
    const hue = 120 - (clamped * 120) / 30 // 120→0 (green→red)
    return `hsl(${hue} 70% 35%)`
  }

  const filteredAndSortedClients = useMemo(() => {
    let list = [...klientiData]

    // Search by name
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((r) => r.jmeno.toLowerCase().includes(q))
    }

    // Filter by last sent window
    list = list.filter((r) => {
      const d = daysSince(r.lastSent)
      if (lastSentFilter === 'today') return d <= 0
      if (lastSentFilter === '3') return d <= 3
      if (lastSentFilter === '7') return d <= 7
      if (lastSentFilter === '30') return d <= 30
      if (lastSentFilter === 'older') return d > 30
      return true
    })

    // Salary filter (has vyplata set)
    list = list.filter((r) => {
      const has = r.vyplata && (Number(r.vyplata) > 0 || String(r.vyplata).trim() !== "")
      if (salaryFilter === 'has') return has
      if (salaryFilter === 'none') return !has
      return true
    })

    // Payout day filter (Výplata 1-31)
    if (payoutDayFilter !== 'all') {
      const day = parseInt(payoutDayFilter, 10)
      list = list.filter((r) => Number(r.vyplata) === day || String(r.vyplata) === String(day))
    }

    // Chatter filter
    if (chatterFilter !== 'all') {
      list = list.filter((r) => r.chatter === chatterFilter)
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'lastSentDesc') return daysSince(a.lastSent) - daysSince(b.lastSent) // newer first (smaller days)
      if (sortBy === 'lastSentAsc') return daysSince(b.lastSent) - daysSince(a.lastSent)
      if (sortBy === 'lastMonthDesc') return (b.lastMonth || 0) - (a.lastMonth || 0)
      if (sortBy === 'totalDesc') return (b.total || 0) - (a.total || 0)
      if (sortBy === 'nameAsc') return a.jmeno.localeCompare(b.jmeno, 'cs')
      return 0
    })

    return list
  }, [klientiData, searchQuery, lastSentFilter, salaryFilter, payoutDayFilter, chatterFilter, sortBy])

  const uniqueClientChatters = useMemo(() => {
    return Array.from(new Set(klientiData.map((c) => c.chatter))).filter(Boolean)
  }, [klientiData])

  return (
    <div className="h-screen overflow-y-auto p-2 sm:p-3 md:p-4 lg:p-6 lg:ml-64 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gradient-primary mb-1">
            Klienti a Platby
          </h1>
          <p className="text-pearl/70 text-xs sm:text-sm">
            Přepínejte mezi seznamem klientů a přehledem plateb
          </p>
        </div>
        {/* Tabs */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('klienti')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold smooth-hover ${
              activeTab === 'klienti'
                ? 'bg-gradient-to-r from-neon-orchid to-crimson text-white shadow-glow-purple'
                : 'bg-velvet-gray text-pearl hover:shadow-glow'
            }`}
          >
            Klienti
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('platby')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold smooth-hover ${
              activeTab === 'platby'
                ? 'bg-gradient-to-r from-neon-orchid to-crimson text-white shadow-glow-purple'
                : 'bg-velvet-gray text-pearl hover:shadow-glow'
            }`}
          >
            Platby
          </button>
        </div>

        {/* Klienti Toolbar */}
        {activeTab === 'klienti' && (
          <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            <input
              type="text"
              placeholder="Hledat klienta..."
              className="bg-obsidian border border-velvet-gray rounded-lg px-3 py-2 text-pearl placeholder-pearl/50 focus:border-neon-orchid focus:shadow-glow-purple outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              className="bg-obsidian border border-velvet-gray rounded-lg px-3 py-2 text-pearl focus:border-neon-orchid focus:shadow-glow-purple outline-none"
              value={lastSentFilter}
              onChange={(e) => setLastSentFilter(e.target.value)}
              title="Filtrovat podle poslední platby"
            >
              <option value="all">Vše</option>
              <option value="today">Dnes</option>
              <option value="3">Do 3 dnů</option>
              <option value="7">Do 7 dnů</option>
              <option value="30">Do 30 dnů</option>
              <option value="older">Starší než 30 dnů</option>
            </select>
            <select
              className="bg-obsidian border border-velvet-gray rounded-lg px-3 py-2 text-pearl focus:border-neon-orchid focus:shadow-glow-purple outline-none"
              value={salaryFilter}
              onChange={(e) => setSalaryFilter(e.target.value)}
              title="Filtrovat podle výplaty"
            >
              <option value="all">Výplata: Vše</option>
              <option value="has">Má nastavenou</option>
              <option value="none">Nemá</option>
            </select>
            <select
              className="bg-obsidian border border-velvet-gray rounded-lg px-3 py-2 text-pearl focus:border-neon-orchid focus:shadow-glow-purple outline-none w-40"
              value={payoutDayFilter}
              onChange={(e) => setPayoutDayFilter(e.target.value)}
              title="Filtrovat podle dne výplaty"
            >
              <option value="all">Výplata: Vše</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select
              className="bg-obsidian border border-velvet-gray rounded-lg px-3 py-2 text-pearl focus:border-neon-orchid focus:shadow-glow-purple outline-none"
              value={chatterFilter}
              onChange={(e) => setChatterFilter(e.target.value)}
              title="Filtrovat podle chatteru"
            >
              <option value="all">Chatter: Vše</option>
              {uniqueClientChatters.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              onClick={loadClientData}
              className="px-3 py-2 rounded-lg bg-gradient-to-r from-neon-orchid to-crimson text-white shadow-glow-purple hover:shadow-glow transition-all"
              title="Obnovit data"
            >
              🔄
            </button>
          </div>
        )}

        {/* Content */}
        {activeTab === 'klienti' ? (
          klientiLoading ? (
            <TableSkeleton type="clients" rows={8} />
          ) : (
            <div className="overflow-x-auto unified-glass animate-fade-in">
              <table className="w-full text-left text-xs sm:text-sm text-pearl">
              <thead className="text-pearl/80">
                <tr className="border-b border-velvet-gray">
                  <th className="p-3">Jméno</th>
                  <th className="p-3">Výplata</th>
                  <th className="p-3">Poznámky</th>
                  <th className="p-3">Chatter (komu patří)</th>
                  <th className="p-3 text-center">Email</th>
                  <th className="p-3 text-center">Telefon</th>
                  <th className="p-3">Kdy naposledy poslal?</th>
                  <th className="p-3">Past 30 Days</th>
                  <th className="p-3">Banks</th>
                  <th className="p-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedClients.map((row) => (
                  <React.Fragment key={row.jmeno}>
                  <tr
                    key={row.jmeno}
                    className="border-b border-velvet-gray/60 hover:bg-velvet-gray/40 cursor-pointer"
                    onClick={() => {
                      const newExpanded = expandedClient === row.jmeno ? null : row.jmeno
                      setExpandedClient(newExpanded)
                      if (newExpanded && (!row.transakce || row.transakce.length === 0)) {
                        loadClientTransactions(row.jmeno)
                      }
                    }}
                  >
                    <td className="p-3 font-semibold">{row.jmeno}</td>
                    <td className="p-3">
                      <select
                        className="bg-obsidian border border-velvet-gray rounded-md px-2 py-1 text-pearl text-sm focus:border-neon-orchid focus:shadow-glow-purple outline-none"
                        value={salaryMap[row.jmeno] ?? row.vyplata ?? ''}
                        onChange={(e) => saveSalary(row.jmeno, e.target.value)}
                      >
                        <option value="">?</option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openNotes(row) }}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                          (notesMap[row.jmeno] ?? row.poznamky)
                            ? 'bg-gradient-to-r from-neon-orchid to-crimson text-white shadow-glow-purple'
                            : 'bg-velvet-gray text-pearl hover:shadow-glow'
                        }`}
                        title={(notesMap[row.jmeno] ?? row.poznamky) ? 'Zobrazit / upravit poznámky' : 'Přidat poznámky'}
                      >
                        Poznámky
                      </button>
                    </td>
                    <td className="p-3">{row.chatter || '-'}</td>
                    <td className="p-3 text-center relative">
                      <button
                        type="button"
                        onClick={(e) => handleEmailClick(e, row)}
                        className="inline-flex items-center justify-center rounded-full w-9 h-9 bg-obsidian border border-velvet-gray hover:bg-charcoal transition"
                        style={(emailMap[row.jmeno] ?? row.email) ? { boxShadow: '0 0 8px #ff69b4' } : undefined}
                        title={(emailMap[row.jmeno] ?? row.email) || 'Přidat email'}
                      >
                        ✉️
                      </button>
                      
                    </td>
                    <td className="p-3 text-center relative">
                      <button
                        type="button"
                        onClick={(e) => handlePhoneClick(e, row)}
                        className="inline-flex items-center justify-center rounded-full w-9 h-9 bg-obsidian border border-velvet-gray hover:bg-charcoal transition"
                        style={(phoneMap[row.jmeno] ?? row.phone) ? { boxShadow: '0 0 8px #ff69b4' } : undefined}
                        title={(phoneMap[row.jmeno] ?? row.phone) || 'Přidat telefon'}
                      >
                        📞
                      </button>
                      
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <button
                        type="button"
                        className="px-3 py-1 rounded-md text-sm font-semibold text-white"
                        style={{ backgroundColor: heatColor(daysSince(row.lastSent)) }}
                        title={row.lastSent}
                      >
                        {formatRelative(row.lastSent)}
                      </button>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <button
                        type="button"
                        className="px-3 py-1 rounded-md text-sm font-semibold bg-velvet-gray text-pearl hover:shadow-glow"
                        title="Za posledních 30 dnů"
                      >
                        {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(row.lastMonth)}
                      </button>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openBanksModal(row.jmeno) }}
                        className="inline-flex items-center justify-center rounded-full w-9 h-9 bg-obsidian border border-velvet-gray hover:bg-charcoal transition"
                        title="Zobrazit banky"
                      >
                        🏦
                      </button>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <button
                        type="button"
                        className="px-3 py-1 rounded-md text-sm font-semibold bg-velvet-gray text-pearl hover:shadow-glow"
                        title="Celkem"
                      >
                        {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(row.total)}
                      </button>
                    </td>
                  </tr>
                  {expandedClient === row.jmeno && (
                    <tr>
                      <td className="p-0" colSpan={10}>
                        <div className="bg-obsidian/60 border-t border-neon-orchid/20 p-3">
                          <h4 className="text-pearl font-semibold mb-2">Transakce — {row.jmeno}</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-pearl">
                              <thead className="text-pearl/80">
                                <tr className="border-b border-velvet-gray">
                                  <th className="p-2">Datum</th>
                                  <th className="p-2">Částka</th>
                                  <th className="p-2">Chatter</th>
                                  <th className="p-2">Model</th>
                                  <th className="p-2">Banka</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(row.transakce || []).map((t, i) => (
                                  <tr key={i} className="border-b border-velvet-gray/40">
                                    <td className="p-2 whitespace-nowrap">{t.datum ? new Date(t.datum).toLocaleDateString('cs-CZ') : '-'}</td>
                                    <td className="p-2 whitespace-nowrap">{new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(t.castka)}</td>
                                    <td className="p-2">{t.chatter || '-'}</td>
                                    <td className="p-2">{t.model || '-'}</td>
                                    <td className="p-2">{t.banka || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                ))}
              </tbody>
              </table>
            </div>
          )
        ) : (
          <>
            {/* Platby Filters */}
            <div className="mb-3 flex flex-wrap items-end gap-2 sm:gap-3">
              <input
                type="text"
                placeholder="Hledat klienta..."
                className="w-60 bg-obsidian border border-velvet-gray rounded-lg px-3 py-2 text-pearl placeholder-pearl/50 focus:border-neon-orchid focus:shadow-glow-purple outline-none"
                value={platbySearchQuery}
                onChange={(e) => setPlatbySearchQuery(e.target.value)}
              />
              <div className="flex flex-col">
                <label className="text-pearl/70 text-xs mb-1">Období</label>
                <select
                  className="w-40 bg-obsidian border border-velvet-gray rounded-lg px-3 py-2 text-pearl focus:border-neon-orchid focus:shadow-glow-purple outline-none"
                  value={platbyPeriod}
                  onChange={(e) => setPlatbyPeriod(e.target.value)}
                >
                  <option value="today">Dneska</option>
                  <option value="7">Posledních 7 dní</option>
                  <option value="30">Posledních 30 dní</option>
                  <option value="custom">Vlastní rozsah</option>
                </select>
              </div>
              {platbyPeriod === 'custom' && (
                <>
                  <div className="flex flex-col">
                    <label className="text-pearl/70 text-xs mb-1">Od</label>
                    <input type="date" className="w-40 bg-obsidian border border-velvet-gray rounded-lg px-3 py-2 text-pearl focus:border-neon-orchid focus:shadow-glow-purple outline-none" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-pearl/70 text-xs mb-1">Do</label>
                    <input type="date" className="w-40 bg-obsidian border border-velvet-gray rounded-lg px-3 py-2 text-pearl focus:border-neon-orchid focus:shadow-glow-purple outline-none" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} />
                  </div>
                </>
              )}
              <div className="flex flex-col">
                <label className="text-pearl/70 text-xs mb-1">Chatter</label>
                <select
                  className="w-40 bg-obsidian border border-velvet-gray rounded-lg px-3 py-2 text-pearl focus:border-neon-orchid focus:shadow-glow-purple outline-none"
                  value={platbyChatter}
                  onChange={(e) => setPlatbyChatter(e.target.value)}
                >
                  <option value="all">Všichni</option>
                  {uniqueChatters.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-pearl/70 text-xs mb-1">Platforma</label>
                <select
                  className="w-40 bg-obsidian border border-velvet-gray rounded-lg px-3 py-2 text-pearl focus:border-neon-orchid focus:shadow-glow-purple outline-none"
                  value={platbyPlatform}
                  onChange={(e) => setPlatbyPlatform(e.target.value)}
                >
                  <option value="all">Vše</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="FB Stranka">FB Stranka</option>
                  <option value="Other">Other</option>
                  <option value="Paysafe">Paysafe</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-pearl/70 text-xs mb-1">Modelka</label>
                <select
                  className="w-40 bg-obsidian border border-velvet-gray rounded-lg px-3 py-2 text-pearl focus:border-neon-orchid focus:shadow-glow-purple outline-none"
                  value={platbyModel}
                  onChange={(e) => setPlatbyModel(e.target.value)}
                >
                  <option value="all">Vše</option>
                  {uniqueModels.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-pearl/70 text-xs mb-1">Banka</label>
                <select
                  className="w-40 bg-obsidian border border-velvet-gray rounded-lg px-3 py-2 text-pearl focus:border-neon-orchid focus:shadow-glow-purple outline-none"
                  value={platbyBank}
                  onChange={(e) => setPlatbyBank(e.target.value)}
                >
                  <option value="all">Vše</option>
                  {uniqueBanks.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={loadPaymentData}
                className="px-3 py-2 rounded-lg bg-gradient-to-r from-neon-orchid to-crimson text-white text-xl font-semibold shadow-glow-purple hover:shadow-glow transition-all self-end"
                title="Obnovit data"
              >
                🔄
              </button>
            </div>

            {platbyLoading ? (
              <TableSkeleton type="payments" rows={10} />
            ) : (
              <div className="overflow-x-auto unified-glass animate-fade-in">
                <table className="w-full text-left text-sm text-pearl">
                <thead className="text-pearl/80">
                  <tr className="border-b border-velvet-gray">
                    <th className="p-3">Datum</th>
                    <th className="p-3">Částka</th>
                    <th className="p-3">Klient</th>
                    <th className="p-3">Chatter</th>
                    <th className="p-3">Co se prodalo</th>
                    <th className="p-3">Platforma</th>
                    <th className="p-3">Modelka</th>
                    <th className="p-3">Banka</th>
                    <th className="p-3">Přišlo</th>
                    <th className="p-3">Doručeno</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlatby.map((row, idx) => (
                    <tr key={idx} className="border-b border-velvet-gray/60 hover:bg-velvet-gray/40">
                      <td className="p-3 whitespace-nowrap">{row.date ? new Date(row.date).toLocaleDateString('cs-CZ') : '-'}</td>
                      <td className="p-3 whitespace-nowrap">{new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(row.castka)}</td>
                      <td className="p-3">{row.klient}</td>
                      <td className="p-3">{row.chatter}</td>
                      <td className="p-3">{row.prodano}</td>
                      <td className="p-3">{row.platforma}</td>
                      <td className="p-3">{row.modelka}</td>
                      <td className="p-3">{row.banka}</td>
                      <td className="p-3">
                        <input type="checkbox" className="w-4 h-4 accent-[rgb(var(--neon-orchid))]" defaultChecked={row.prislo} />
                      </td>
                      <td className="p-3">
                        <input type="checkbox" className="w-4 h-4 accent-[rgb(var(--sunset-gold))]" defaultChecked={row.doruceno} />
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Banks Modal */}
        {banksModal.open && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={closeBanksModal} />
            <div className="relative z-[101] w-full max-w-lg mx-4 bg-gradient-to-br from-charcoal to-velvet-gray border border-neon-orchid/30 rounded-xl shadow-xl p-4">
              <h3 className="text-lg font-bold text-gradient-primary mb-2">Banky — {banksModal.jmeno}</h3>
              <div className="space-y-2">
                {banksModal.banks.length > 0 ? (
                  banksModal.banks.map((bank, index) => (
                    <div key={index} className="bg-obsidian border border-velvet-gray rounded-lg p-3">
                      <span className="text-pearl font-medium">🏦 {bank}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-pearl/70 text-center py-4">Žádné banky nenalezeny</div>
                )}
              </div>
              <div className="mt-3 flex justify-end">
                <button onClick={closeBanksModal} className="px-4 py-2 rounded-lg bg-gradient-to-r from-neon-orchid to-crimson text-white shadow-glow-purple">Zavřít</button>
              </div>
            </div>
          </div>
        )}

        {/* Sorting controls (visible on Klienti) */}
        {activeTab === 'klienti' && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="text-pearl/70 text-sm">Seřadit:</label>
            <select
              className="bg-obsidian border border-velvet-gray rounded-lg px-3 py-2 text-pearl focus:border-neon-orchid focus:shadow-glow-purple outline-none"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="lastSentDesc">Nejnovější platba</option>
              <option value="lastSentAsc">Nejstarší platba</option>
              <option value="lastMonthDesc">Nejvíc za 30 dnů</option>
              <option value="totalDesc">Nejvíc celkem</option>
              <option value="nameAsc">Jméno A→Z</option>
            </select>
          </div>
        )}

        {/* Notes Modal */}
        {notesModal.open && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={closeNotes} />
            <div className="relative z-[101] w-full max-w-lg mx-4 bg-gradient-to-br from-charcoal to-velvet-gray border border-neon-orchid/30 rounded-xl shadow-xl p-4">
              <h3 className="text-lg font-bold text-gradient-primary mb-2">Poznámky — {notesModal.row?.jmeno}</h3>
              <textarea
                className="w-full h-40 bg-obsidian border border-velvet-gray rounded-lg p-3 text-pearl placeholder-pearl/50 focus:border-neon-orchid focus:shadow-glow-purple outline-none"
                placeholder="Zapište poznámky..."
                value={notesModal.text}
                onChange={(e) => setNotesModal((prev) => ({ ...prev, text: e.target.value }))}
              />
              <div className="mt-3 flex justify-end gap-2">
                <button onClick={closeNotes} className="px-4 py-2 rounded-lg bg-velvet-gray text-pearl hover:shadow-glow">Zrušit</button>
                <button onClick={saveNotes} className="px-4 py-2 rounded-lg bg-gradient-to-r from-neon-orchid to-crimson text-white shadow-glow-purple">Uložit</button>
              </div>
            </div>
          </div>
        )}

        {/* Email Modal */}
        {emailModal.open && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={() => setEmailModal({ open: false, jmeno: null, value: '' })} />
            <div className="relative z-[101] w-full max-w-lg mx-4 bg-gradient-to-br from-charcoal to-velvet-gray border border-neon-orchid/30 rounded-xl shadow-xl p-4">
              <h3 className="text-lg font-bold text-gradient-primary mb-2">Email — {emailModal.jmeno}</h3>
              <input
                type="email"
                className="w-full bg-obsidian border border-velvet-gray rounded-lg p-3 text-pearl placeholder-pearl/50 focus:border-neon-orchid focus:shadow-glow-purple outline-none"
                placeholder="Zadejte email..."
                value={emailModal.value}
                onChange={(e) => setEmailModal((prev) => ({ ...prev, value: e.target.value }))}
              />
              <div className="mt-3 flex justify-end gap-2">
                <button onClick={() => setEmailModal({ open: false, jmeno: null, value: '' })} className="px-4 py-2 rounded-lg bg-velvet-gray text-pearl hover:shadow-glow">Zrušit</button>
                <button onClick={saveEmail} className="px-4 py-2 rounded-lg bg-gradient-to-r from-neon-orchid to-crimson text-white shadow-glow-purple">Uložit</button>
              </div>
            </div>
          </div>
        )}

        {/* Phone Modal */}
        {phoneModal.open && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={() => setPhoneModal({ open: false, jmeno: null, value: '' })} />
            <div className="relative z-[101] w-full max-w-lg mx-4 bg-gradient-to-br from-charcoal to-velvet-gray border border-neon-orchid/30 rounded-xl shadow-xl p-4">
              <h3 className="text-lg font-bold text-gradient-primary mb-2">Telefon — {phoneModal.jmeno}</h3>
              <input
                type="tel"
                className="w-full bg-obsidian border border-velvet-gray rounded-lg p-3 text-pearl placeholder-pearl/50 focus:border-neon-orchid focus:shadow-glow-purple outline-none"
                placeholder="Zadejte telefon..."
                value={phoneModal.value}
                onChange={(e) => setPhoneModal((prev) => ({ ...prev, value: e.target.value }))}
              />
              <div className="mt-3 flex justify-end gap-2">
                <button onClick={() => setPhoneModal({ open: false, jmeno: null, value: '' })} className="px-4 py-2 rounded-lg bg-velvet-gray text-pearl hover:shadow-glow">Zrušit</button>
                <button onClick={savePhone} className="px-4 py-2 rounded-lg bg-gradient-to-r from-neon-orchid to-crimson text-white shadow-glow-purple">Uložit</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Klientiaplatby


