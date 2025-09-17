import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTeamTotals, getActiveGoals } from '../api/queries'
import { TEAM_ID } from '../api/config'

function Skore() {
  const navigate = useNavigate()
  const [view, setView] = useState('daily') // 'daily' | 'weekly' | 'monthly'
  const [revenue, setRevenue] = useState(0)
  const [totals, setTotals] = useState({ daily: 0, weekly: 0, monthly: 0 })
  const [goals, setGoals] = useState([])
  const [isUpdating, setIsUpdating] = useState(false)
  const [lastIncrement, setLastIncrement] = useState(0)
  const animTimeoutRef = useRef(null)
  const buttonRefs = useRef([])

  const goalByView = useMemo(() => {
    const findGoal = (period) => goals.find(g => g.period === period)
    return {
      daily: findGoal('daily')?.target_value || 0,
      weekly: findGoal('weekly')?.target_value || 0,
      monthly: findGoal('monthly')?.target_value || 0,
    }
  }, [goals])

  const baseRevenueByView = useMemo(() => ({
    daily: totals.daily,
    weekly: totals.weekly,
    monthly: totals.monthly
  }), [totals])

  // Video backgrounds
  const videos = useMemo(() => [
    'https://res.cloudinary.com/dmbzcxhjn/video/upload/A_looping_animation_of_a_futuristic_purple_jungle_at_sunset_glowing_palm_trees_swaying_gently_in_a_breeze_cinematic_lighting_gold_and_pink_horizon_ultra-HD_surreal_GTA_6_luxury_vibe_seamless_loop_lknzqf.mp4',
    'https://res.cloudinary.com/dmbzcxhjn/video/upload/A_seamless_cinematic_animation_loop_of_a_luxury_yacht_at_golden_hour_surrounded_by_a_glowing_purple_sea_and_distant_tropical_skyline._A_confident_man_in_designer_clothing_pops_a_bottle_of_champagne_on_the_upper_kou97h.mp4',
    'https://res.cloudinary.com/dmbzcxhjn/video/upload/A_seamless_infinite_loop_animation_of_a_futuristic_high-luxury_Miami-inspired_jungle_scene_at_golden_hour._The_environment_is_filled_with_glowing_purple_palm_trees_swaying_gently_in_ambient_breeze_floating_mone_xqtbfg.mp4',
    'https://res.cloudinary.com/dmbzcxhjn/video/upload/A_seamless_cinematic_animation_loop_of_a_jungle_villa_at_dusk._A_red_Lamborghini_sports_car_parked_at_the_end_of_a_curved_driveway_surrounded_by_glowing_purple_palm_trees._The_sky_glows_with_a_pink-orange_sunset._p1fcjs.mp4'
  ], [])
  const [videoIndex, setVideoIndex] = useState(() => Math.floor(Math.random() * 4))
  const currentVideo = videos[videoIndex]

  // Split number into characters for digit-by-digit animation (keeps non-digits like space)
  const formatted = useMemo(() => new Intl.NumberFormat('cs-CZ', {
    style: 'currency', currency: 'CZK', minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(revenue), [revenue])
  const chars = useMemo(() => formatted.split(''), [formatted])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!TEAM_ID) return
      try {
        const [t, g] = await Promise.all([
          getTeamTotals(TEAM_ID),
          getActiveGoals(TEAM_ID)
        ])
        if (!mounted) return
        setTotals(t || { daily: 0, weekly: 0, monthly: 0 })
        setGoals(g || [])
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Načítání skóre selhalo', e)
      }
    }
    load()
    const id = setInterval(load, 15000)
    return () => { mounted = false; clearInterval(id) }
  }, [])

  // Change displayed amount when switching view (mock different totals per view)
  useEffect(() => {
    setRevenue(baseRevenueByView[view] || 0)
  }, [view, baseRevenueByView])

  // Optional fallback: in case onEnded doesn't fire, advance after 45s
  useEffect(() => {
    const id = setTimeout(() => {
      setVideoIndex(prev => (prev + 1) % videos.length)
    }, 45000)
    return () => clearTimeout(id)
  }, [videoIndex, videos.length])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (amount) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'decimal',
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Keyboard (TV remote) navigation for view buttons
  useEffect(() => {
    const onKeyDown = (e) => {
      const order = ['daily', 'weekly', 'monthly']
      const index = order.indexOf(view)
      if (e.key === 'ArrowRight') {
        const next = order[Math.min(order.length - 1, index + 1)]
        if (next !== view) setView(next)
        const nextIdx = Math.min(order.length - 1, index + 1)
        buttonRefs.current[nextIdx]?.focus()
      } else if (e.key === 'ArrowLeft') {
        const prev = order[Math.max(0, index - 1)]
        if (prev !== view) setView(prev)
        const prevIdx = Math.max(0, index - 1)
        buttonRefs.current[prevIdx]?.focus()
      } else if (e.key === 'Enter') {
        // Enter/OK confirms current focus; no-op since setView happens on arrow, but keep for remotes
      }
    }
    window.addEventListener('keydown', onKeyDown)
    // Initial focus for TV use
    buttonRefs.current[0]?.focus()
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [view])

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Fullscreen video background */}
      <video
        key={videoIndex}
        autoPlay
        muted
        playsInline
        onEnded={() => setVideoIndex((prev) => (prev + 1) % videos.length)}
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src={currentVideo} type="video/mp4" />
      </video>

      {/* Gradient fade overlay to improve contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/60 z-0 pointer-events-none" />

      <div className="text-center relative z-10">
        {/* View selector (Denně / Týdně / Měsíčně) with goals */}
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
          {[
            { key: 'daily', label: 'Denně' },
            { key: 'weekly', label: 'Týdně' },
            { key: 'monthly', label: 'Měsíčně' }
          ].map((opt, idx) => {
            const isActive = view === opt.key
            const made = baseRevenueByView[opt.key]
            const goal = goalByView[opt.key]
            return (
              <button
                key={opt.key}
                ref={(el) => (buttonRefs.current[idx] = el)}
                onClick={() => setView(opt.key)}
                className={`mx-1 px-5 py-3 md:px-6 md:py-3.5 rounded-xl text-base md:text-lg lg:text-xl font-semibold outline-none focus:outline-none focus:ring-4 focus:ring-[rgba(255,105,180,0.7)] transition-all select-none ${
                  isActive
                    ? 'bg-gradient-to-r from-neon-orchid to-crimson text-white shadow-glow-purple scale-[1.02]'
                    : 'bg-velvet-gray/80 text-pearl border border-neon-orchid/30 hover:shadow-glow hover:scale-105'
                }`}
                tabIndex={0}
                aria-pressed={isActive}
                title={`${opt.label} cíl`}
              >
                <div className="flex flex-col items-center leading-tight">
                  <span className="tracking-wide">{opt.label}</span>
                  <span className={`mt-1 text-[0.9rem] md:text-base font-medium ${isActive ? 'text-white' : 'text-pearl/90'} text-neon-glow`}>
                    {formatNumber(made)} / {formatNumber(goal)}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
        <div className="relative">
          <div className={`flex justify-center gap-1 md:gap-2 items-end select-none text-neon-orchid animate-breathe mb-8 transition-all duration-1000 ease-out ${
            isUpdating ? 'scale-105 brightness-125' : 'scale-100 brightness-100'
          }`} aria-label={formatted}>
            {chars.map((ch, idx) => (
              <span
                key={idx}
                className={`inline-block align-baseline ${
                  /\d/.test(ch) ? 'text-8xl md:text-9xl lg:text-[12rem] text-neon-glow' : 'text-6xl md:text-7xl lg:text-8xl'
                } font-bold leading-none transition-all duration-700 ease-out ${
                  isUpdating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
                }`}
                style={{ transitionDelay: isUpdating ? `${idx * 50}ms` : '0ms' }}
              >
                {ch}
              </span>
            ))}
          </div>

          {/* Increment indicator */}
          {isUpdating && (
            <div className="absolute -top-6 -right-6 bg-gradient-to-r from-sunset-gold to-neon-orchid text-white px-4 py-2 rounded-full text-lg font-bold animate-pulse shadow-lg">
              +{formatCurrency(lastIncrement)}
            </div>
          )}
        </div>

        <p className="text-pearl/90 text-2xl md:text-3xl font-light drop-shadow">
          {view === 'daily' ? 'Denně' : view === 'weekly' ? 'Týdně' : 'Měsíčně'}
        </p>
        <p className="text-pearl/70 text-sm mt-4 drop-shadow">
          Aktualizace každých 15 sekund
        </p>
      </div>

      {/* Back button bottom-left */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="fixed bottom-4 left-4 z-10 px-4 py-2 rounded-lg bg-velvet-gray/80 text-pearl border border-neon-orchid/30 hover:shadow-glow transition-all"
        title="Zpět"
      >
        ← Zpět
      </button>
    </div>
  )
}

export default Skore
