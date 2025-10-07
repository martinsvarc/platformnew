import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTeamTotals, getActiveGoals, getBestChatterChallenge, getTopChatters } from '../api/queries'
import { TEAM_ID } from '../api/config'

function Skore() {
  const navigate = useNavigate()
  const [view, setView] = useState('daily') // 'daily' | 'weekly' | 'monthly' | 'bestChatter'
  const [revenue, setRevenue] = useState(0)
  const [totals, setTotals] = useState({ daily: 0, weekly: 0, monthly: 0 })
  const [goals, setGoals] = useState([])
  const [bestChatterChallenge, setBestChatterChallenge] = useState(null)
  const [topChatters, setTopChatters] = useState([])
  const [timeLeft, setTimeLeft] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [lastIncrement, setLastIncrement] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
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
  
  const goalDataByView = useMemo(() => {
    const findGoal = (period) => goals.find(g => g.period === period)
    return {
      daily: findGoal('daily'),
      weekly: findGoal('weekly'),
      monthly: findGoal('monthly'),
    }
  }, [goals])
  
  const currentGoalData = goalDataByView[view]

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
        const [t, g, challenge] = await Promise.all([
          getTeamTotals(TEAM_ID),
          getActiveGoals(TEAM_ID),
          getBestChatterChallenge(TEAM_ID)
        ])
        if (!mounted) return
        setTotals(t || { daily: 0, weekly: 0, monthly: 0 })
        setGoals(g || [])
        
        if (challenge && challenge.active) {
          setBestChatterChallenge(challenge)
          // Load top chatters since challenge start
          const chatters = await getTopChatters(TEAM_ID, challenge.start_time)
          setTopChatters(chatters)
        } else {
          setBestChatterChallenge(null)
          setTopChatters([])
        }
        setIsLoading(false)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Načítání skóre selhalo', e)
        setIsLoading(false)
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
  
  // Handle case where current view becomes inactive
  useEffect(() => {
    if (view !== 'bestChatter') {
      const currentGoal = goalDataByView[view]
      if (currentGoal && currentGoal.active === false) {
        // Current view is now inactive, switch to first active goal
        const activeGoals = ['daily', 'weekly', 'monthly'].filter((period) => {
          const goalData = goalDataByView[period]
          return goalData?.active !== false
        })
        if (activeGoals.length > 0) {
          setView(activeGoals[0])
        } else if (bestChatterChallenge) {
          setView('bestChatter')
        }
      }
    }
  }, [view, goalDataByView, bestChatterChallenge])

  // Optional fallback: in case onEnded doesn't fire, advance after 45s
  useEffect(() => {
    const id = setTimeout(() => {
      setVideoIndex(prev => (prev + 1) % videos.length)
    }, 45000)
    return () => clearTimeout(id)
  }, [videoIndex, videos.length])
  
  // Countdown timer for Best Chatter
  useEffect(() => {
    if (!bestChatterChallenge || !bestChatterChallenge.end_time) return
    
    const updateCountdown = () => {
      const now = new Date().getTime()
      const end = new Date(bestChatterChallenge.end_time).getTime()
      const distance = end - now
      
      if (distance < 0) {
        setTimeLeft('UKONČENO')
        return
      }
      
      const days = Math.floor(distance / (1000 * 60 * 60 * 24))
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)
      
      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`)
    }
    
    updateCountdown()
    const id = setInterval(updateCountdown, 1000)
    return () => clearInterval(id)
  }, [bestChatterChallenge])

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
    // Filter out inactive goals
    const activeGoals = ['daily', 'weekly', 'monthly'].filter((period) => {
      const goalData = goalDataByView[period]
      return goalData?.active !== false
    })
    const order = bestChatterChallenge ? [...activeGoals, 'bestChatter'] : activeGoals
    
    const onKeyDown = (e) => {
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
  }, [view, bestChatterChallenge, goalDataByView])

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-charcoal via-velvet-gray to-charcoal">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/60" />
        <div className="text-center relative z-10 animate-fade-in">
          <div className="mb-8">
            <div className="inline-block animate-spin-slow">
              <svg className="w-20 h-20 text-neon-orchid" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{
            color: '#ff69b4',
            textShadow: '0 0 20px rgba(255,105,180,0.8), 0 0 40px rgba(255,105,180,0.6)'
          }}>
            Načítání...
          </h2>
          <p className="text-pearl/70 text-lg">Připravuji tvá data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden animate-fade-in">
      {/* Fullscreen background - either custom goal/challenge media or default video */}
      {(view === 'bestChatter' && bestChatterChallenge?.media_url) ? (
        // Best Chatter custom media
        bestChatterChallenge.media_url.startsWith('data:image') ? (
          <img 
            key="bestChatter"
            src={bestChatterChallenge.media_url} 
            alt="Challenge background" 
            className="absolute top-0 left-0 w-full h-full object-cover z-0 animate-fade-in"
          />
        ) : bestChatterChallenge.media_url.startsWith('data:video') ? (
          <video 
            key="bestChatter"
            src={bestChatterChallenge.media_url} 
            autoPlay 
            loop 
            muted 
            playsInline
            className="absolute top-0 left-0 w-full h-full object-cover z-0 animate-fade-in"
          />
        ) : null
      ) : (currentGoalData?.media_url && currentGoalData?.active !== false) ? (
        // Custom uploaded media for goals (only if active, defaults to true if undefined)
        currentGoalData.media_url.startsWith('data:image') ? (
          <img 
            key={view}
            src={currentGoalData.media_url} 
            alt="Goal background" 
            className="absolute top-0 left-0 w-full h-full object-cover z-0 animate-fade-in"
          />
        ) : currentGoalData.media_url.startsWith('data:video') ? (
          <video 
            key={view}
            src={currentGoalData.media_url} 
            autoPlay 
            loop 
            muted 
            playsInline
            className="absolute top-0 left-0 w-full h-full object-cover z-0 animate-fade-in"
          />
        ) : null
      ) : (
        // Default rotating video background
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
      )}

      {/* Gradient fade overlay to improve contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/60 z-0 pointer-events-none" />

      <div className="text-center relative z-10">
        {/* View selector (Dnes / Tento Týden / Tento Měsíc / Best Chatter) with goals */}
        <div className="fixed top-2 sm:top-4 lg:top-6 left-1/2 -translate-x-1/2 z-10 flex flex-wrap items-center justify-center gap-1 sm:gap-2 lg:gap-3 animate-slide-in-right px-2 max-w-full">
          {[
            { key: 'daily', label: 'Dnes' },
            { key: 'weekly', label: 'Tento Týden' },
            { key: 'monthly', label: 'Tento Měsíc' }
          ].filter((opt) => {
            // Only show goals that are active
            const goalData = goalDataByView[opt.key]
            return goalData?.active !== false
          }).map((opt, idx) => {
            const isActive = view === opt.key
            const made = baseRevenueByView[opt.key]
            const goal = goalByView[opt.key]
            return (
              <button
                key={opt.key}
                ref={(el) => (buttonRefs.current[idx] = el)}
                onClick={() => setView(opt.key)}
                className={`px-2 py-1.5 sm:px-3 sm:py-2 md:px-5 md:py-3 lg:px-6 lg:py-3.5 rounded-lg sm:rounded-xl text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold outline-none focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-[rgba(255,105,180,0.7)] smooth-hover select-none ${
                  isActive
                    ? 'bg-gradient-to-r from-neon-orchid to-crimson text-white shadow-glow-purple scale-[1.02]'
                    : 'bg-velvet-gray/80 text-pearl border border-neon-orchid/30 hover:shadow-glow'
                }`}
                tabIndex={0}
                aria-pressed={isActive}
                title={`${opt.label} cíl`}
              >
                <div className="flex flex-col items-center leading-tight">
                  <span className="tracking-wide whitespace-nowrap">{opt.label}</span>
                  <span className={`mt-0.5 sm:mt-1 text-[0.7rem] sm:text-[0.8rem] md:text-[0.9rem] lg:text-base font-medium ${isActive ? 'text-white' : 'text-pearl/90'} text-neon-glow whitespace-nowrap`}>
                    {formatNumber(made)} / {formatNumber(goal)}
                  </span>
                </div>
              </button>
            )
          })}
          {/* Best Chatter Button */}
          {bestChatterChallenge && (
            <button
              ref={(el) => (buttonRefs.current[3] = el)}
              onClick={() => setView('bestChatter')}
              className={`px-2 py-1.5 sm:px-3 sm:py-2 md:px-5 md:py-3 lg:px-6 lg:py-3.5 rounded-lg sm:rounded-xl text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold outline-none focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-[rgba(255,215,0,0.7)] smooth-hover select-none ${
                view === 'bestChatter'
                  ? 'bg-gradient-to-r from-sunset-gold to-crimson text-white shadow-glow scale-[1.02]'
                  : 'bg-velvet-gray/80 text-pearl border border-sunset-gold/30 hover:shadow-glow'
              }`}
              tabIndex={0}
              aria-pressed={view === 'bestChatter'}
              title="Best Chatter Challenge"
            >
              <div className="flex flex-col items-center leading-tight">
                <span className="tracking-wide whitespace-nowrap">🏆 Best Chatter</span>
                <span className={`mt-0.5 sm:mt-1 text-[0.7rem] sm:text-[0.8rem] md:text-[0.9rem] lg:text-base font-medium ${view === 'bestChatter' ? 'text-white' : 'text-sunset-gold'} whitespace-nowrap`}>
                  {timeLeft || 'Loading...'}
                </span>
              </div>
            </button>
          )}
        </div>
        <div className="relative">
          {/* Big display - Amount OR Best Chatter Name */}
          {view === 'bestChatter' && topChatters.length > 0 ? (
            /* Best Chatter Winner Name */
            <div className="flex flex-col items-center justify-center mb-2 sm:mb-4 animate-breathe">
              <div className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl mb-2 sm:mb-4 animate-bounce-slow">👑</div>
              <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-7xl xl:text-9xl font-bold text-center leading-none px-4" style={{
                color: '#FFD700',
                textShadow: '0 0 30px rgba(255,215,0,0.9), 0 0 60px rgba(255,215,0,0.5), 0 4px 8px rgba(0,0,0,0.8), -2px -2px 0 rgba(0,0,0,0.5), 2px -2px 0 rgba(0,0,0,0.5), -2px 2px 0 rgba(0,0,0,0.5), 2px 2px 0 rgba(0,0,0,0.5)',
                WebkitTextStroke: '1px rgba(0,0,0,0.3)'
              }}>
                {topChatters[0].display_name || topChatters[0].username}
              </h2>
            </div>
          ) : (
            /* Regular Amount Display */
            <div className={`flex justify-center gap-0.5 sm:gap-1 md:gap-2 items-end select-none animate-breathe mb-2 sm:mb-4 transition-all duration-1000 ease-out ${
              isUpdating ? 'scale-105 brightness-125' : 'scale-100 brightness-100'
            }`} aria-label={formatted}>
              {chars.map((ch, idx) => (
                <span
                  key={idx}
                  className={`inline-block align-baseline ${
                    /\d/.test(ch) ? 'text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl 2xl:text-[12rem]' : 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl'
                  } font-bold leading-none transition-all duration-700 ease-out ${
                    isUpdating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
                  }`}
                  style={{ 
                    transitionDelay: isUpdating ? `${idx * 50}ms` : '0ms',
                    color: '#ff69b4',
                    textShadow: '0 0 20px rgba(255,105,180,0.8), 0 0 40px rgba(255,105,180,0.6), 0 0 60px rgba(255,105,180,0.4), 0 4px 8px rgba(0,0,0,0.8), -2px -2px 0 rgba(0,0,0,0.5), 2px -2px 0 rgba(0,0,0,0.5), -2px 2px 0 rgba(0,0,0,0.5), 2px 2px 0 rgba(0,0,0,0.5)',
                    WebkitTextStroke: '1px rgba(0,0,0,0.3)'
                  }}
                >
                  {ch}
                </span>
              ))}
            </div>
          )}

          {/* Progress bar OR Leaderboard */}
          {view === 'bestChatter' && topChatters.length > 0 ? (
            /* Best Chatter Leaderboard */
            <div className="w-full max-w-4xl mx-auto mb-4 sm:mb-6 lg:mb-8 px-2 sm:px-4">
              {/* Top 3 Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6">
                {/* 2nd Place */}
                {topChatters[1] && (
                  <div className="frosted-stats-primary p-4 rounded-xl order-2 md:order-1">
                    <div className="flex flex-col items-center">
                      <div className="text-3xl md:text-4xl mb-2">🥈</div>
                      {topChatters[1].avatar_url ? (
                        <img
                          src={topChatters[1].avatar_url}
                          alt={topChatters[1].display_name || topChatters[1].username}
                          className="w-20 h-20 rounded-full object-cover border-3 border-neon-orchid/60 mb-2 shadow-lg"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full border-3 border-neon-orchid/60 mb-2 shadow-lg bg-gradient-to-br from-neon-orchid/30 to-crimson/30" />
                      )}
                      <h3 className="text-xl md:text-2xl font-bold text-neon-orchid mb-1 text-center" style={{
                        textShadow: '0 0 15px rgba(218,112,214,0.8)'
                      }}>
                        {topChatters[1].display_name || topChatters[1].username}
                      </h3>
                      <div className="text-pearl text-lg md:text-xl font-semibold">
                        {formatCurrency(topChatters[1].total)}
                      </div>
                      <div className="text-pearl/60 text-xs mt-1">2nd</div>
                    </div>
                  </div>
                )}
                
                {/* 1st Place - Larger */}
                <div className="frosted-stats-gold p-6 rounded-xl transform scale-105 order-1 md:order-2">
                  <div className="flex flex-col items-center">
                    <div className="text-4xl md:text-5xl mb-2">🥇</div>
                    {topChatters[0].avatar_url ? (
                      <img
                        src={topChatters[0].avatar_url}
                        alt={topChatters[0].display_name || topChatters[0].username}
                        className="w-24 h-24 rounded-full object-cover border-4 border-sunset-gold/80 mb-3 shadow-xl"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full border-4 border-sunset-gold/80 mb-3 shadow-xl bg-gradient-to-br from-sunset-gold/30 to-crimson/30" />
                    )}
                    <h3 className="text-2xl md:text-3xl font-bold text-sunset-gold mb-2 text-center" style={{
                      textShadow: '0 0 20px rgba(255,215,0,0.9)'
                    }}>
                      {topChatters[0].display_name || topChatters[0].username}
                    </h3>
                    <div className="text-pearl text-xl md:text-2xl font-bold">
                      {formatCurrency(topChatters[0].total)}
                    </div>
                    <div className="text-sunset-gold text-xs mt-1 font-semibold">WINNER</div>
                  </div>
                </div>

                {/* 3rd Place */}
                {topChatters[2] && (
                  <div className="frosted-stats-crimson p-4 rounded-xl order-3">
                    <div className="flex flex-col items-center">
                      <div className="text-3xl md:text-4xl mb-2">🥉</div>
                      {topChatters[2].avatar_url ? (
                        <img
                          src={topChatters[2].avatar_url}
                          alt={topChatters[2].display_name || topChatters[2].username}
                          className="w-20 h-20 rounded-full object-cover border-3 border-crimson/60 mb-2 shadow-lg"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full border-3 border-crimson/60 mb-2 shadow-lg bg-gradient-to-br from-neon-orchid/30 to-crimson/30" />
                      )}
                      <h3 className="text-xl md:text-2xl font-bold text-crimson mb-1 text-center" style={{
                        textShadow: '0 0 15px rgba(220,38,127,0.8)'
                      }}>
                        {topChatters[2].display_name || topChatters[2].username}
                      </h3>
                      <div className="text-pearl text-lg md:text-xl font-semibold">
                        {formatCurrency(topChatters[2].total)}
                      </div>
                      <div className="text-pearl/60 text-xs mt-1">3rd</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Rest of the leaderboard */}
              {topChatters.length > 3 && (
                <div className="frosted-glass p-3 rounded-xl">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {topChatters.slice(3, 7).map((chatter, idx) => (
                      <div key={chatter.id} className="flex flex-col items-center text-pearl/80 text-xs p-2">
                        {chatter.avatar_url ? (
                          <img
                            src={chatter.avatar_url}
                            alt={chatter.display_name || chatter.username}
                            className="w-12 h-12 rounded-full object-cover border-2 border-neon-orchid/40 mb-2 shadow-md"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full border-2 border-neon-orchid/40 mb-2 shadow-md bg-gradient-to-br from-neon-orchid/30 to-crimson/30" />
                        )}
                        <span className="font-semibold text-center">{idx + 4}. {chatter.display_name || chatter.username}</span>
                        <span className="text-pearl/60 text-[0.65rem]">{formatCurrency(chatter.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Regular Progress Bar */
            <div className="w-full max-w-2xl mx-auto mb-4 sm:mb-6 lg:mb-8 px-2 sm:px-4">
              <div className="relative h-4 sm:h-6 md:h-8 bg-black/50 rounded-full overflow-hidden backdrop-blur-sm border border-neon-orchid/30 sm:border-2">
                <div 
                  className="h-full bg-gradient-to-r from-neon-orchid via-sunset-gold to-crimson transition-all duration-1000 ease-out relative overflow-hidden"
                  style={{ 
                    width: `${Math.min(100, (revenue / (goalByView[view] || 1)) * 100)}%` 
                  }}
                >
                  {/* Animated shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" 
                    style={{
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 2s infinite'
                    }}
                  />
                </div>
                {/* Percentage text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-sm md:text-base drop-shadow-lg" style={{
                    textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6)'
                  }}>
                    {((revenue / (goalByView[view] || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Increment indicator */}
          {isUpdating && (
            <div className="absolute -top-6 -right-6 bg-gradient-to-r from-sunset-gold to-neon-orchid text-white px-4 py-2 rounded-full text-lg font-bold animate-pulse shadow-lg">
              +{formatCurrency(lastIncrement)}
            </div>
          )}
        </div>

        {/* Goal description text OR Best Chatter description */}
        {view === 'bestChatter' ? (
          bestChatterChallenge?.description_text && (
            <div className="mb-3 sm:mb-4 md:mb-6 animate-fade-in px-2 sm:px-4">
              <p className="text-sunset-gold text-base sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold drop-shadow-lg text-neon-glow text-center">
                {bestChatterChallenge.description_text}
              </p>
            </div>
          )
        ) : (
          currentGoalData?.description_text && (
            <div className="mb-3 sm:mb-4 md:mb-6 animate-fade-in px-2 sm:px-4">
              <p className="text-sunset-gold text-base sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold drop-shadow-lg text-neon-glow text-center">
                {currentGoalData.description_text}
              </p>
            </div>
          )
        )}

        {/* Period label OR Countdown timer */}
        {view === 'bestChatter' ? (
          <div className="text-center px-2">
            <p className="text-sunset-gold text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold drop-shadow-lg animate-pulse" style={{
              textShadow: '0 0 20px rgba(255,215,0,0.8), 0 0 40px rgba(255,215,0,0.6)'
            }}>
              {timeLeft}
            </p>
            <p className="text-pearl/70 text-xs sm:text-sm mt-1 sm:mt-2 drop-shadow">
              Čas do konce
            </p>
          </div>
        ) : (
          <>
            <p className="text-pearl/90 text-lg sm:text-xl md:text-2xl lg:text-3xl font-light drop-shadow px-2">
              {view === 'daily' ? 'Dnes' : view === 'weekly' ? 'Tento Týden' : 'Tento Měsíc'}
            </p>
            <p className="text-pearl/70 text-xs sm:text-sm mt-2 sm:mt-4 drop-shadow px-2">
              Aktualizace každých 15 sekund
            </p>
          </>
        )}
        </div>

      {/* Home button bottom-left */}
      <button
        type="button"
        onClick={() => navigate('/nove')}
        className="fixed bottom-2 sm:bottom-4 left-2 sm:left-4 z-10 px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2 rounded-lg bg-velvet-gray/80 text-pearl border border-neon-orchid/30 hover:shadow-glow smooth-hover animate-slide-in-left text-xs sm:text-sm md:text-base"
        title="Home"
      >
        🏠 <span className="hidden sm:inline">Home</span>
      </button>
    </div>
  )
}

export default Skore
