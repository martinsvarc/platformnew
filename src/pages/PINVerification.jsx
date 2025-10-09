import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { verifyPIN, getStoredPINData } from '../utils/biometric'
import { get2FASettings } from '../api/auth'
import { getBackgroundUrl } from '../api/settings'
import { TEAM_ID } from '../api/config'

function PINVerification() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [pin, setPin] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  
  const inputRefs = useRef([])

  // Default background URL
  const DEFAULT_BG = 'https://res.cloudinary.com/dmbzcxhjn/image/upload/v1759767010/0a80caad8e77fb41bf5438086e_ubbh2h.jpg'
  const [backgroundUrl, setBackgroundUrl] = useState(DEFAULT_BG)
  const [backgroundLoaded, setBackgroundLoaded] = useState(false)

  // Load background URL from settings
  useEffect(() => {
    const loadBackground = async () => {
      if (!TEAM_ID) {
        setBackgroundLoaded(true)
        return
      }
      
      try {
        const url = await getBackgroundUrl(TEAM_ID)
        setBackgroundUrl(url || DEFAULT_BG)
      } catch (err) {
        console.error('Failed to load background:', err)
        setBackgroundUrl(DEFAULT_BG)
      } finally {
        setBackgroundLoaded(true)
      }
    }
    
    loadBackground()
  }, [])

  useEffect(() => {
    // Check if PIN is set up on mount, redirect to login if not
    const storedPINData = getStoredPINData()
    if (!storedPINData || !storedPINData.pinHash) {
      console.log('PIN not set up on mount, redirecting to login')
      localStorage.clear()
      navigate('/login', { replace: true })
      return
    }
    
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [navigate])

  const handlePinChange = (index, value) => {
    if (!/^\d*$/.test(value)) return // Only allow digits

    const newPin = [...pin]
    
    if (value.length <= 1) {
      newPin[index] = value
      setPin(newPin)

      // Auto-focus next input with setTimeout for better reliability
      if (value && index < 5) {
        setTimeout(() => {
          inputRefs.current[index + 1]?.focus()
        }, 0)
      }

      // Auto-submit when all 6 digits are entered
      if (value && index === 5) {
        const pinString = newPin.join('')
        if (pinString.length === 6) {
          setTimeout(() => handleVerify(pinString), 100)
        }
      }
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    if (!/^\d+$/.test(pastedData)) return

    const newPin = [...pin]
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newPin[i] = pastedData[i]
    }
    
    setPin(newPin)
    
    if (pastedData.length === 6) {
      handleVerify(pastedData)
    } else if (pastedData.length > 0) {
      inputRefs.current[Math.min(pastedData.length, 5)]?.focus()
    }
  }

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const handleVerify = async (pinString = null) => {
    const pinToVerify = pinString || pin.join('')
    
    if (pinToVerify.length !== 6) {
      setError('Please enter all 6 digits')
      triggerShake()
      return
    }

    setLoading(true)
    setError('')

    try {
      // Get stored PIN data
      const storedPINData = getStoredPINData()
      
      if (!storedPINData || !storedPINData.pinHash) {
        // PIN not set up - clear stale session and redirect to login
        console.log('PIN not set up, clearing session and redirecting to login')
        localStorage.clear()
        navigate('/login', { replace: true })
        return
      }

      // Verify PIN locally first
      const isValid = verifyPIN(pinToVerify, storedPINData.pinHash)
      
      if (!isValid) {
        throw new Error('Incorrect PIN')
      }

      // Mark as verified
      localStorage.setItem('pin_verified', 'true')
      localStorage.setItem('verificationTime', Date.now().toString())
      localStorage.removeItem('pending2FAVerification')

      // Redirect to intended page or home
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    } catch (err) {
      console.error('PIN verification error:', err)
      setError(err.message || 'Incorrect PIN. Please try again.')
      triggerShake()
      setPin(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const PinInput = ({ value, onChange, onKeyDown, onPaste, inputRef, index, autoFocus }) => (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={1}
      value={value}
      onChange={(e) => {
        const newValue = e.target.value.replace(/[^0-9]/g, '')
        onChange(index, newValue)
      }}
      onKeyDown={(e) => onKeyDown(index, e)}
      onPaste={onPaste}
      onFocus={(e) => e.target.select()}
      autoFocus={autoFocus}
      autoComplete="off"
      disabled={loading}
      className="w-14 h-14 sm:w-16 sm:h-16 
                 text-center text-2xl sm:text-3xl font-bold 
                 bg-obsidian border-2 border-velvet-gray rounded-xl
                 focus:border-neon-orchid focus:shadow-glow-purple focus:scale-105 outline-none
                 transition-all duration-200
                 text-pearl flex-shrink-0 disabled:opacity-50"
      style={{
        WebkitTextSecurity: value ? 'disc' : 'none',
        textSecurity: value ? 'disc' : 'none'
      }}
    />
  )

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative p-4"
      style={{
        backgroundImage: `url(${backgroundUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-obsidian/90 via-charcoal/85 to-obsidian/90 backdrop-blur-sm" />
      
      <div className={`relative z-10 w-full max-w-lg ${shake ? 'animate-shake' : ''}`}>
        <div className="unified-glass p-8 sm:p-10 md:p-12 rounded-2xl">
          <div className="text-center mb-8">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.display_name}
                className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-neon-orchid/50 object-cover"
              />
            ) : (
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-neon-orchid to-crimson flex items-center justify-center">
                <span className="text-3xl text-white">{user?.display_name?.[0] || '?'}</span>
              </div>
            )}
            
            <h2 className="text-2xl sm:text-3xl font-bold text-gradient-primary mb-1">
              Welcome back!
            </h2>
            <p className="text-pearl/70 text-sm sm:text-base">
              {user?.display_name || user?.username}
            </p>
            <p className="text-pearl/50 text-xs sm:text-sm mt-2">
              Enter your PIN to continue
            </p>
          </div>

          <div className="flex justify-center items-center gap-3 sm:gap-4 mb-8 py-2">
            {pin.map((digit, index) => (
              <PinInput
                key={index}
                value={digit}
                onChange={handlePinChange}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                inputRef={(el) => (inputRefs.current[index] = el)}
                index={index}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-crimson/20 border border-crimson/50 rounded-lg text-crimson text-sm text-center flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {loading && (
            <div className="mb-4 text-center text-pearl/70 text-sm flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-pearl/30 border-t-pearl rounded-full animate-spin" />
              Verifying...
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-lg font-medium text-sm
                     bg-velvet-gray/40 text-pearl/70 hover:text-pearl hover:bg-velvet-gray/60
                     transition-all mt-4"
          >
            Sign out
          </button>
        </div>

        <div className="mt-6 text-center text-pearl/50 text-sm">
          <p>🔒 Your session requires PIN verification</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
      `}</style>
    </div>
  )
}

export default PINVerification

