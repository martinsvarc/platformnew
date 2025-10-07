import { useEffect, useState } from 'react'

const icons = {
  success: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

const typeStyles = {
  success: {
    bg: 'from-emerald-500/20 via-emerald-600/20 to-emerald-500/20',
    border: 'border-emerald-500/50',
    icon: 'text-emerald-400',
    text: 'text-emerald-100',
    accent: 'from-emerald-500 to-emerald-600',
  },
  error: {
    bg: 'from-crimson/20 via-red-600/20 to-crimson/20',
    border: 'border-crimson/50',
    icon: 'text-crimson',
    text: 'text-red-100',
    accent: 'from-crimson to-red-600',
  },
  warning: {
    bg: 'from-sunset-gold/20 via-yellow-600/20 to-sunset-gold/20',
    border: 'border-sunset-gold/50',
    icon: 'text-sunset-gold',
    text: 'text-yellow-100',
    accent: 'from-sunset-gold to-yellow-600',
  },
  info: {
    bg: 'from-neon-orchid/20 via-purple-600/20 to-neon-orchid/20',
    border: 'border-neon-orchid/50',
    icon: 'text-neon-orchid',
    text: 'text-purple-100',
    accent: 'from-neon-orchid to-purple-600',
  },
}

function Toast({ toast, onDismiss }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Slide in animation
    setTimeout(() => setIsVisible(true), 10)
  }, [])

  const handleDismiss = () => {
    setIsExiting(true)
    setTimeout(() => onDismiss(toast.id), 300)
  }

  const style = typeStyles[toast.type] || typeStyles.info

  return (
    <div
      className={`
        relative w-full max-w-md bg-gradient-to-br ${style.bg}
        border ${style.border} rounded-xl shadow-2xl
        backdrop-blur-md p-4 mb-3 overflow-hidden
        transition-all duration-300 ease-out
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      {/* Glow effect */}
      <div className={`absolute inset-0 bg-gradient-to-r ${style.bg} rounded-xl pointer-events-none opacity-50`} />
      
      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-pearl/50 hover:text-pearl transition-colors z-10"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="relative flex gap-3 items-start pr-6">
        {/* Icon */}
        <div className={`flex-shrink-0 ${style.icon}`}>
          {icons[toast.type]}
        </div>

        {/* Message */}
        <div className={`flex-1 ${style.text} text-sm font-medium pt-0.5`}>
          {toast.message}
        </div>
      </div>

      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${style.accent}`} />
    </div>
  )
}

export default Toast

