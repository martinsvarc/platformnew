import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { upsertSimpleGoals, getBestChatterChallenge, upsertBestChatterChallenge } from '../api/queries'
import { TEAM_ID } from '../api/config'
import { useToast } from '../contexts/ToastContext'

function parseNumberOr(defaultValue, value) {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : defaultValue
}

function GoalSetting() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [daily, setDaily] = useState(40000)
  const [weekly, setWeekly] = useState(150000)
  const [monthly, setMonthly] = useState(500000)
  
  // Description text states
  const [dailyDescription, setDailyDescription] = useState('')
  const [weeklyDescription, setWeeklyDescription] = useState('')
  const [monthlyDescription, setMonthlyDescription] = useState('')
  
  // Media URL states
  const [dailyMedia, setDailyMedia] = useState('')
  const [weeklyMedia, setWeeklyMedia] = useState('')
  const [monthlyMedia, setMonthlyMedia] = useState('')
  
  // Goal visibility states (controls if goal view appears on Skore page)
  const [dailyActive, setDailyActive] = useState(true)
  const [weeklyActive, setWeeklyActive] = useState(true)
  const [monthlyActive, setMonthlyActive] = useState(true)
  
  // Popover states
  const [showDailyPopover, setShowDailyPopover] = useState(false)
  const [showWeeklyPopover, setShowWeeklyPopover] = useState(false)
  const [showMonthlyPopover, setShowMonthlyPopover] = useState(false)
  
  // File upload refs
  const dailyFileRef = useRef(null)
  const weeklyFileRef = useRef(null)
  const monthlyFileRef = useRef(null)
  const bestChatterFileRef = useRef(null)
  
  // Best Chatter states
  const [bestChatterDescription, setBestChatterDescription] = useState('')
  const [bestChatterMedia, setBestChatterMedia] = useState('')
  const [bestChatterEndTime, setBestChatterEndTime] = useState('')
  const [bestChatterActive, setBestChatterActive] = useState(false)
  const [showBestChatterPopover, setShowBestChatterPopover] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const d = parseNumberOr(40000, localStorage.getItem('goalDaily'))
        const w = parseNumberOr(150000, localStorage.getItem('goalWeekly'))
        const m = parseNumberOr(500000, localStorage.getItem('goalMonthly'))
        setDaily(d)
        setWeekly(w)
        setMonthly(m)
        
        // Load descriptions and media from localStorage
        setDailyDescription(localStorage.getItem('goalDailyDescription') || '')
        setWeeklyDescription(localStorage.getItem('goalWeeklyDescription') || '')
        setMonthlyDescription(localStorage.getItem('goalMonthlyDescription') || '')
        setDailyMedia(localStorage.getItem('goalDailyMedia') || '')
        setWeeklyMedia(localStorage.getItem('goalWeeklyMedia') || '')
        setMonthlyMedia(localStorage.getItem('goalMonthlyMedia') || '')
        setDailyActive(localStorage.getItem('goalDailyActive') !== 'false')
        setWeeklyActive(localStorage.getItem('goalWeeklyActive') !== 'false')
        setMonthlyActive(localStorage.getItem('goalMonthlyActive') !== 'false')
        
        // Load best chatter challenge from database
        if (TEAM_ID) {
          const challenge = await getBestChatterChallenge(TEAM_ID)
          if (challenge) {
            setBestChatterDescription(challenge.description_text || '')
            setBestChatterMedia(challenge.media_url || '')
            setBestChatterActive(challenge.active || false)
            if (challenge.end_time) {
              // Convert to datetime-local format
              const date = new Date(challenge.end_time)
              const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16)
              setBestChatterEndTime(localDateTime)
            }
          }
        }
      } catch (err) {
        console.error('Error loading data:', err)
      }
    }
    loadData()
  }, [])

  const save = async (e) => {
    e.preventDefault()
    try {
      await upsertSimpleGoals(TEAM_ID, { 
        daily, 
        weekly, 
        monthly,
        dailyDescription,
        weeklyDescription,
        monthlyDescription,
        dailyMedia,
        weeklyMedia,
        monthlyMedia,
        dailyActive,
        weeklyActive,
        monthlyActive
      })
      // Save to localStorage for persistence
      localStorage.setItem('goalDaily', String(daily))
      localStorage.setItem('goalWeekly', String(weekly))
      localStorage.setItem('goalMonthly', String(monthly))
      localStorage.setItem('goalDailyDescription', dailyDescription)
      localStorage.setItem('goalWeeklyDescription', weeklyDescription)
      localStorage.setItem('goalMonthlyDescription', monthlyDescription)
      localStorage.setItem('goalDailyMedia', dailyMedia)
      localStorage.setItem('goalWeeklyMedia', weeklyMedia)
      localStorage.setItem('goalMonthlyMedia', monthlyMedia)
      localStorage.setItem('goalDailyActive', String(dailyActive))
      localStorage.setItem('goalWeeklyActive', String(weeklyActive))
      localStorage.setItem('goalMonthlyActive', String(monthlyActive))
      toast.success('Cíle byly úspěšně uloženy.')
    } catch (err) {
      console.error('Goal save error:', err)
      toast.error('Nepodařilo se uložit cíle. Zkuste to prosím znovu.')
    }
  }
  
  const handleFileUpload = async (e, period) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Check if it's an image or video
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.warning('Prosím nahrajte obrázek nebo video')
      return
    }
    
    // For now, we'll use a data URL. In production, you'd upload to a CDN/cloud storage
    const reader = new FileReader()
    reader.onload = async (event) => {
      const dataUrl = event.target.result
      
      // Update state
      let newDailyMedia = dailyMedia
      let newWeeklyMedia = weeklyMedia
      let newMonthlyMedia = monthlyMedia
      
      if (period === 'daily') {
        setDailyMedia(dataUrl)
        newDailyMedia = dataUrl
      } else if (period === 'weekly') {
        setWeeklyMedia(dataUrl)
        newWeeklyMedia = dataUrl
      } else if (period === 'monthly') {
        setMonthlyMedia(dataUrl)
        newMonthlyMedia = dataUrl
      }
      
      // Auto-save to database
      try {
        await upsertSimpleGoals(TEAM_ID, { 
          daily, 
          weekly, 
          monthly,
          dailyDescription,
          weeklyDescription,
          monthlyDescription,
          dailyMedia: newDailyMedia,
          weeklyMedia: newWeeklyMedia,
          monthlyMedia: newMonthlyMedia,
          dailyMediaActive,
          weeklyMediaActive,
          monthlyMediaActive
        })
        
        // Save to localStorage
        localStorage.setItem('goalDaily', String(daily))
        localStorage.setItem('goalWeekly', String(weekly))
        localStorage.setItem('goalMonthly', String(monthly))
        localStorage.setItem('goalDailyDescription', dailyDescription)
        localStorage.setItem('goalWeeklyDescription', weeklyDescription)
        localStorage.setItem('goalMonthlyDescription', monthlyDescription)
        localStorage.setItem('goalDailyMedia', newDailyMedia)
        localStorage.setItem('goalWeeklyMedia', newWeeklyMedia)
        localStorage.setItem('goalMonthlyMedia', newMonthlyMedia)
        localStorage.setItem('goalDailyMediaActive', String(dailyMediaActive))
        localStorage.setItem('goalWeeklyMediaActive', String(weeklyMediaActive))
        localStorage.setItem('goalMonthlyMediaActive', String(monthlyMediaActive))
        
        toast.success('Média byla úspěšně nahrána a uložena!')
      } catch (err) {
        console.error('Media upload error:', err)
        toast.error('Nepodařilo se uložit média. Zkuste to prosím znovu.')
      }
    }
    reader.readAsDataURL(file)
  }
  
  const saveDescription = async (period) => {
    try {
      const descriptionValue = period === 'daily' ? dailyDescription : period === 'weekly' ? weeklyDescription : monthlyDescription
      
      await upsertSimpleGoals(TEAM_ID, { 
        daily, 
        weekly, 
        monthly,
        dailyDescription: period === 'daily' ? descriptionValue : dailyDescription,
        weeklyDescription: period === 'weekly' ? descriptionValue : weeklyDescription,
        monthlyDescription: period === 'monthly' ? descriptionValue : monthlyDescription,
        dailyMedia,
        weeklyMedia,
        monthlyMedia,
        dailyActive,
        weeklyActive,
        monthlyActive
      })
      
      // Save to localStorage
      localStorage.setItem('goalDaily', String(daily))
      localStorage.setItem('goalWeekly', String(weekly))
      localStorage.setItem('goalMonthly', String(monthly))
      localStorage.setItem('goalDailyDescription', period === 'daily' ? descriptionValue : dailyDescription)
      localStorage.setItem('goalWeeklyDescription', period === 'weekly' ? descriptionValue : weeklyDescription)
      localStorage.setItem('goalMonthlyDescription', period === 'monthly' ? descriptionValue : monthlyDescription)
      localStorage.setItem('goalDailyMedia', dailyMedia)
      localStorage.setItem('goalWeeklyMedia', weeklyMedia)
      localStorage.setItem('goalMonthlyMedia', monthlyMedia)
      localStorage.setItem('goalDailyActive', String(dailyActive))
      localStorage.setItem('goalWeeklyActive', String(weeklyActive))
      localStorage.setItem('goalMonthlyActive', String(monthlyActive))
      
      // Close the popover
      if (period === 'daily') setShowDailyPopover(false)
      if (period === 'weekly') setShowWeeklyPopover(false)
      if (period === 'monthly') setShowMonthlyPopover(false)
      
      toast.success('Text byl úspěšně uložen.')
    } catch (err) {
      console.error('Description save error:', err)
      toast.error('Nepodařilo se uložit text. Zkuste to prosím znovu.')
    }
  }
  
  const saveBestChatterDescription = async () => {
    try {
      if (!bestChatterEndTime) {
        toast.warning('Prosím nastavte čas konce soutěže.')
        return
      }
      
      await upsertBestChatterChallenge(TEAM_ID, {
        descriptionText: bestChatterDescription,
        mediaUrl: bestChatterMedia,
        endTime: new Date(bestChatterEndTime).toISOString(),
        active: bestChatterActive
      })
      
      setShowBestChatterPopover(false)
      toast.success('Best Chatter text byl úspěšně uložen.')
    } catch (err) {
      console.error('Best chatter description save error:', err)
      toast.error('Nepodařilo se uložit text. Zkuste to prosím znovu.')
    }
  }
  
  const handleBestChatterFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.warning('Prosím nahrajte obrázek nebo video')
      return
    }
    
    const reader = new FileReader()
    reader.onload = async (event) => {
      const dataUrl = event.target.result
      setBestChatterMedia(dataUrl)
      
      // Auto-save
      try {
        if (!bestChatterEndTime) {
          toast.warning('Nejprve nastavte čas konce soutěže.')
          return
        }
        
        await upsertBestChatterChallenge(TEAM_ID, {
          descriptionText: bestChatterDescription,
          mediaUrl: dataUrl,
          endTime: new Date(bestChatterEndTime).toISOString(),
          active: bestChatterActive
        })
        
        toast.success('Média byla úspěšně nahrána!')
      } catch (err) {
        console.error('Media upload error:', err)
        toast.error('Nepodařilo se uložit média.')
      }
    }
    reader.readAsDataURL(file)
  }
  
  const saveBestChatter = async () => {
    try {
      if (!bestChatterEndTime) {
        toast.warning('Prosím nastavte čas konce soutěže.')
        return
      }
      
      await upsertBestChatterChallenge(TEAM_ID, {
        descriptionText: bestChatterDescription,
        mediaUrl: bestChatterMedia,
        endTime: new Date(bestChatterEndTime).toISOString(),
        active: bestChatterActive
      })
      
      toast.success('Best Chatter výzva byla úspěšně uložena.')
    } catch (err) {
      console.error('Best chatter save error:', err)
      toast.error('Nepodařilo se uložit výzvu. Zkuste to prosím znovu.')
    }
  }

  return (
    <div className="w-full unified-glass p-6">
      <h2 className="text-xl font-bold text-gradient-primary mb-4">{t('admin.goalSettings')}</h2>
      <form onSubmit={save} className="space-y-4">
        {/* Daily Goal */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-pearl/80 text-sm">Denní cíl (CZK)</label>
            <label className="flex items-center gap-2 text-xs text-pearl/80 cursor-pointer">
              <input
                type="checkbox"
                checked={dailyActive}
                onChange={(e) => setDailyActive(e.target.checked)}
                className="w-4 h-4 rounded bg-obsidian border-velvet-gray text-neon-orchid focus:ring-neon-orchid focus:ring-offset-0"
              />
              <span>Viditelné na Skore stránce</span>
            </label>
          </div>
          <div className="flex gap-2 items-start">
            <input
              type="number"
              min="0"
              step="1000"
              value={daily}
              onChange={(e) => setDaily(parseNumberOr(daily, e.target.value))}
              className="flex-1 px-3 py-2 rounded-lg bg-obsidian text-pearl border border-velvet-gray focus:border-neon-orchid focus:shadow-glow-purple outline-none"
              placeholder="40 000"
            />
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDailyPopover(!showDailyPopover)}
                className={`px-3 py-2 rounded-lg bg-velvet-gray text-pearl border transition hover:shadow-glow ${
                  dailyDescription ? 'border-neon-orchid shadow-glow-purple' : 'border-velvet-gray'
                }`}
                title="Přidat popis"
              >
                💬
              </button>
              {showDailyPopover && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    onClick={() => setShowDailyPopover(false)}
                  />
                  {/* Centered Popover */}
                  <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-80 p-4 rounded-lg bg-obsidian border border-neon-orchid shadow-glow-purple">
                    <label className="block text-pearl/80 text-sm mb-2">Text pro Skore stránku</label>
                    <textarea
                      value={dailyDescription}
                      onChange={(e) => setDailyDescription(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-velvet-gray text-pearl border border-velvet-gray focus:border-neon-orchid outline-none resize-none"
                      rows="3"
                      placeholder="Motivační text..."
                    />
                    <button
                      type="button"
                      onClick={() => saveDescription('daily')}
                      className="mt-2 w-full px-3 py-1 rounded bg-gradient-to-r from-neon-orchid to-crimson text-white text-sm hover:brightness-110 transition"
                    >
                      Uložit
                    </button>
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={() => dailyFileRef.current?.click()}
                className={`px-3 py-2 rounded-lg bg-velvet-gray text-pearl border transition hover:shadow-glow ${
                  dailyMedia ? 'border-neon-orchid shadow-glow-purple' : 'border-velvet-gray'
                }`}
                title="Nahrát obrázek/video"
              >
                📷
              </button>
              {dailyMedia && (
                <button
                  type="button"
                  onClick={() => setDailyMedia('')}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-crimson/80 text-white text-xs hover:bg-crimson transition"
                  title="Odstranit média"
                >
                  ✕
                </button>
              )}
            </div>
            <input
              ref={dailyFileRef}
              type="file"
              accept="image/*,video/*"
              onChange={(e) => handleFileUpload(e, 'daily')}
              className="hidden"
            />
          </div>
          {dailyMedia && (
            <div className="mt-2 text-xs text-pearl/70">
              ✓ Média nahráno {dailyMedia.startsWith('data:image') ? '(obrázek)' : '(video)'}
            </div>
          )}
        </div>

        {/* Weekly Goal */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-pearl/80 text-sm">Týdenní cíl (CZK)</label>
            <label className="flex items-center gap-2 text-xs text-pearl/80 cursor-pointer">
              <input
                type="checkbox"
                checked={weeklyActive}
                onChange={(e) => setWeeklyActive(e.target.checked)}
                className="w-4 h-4 rounded bg-obsidian border-velvet-gray text-neon-orchid focus:ring-neon-orchid focus:ring-offset-0"
              />
              <span>Viditelné na Skore stránce</span>
            </label>
          </div>
          <div className="flex gap-2 items-start">
            <input
              type="number"
              min="0"
              step="1000"
              value={weekly}
              onChange={(e) => setWeekly(parseNumberOr(weekly, e.target.value))}
              className="flex-1 px-3 py-2 rounded-lg bg-obsidian text-pearl border border-velvet-gray focus:border-neon-orchid focus:shadow-glow-purple outline-none"
              placeholder="150 000"
            />
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowWeeklyPopover(!showWeeklyPopover)}
                className={`px-3 py-2 rounded-lg bg-velvet-gray text-pearl border transition hover:shadow-glow ${
                  weeklyDescription ? 'border-neon-orchid shadow-glow-purple' : 'border-velvet-gray'
                }`}
                title="Přidat popis"
              >
                💬
              </button>
              {showWeeklyPopover && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    onClick={() => setShowWeeklyPopover(false)}
                  />
                  {/* Centered Popover */}
                  <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-80 p-4 rounded-lg bg-obsidian border border-neon-orchid shadow-glow-purple">
                    <label className="block text-pearl/80 text-sm mb-2">Text pro Skore stránku</label>
                    <textarea
                      value={weeklyDescription}
                      onChange={(e) => setWeeklyDescription(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-velvet-gray text-pearl border border-velvet-gray focus:border-neon-orchid outline-none resize-none"
                      rows="3"
                      placeholder="Motivační text..."
                    />
                    <button
                      type="button"
                      onClick={() => saveDescription('weekly')}
                      className="mt-2 w-full px-3 py-1 rounded bg-gradient-to-r from-neon-orchid to-crimson text-white text-sm hover:brightness-110 transition"
                    >
                      Uložit
                    </button>
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={() => weeklyFileRef.current?.click()}
                className={`px-3 py-2 rounded-lg bg-velvet-gray text-pearl border transition hover:shadow-glow ${
                  weeklyMedia ? 'border-neon-orchid shadow-glow-purple' : 'border-velvet-gray'
                }`}
                title="Nahrát obrázek/video"
              >
                📷
              </button>
              {weeklyMedia && (
                <button
                  type="button"
                  onClick={() => setWeeklyMedia('')}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-crimson/80 text-white text-xs hover:bg-crimson transition"
                  title="Odstranit média"
                >
                  ✕
                </button>
              )}
            </div>
            <input
              ref={weeklyFileRef}
              type="file"
              accept="image/*,video/*"
              onChange={(e) => handleFileUpload(e, 'weekly')}
              className="hidden"
            />
          </div>
          {weeklyMedia && (
            <div className="mt-2 text-xs text-pearl/70">
              ✓ Média nahráno {weeklyMedia.startsWith('data:image') ? '(obrázek)' : '(video)'}
            </div>
          )}
        </div>

        {/* Monthly Goal */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-pearl/80 text-sm">Měsíční cíl (CZK)</label>
            <label className="flex items-center gap-2 text-xs text-pearl/80 cursor-pointer">
              <input
                type="checkbox"
                checked={monthlyActive}
                onChange={(e) => setMonthlyActive(e.target.checked)}
                className="w-4 h-4 rounded bg-obsidian border-velvet-gray text-neon-orchid focus:ring-neon-orchid focus:ring-offset-0"
              />
              <span>Viditelné na Skore stránce</span>
            </label>
          </div>
          <div className="flex gap-2 items-start">
            <input
              type="number"
              min="0"
              step="1000"
              value={monthly}
              onChange={(e) => setMonthly(parseNumberOr(monthly, e.target.value))}
              className="flex-1 px-3 py-2 rounded-lg bg-obsidian text-pearl border border-velvet-gray focus:border-neon-orchid focus:shadow-glow-purple outline-none"
              placeholder="500 000"
            />
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMonthlyPopover(!showMonthlyPopover)}
                className={`px-3 py-2 rounded-lg bg-velvet-gray text-pearl border transition hover:shadow-glow ${
                  monthlyDescription ? 'border-neon-orchid shadow-glow-purple' : 'border-velvet-gray'
                }`}
                title="Přidat popis"
              >
                💬
              </button>
              {showMonthlyPopover && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    onClick={() => setShowMonthlyPopover(false)}
                  />
                  {/* Centered Popover */}
                  <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-80 p-4 rounded-lg bg-obsidian border border-neon-orchid shadow-glow-purple">
                    <label className="block text-pearl/80 text-sm mb-2">Text pro Skore stránku</label>
                    <textarea
                      value={monthlyDescription}
                      onChange={(e) => setMonthlyDescription(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-velvet-gray text-pearl border border-velvet-gray focus:border-neon-orchid outline-none resize-none"
                      rows="3"
                      placeholder="Motivační text..."
                    />
                    <button
                      type="button"
                      onClick={() => saveDescription('monthly')}
                      className="mt-2 w-full px-3 py-1 rounded bg-gradient-to-r from-neon-orchid to-crimson text-white text-sm hover:brightness-110 transition"
                    >
                      Uložit
                    </button>
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={() => monthlyFileRef.current?.click()}
                className={`px-3 py-2 rounded-lg bg-velvet-gray text-pearl border transition hover:shadow-glow ${
                  monthlyMedia ? 'border-neon-orchid shadow-glow-purple' : 'border-velvet-gray'
                }`}
                title="Nahrát obrázek/video"
              >
                📷
              </button>
              {monthlyMedia && (
                <button
                  type="button"
                  onClick={() => setMonthlyMedia('')}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-crimson/80 text-white text-xs hover:bg-crimson transition"
                  title="Odstranit média"
                >
                  ✕
                </button>
              )}
            </div>
            <input
              ref={monthlyFileRef}
              type="file"
              accept="image/*,video/*"
              onChange={(e) => handleFileUpload(e, 'monthly')}
              className="hidden"
            />
          </div>
          {monthlyMedia && (
            <div className="mt-2 text-xs text-pearl/70">
              ✓ Média nahráno {monthlyMedia.startsWith('data:image') ? '(obrázek)' : '(video)'}
            </div>
          )}
        </div>

        <button type="submit" className="w-full bg-gradient-to-r from-neon-orchid to-crimson text-white px-4 py-2 rounded-lg shadow-glow-purple hover:brightness-110 transition">
          Uložit cíle
        </button>
      </form>

      {/* Best Chatter Challenge Section */}
      <div className="mt-6 pt-6 border-t border-neon-orchid/30">
        <h3 className="text-lg font-bold text-gradient-gold mb-4">🏆 Best Chatter Challenge</h3>
        <div className="space-y-4">
          {/* Active Checkbox */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="bestChatterActive"
              checked={bestChatterActive}
              onChange={(e) => setBestChatterActive(e.target.checked)}
              className="w-5 h-5 rounded bg-obsidian border-velvet-gray text-neon-orchid focus:ring-neon-orchid focus:ring-offset-0"
            />
            <label htmlFor="bestChatterActive" className="text-pearl/90 font-medium">
              Aktivní (viditelné na Skore stránce)
            </label>
          </div>

          {/* End Time */}
          <div>
            <label className="block text-pearl/80 text-sm mb-1">Konec výzvy (čas)</label>
            <input
              type="datetime-local"
              value={bestChatterEndTime}
              onChange={(e) => setBestChatterEndTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-obsidian text-pearl border border-velvet-gray focus:border-neon-orchid focus:shadow-glow-purple outline-none"
            />
          </div>

          {/* Description and Media */}
          <div>
            <label className="block text-pearl/80 text-sm mb-1">Popis a média</label>
            <div className="flex gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowBestChatterPopover(!showBestChatterPopover)}
                  className={`px-3 py-2 rounded-lg bg-velvet-gray text-pearl border transition hover:shadow-glow ${
                    bestChatterDescription ? 'border-neon-orchid shadow-glow-purple' : 'border-velvet-gray'
                  }`}
                  title="Přidat popis"
                >
                  💬
                </button>
                {showBestChatterPopover && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                      onClick={() => setShowBestChatterPopover(false)}
                    />
                    {/* Centered Popover */}
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-80 p-4 rounded-lg bg-obsidian border border-neon-orchid shadow-glow-purple">
                      <label className="block text-pearl/80 text-sm mb-2">Text pro Skore stránku</label>
                      <textarea
                        value={bestChatterDescription}
                        onChange={(e) => setBestChatterDescription(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-velvet-gray text-pearl border border-velvet-gray focus:border-neon-orchid outline-none resize-none"
                        rows="3"
                        placeholder="Motivační text..."
                      />
                      <button
                        type="button"
                        onClick={saveBestChatterDescription}
                        className="mt-2 w-full px-3 py-1 rounded bg-gradient-to-r from-neon-orchid to-crimson text-white text-sm hover:brightness-110 transition"
                      >
                        Uložit
                      </button>
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-1 items-center">
                <button
                  type="button"
                  onClick={() => bestChatterFileRef.current?.click()}
                  className={`px-3 py-2 rounded-lg bg-velvet-gray text-pearl border transition hover:shadow-glow ${
                    bestChatterMedia ? 'border-neon-orchid shadow-glow-purple' : 'border-velvet-gray'
                  }`}
                  title="Nahrát obrázek/video"
                >
                  📷
                </button>
                {bestChatterMedia && (
                  <button
                    type="button"
                    onClick={() => setBestChatterMedia('')}
                    className="w-6 h-6 flex items-center justify-center rounded-full bg-crimson/80 text-white text-xs hover:bg-crimson transition"
                    title="Odstranit média"
                  >
                    ✕
                  </button>
                )}
              </div>
              <input
                ref={bestChatterFileRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleBestChatterFileUpload}
                className="hidden"
              />
            </div>
            {bestChatterMedia && (
              <div className="mt-2 text-xs text-pearl/70">
                ✓ Média nahráno {bestChatterMedia.startsWith('data:image') ? '(obrázek)' : '(video)'}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={saveBestChatter}
            className="w-full bg-gradient-to-r from-sunset-gold to-crimson text-white px-4 py-2 rounded-lg shadow-glow hover:brightness-110 transition"
          >
            Uložit Best Chatter Challenge
          </button>
        </div>
      </div>
    </div>
  )
}

export default GoalSetting


