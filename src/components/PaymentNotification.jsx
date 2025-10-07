import { useEffect, useState, useRef } from 'react'

// Default notification sound
const DEFAULT_NOTIFICATION_SOUND = 'https://res.cloudinary.com/dmbzcxhjn/video/upload/v1759802548/ElevenLabs_2025-10-07T02_01_04_Marketa_pvc_sp100_s42_sb45_v3_eak3su.mp3'

function PaymentNotification({ notification, onDismiss }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const audioRef = useRef(null)
  
  const { payment } = notification

  useEffect(() => {
    // Slide in animation
    setTimeout(() => setIsVisible(true), 10)
  }, [])

  // Audio/TTS functionality - plays either custom message OR default sound, never both
  useEffect(() => {
    const hasCustomMessage = payment.message && payment.message.trim()
    
    if (hasCustomMessage) {
      // Play custom TTS message only
      if (!window.speechSynthesis) {
        console.warn('Text-to-speech not supported in this browser')
        return
      }

      // Create speech utterance
      const utterance = new SpeechSynthesisUtterance(payment.message)
      
      // Configure voice settings
      utterance.lang = 'cs-CZ' // Czech language
      utterance.rate = 0.9 // Slightly slower for clarity
      utterance.pitch = 1.0
      utterance.volume = 1.0

      // Event handlers
      utterance.onstart = () => {
        setIsSpeaking(true)
        console.log('Started speaking:', payment.message)
      }
      
      utterance.onend = () => {
        setIsSpeaking(false)
        console.log('Finished speaking')
      }
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event)
        setIsSpeaking(false)
      }

      // Small delay before speaking to let the notification slide in
      const speakTimer = setTimeout(() => {
        window.speechSynthesis.speak(utterance)
      }, 500)

      // Cleanup
      return () => {
        clearTimeout(speakTimer)
        window.speechSynthesis.cancel()
      }
    } else {
      // Play default notification sound
      const audio = new Audio(DEFAULT_NOTIFICATION_SOUND)
      audioRef.current = audio
      
      audio.volume = 1.0
      
      audio.onplay = () => {
        setIsSpeaking(true)
        console.log('Playing default notification sound')
      }
      
      audio.onended = () => {
        setIsSpeaking(false)
        console.log('Default notification sound finished')
      }
      
      audio.onerror = (event) => {
        console.error('Error playing notification sound:', event)
        setIsSpeaking(false)
      }

      // Small delay before playing to let the notification slide in
      const playTimer = setTimeout(() => {
        audio.play().catch(err => {
          console.error('Failed to play notification sound:', err)
        })
      }, 500)

      // Cleanup
      return () => {
        clearTimeout(playTimer)
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current = null
        }
      }
    }
  }, [payment.message])

  const handleDismiss = () => {
    // Stop any ongoing speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    // Stop any ongoing audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsExiting(true)
    setTimeout(() => onDismiss(notification.id), 300)
  }

  // Format amount with thousands separator
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('cs-CZ', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div
      className={`
        relative w-full max-w-md bg-gradient-to-br from-obsidian via-charcoal to-obsidian
        border border-velvet-gray/50 rounded-2xl shadow-2xl
        p-4 mb-3 overflow-hidden
        transition-all duration-300 ease-out
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-neon-orchid/10 to-crimson/10 rounded-2xl pointer-events-none" />
      
      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-pearl/50 hover:text-pearl transition-colors z-10"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="relative flex gap-4">
        {/* User Avatar - Large */}
        <div className="flex-shrink-0">
          {payment.avatar_url ? (
            <img
              src={payment.avatar_url}
              alt={payment.display_name}
              className="w-20 h-20 rounded-full object-cover ring-2 ring-neon-orchid/50"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-orchid to-crimson flex items-center justify-center ring-2 ring-neon-orchid/50">
              <span className="text-2xl font-bold text-white">
                {payment.display_name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
          )}
        </div>

        {/* Payment Details */}
        <div className="flex-1 min-w-0 pt-1">
          {/* Amount - Large and prominent */}
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-gradient-primary">
              {formatAmount(payment.amount)}
            </span>
            <span className="text-lg text-pearl/70 font-medium">
              {payment.currency || 'CZK'}
            </span>
          </div>

          {/* User name */}
          <div className="text-lg font-semibold text-pearl mb-2">
            {payment.display_name || payment.username}
          </div>

          {/* Additional details - smaller text */}
          <div className="space-y-1 text-sm text-pearl/80">
            {payment.client_name && (
              <div className="flex items-center gap-2">
                <span className="text-pearl/60">Klient:</span>
                <span className="font-medium">{payment.client_name}</span>
                {payment.is_new_client && (
                  <span className="px-2 py-0.5 bg-neon-orchid/20 text-neon-orchid text-xs rounded-full border border-neon-orchid/30">
                    NOVÝ
                  </span>
                )}
              </div>
            )}
            
            {payment.prodano && (
              <div className="flex items-center gap-2">
                <span className="text-pearl/60">Prodáno:</span>
                <span>{payment.prodano}</span>
              </div>
            )}
            
            {payment.model && (
              <div className="flex items-center gap-2">
                <span className="text-pearl/60">Model:</span>
                <span>{payment.model}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message - if present */}
      {payment.message && (
        <div className="relative mt-3 pt-3 border-t border-velvet-gray/30">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 mt-0.5">
              {isSpeaking ? (
                <span className="text-lg animate-pulse" title="Přehrává se...">
                  🔊
                </span>
              ) : (
                <span className="text-lg opacity-50">
                  💬
                </span>
              )}
            </div>
            <div className={`flex-1 text-sm italic ${isSpeaking ? 'text-neon-orchid' : 'text-pearl/70'} transition-colors duration-300`}>
              "{payment.message}"
            </div>
          </div>
        </div>
      )}

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-orchid via-crimson to-neon-orchid" />
    </div>
  )
}

export default PaymentNotification

