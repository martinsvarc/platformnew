import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { hashPIN, storePINLocally } from '../utils/biometric'
import { setupPIN } from '../api/auth'

function PINSetup({ onComplete }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState('enter') // 'enter', 'confirm', 'success'
  const [pin, setPin] = useState(['', '', '', '', '', ''])
  const [confirmPin, setConfirmPin] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  
  const inputRefs = useRef([])
  const confirmInputRefs = useRef([])

  useEffect(() => {
    // Focus first input on mount
    if (step === 'enter' && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    } else if (step === 'confirm' && confirmInputRefs.current[0]) {
      confirmInputRefs.current[0].focus()
    }
  }, [step])

  const handlePinChange = (index, value, isConfirm = false) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return

    const refs = isConfirm ? confirmInputRefs : inputRefs
    const currentPin = isConfirm ? [...confirmPin] : [...pin]
    const setCurrentPin = isConfirm ? setConfirmPin : setPin

    // Handle single character input
    if (value.length === 1) {
      currentPin[index] = value
      setCurrentPin(currentPin)

      // Auto-focus next input immediately
      if (index < 5) {
        // Use setTimeout to ensure focus happens after state update
        setTimeout(() => {
          refs.current[index + 1]?.focus()
        }, 0)
      }
    } else if (value.length === 0) {
      // Handle deletion
      currentPin[index] = ''
      setCurrentPin(currentPin)
    }
  }

  const handleKeyDown = (index, e, isConfirm = false) => {
    const refs = isConfirm ? confirmInputRefs : inputRefs
    const currentPin = isConfirm ? [...confirmPin] : [...pin]
    const setCurrentPin = isConfirm ? setConfirmPin : setPin

    if (e.key === 'Backspace') {
      if (!currentPin[index] && index > 0) {
        // If current is empty, go back and clear previous
        e.preventDefault()
        const newPin = [...currentPin]
        newPin[index - 1] = ''
        setCurrentPin(newPin)
        refs.current[index - 1]?.focus()
      } else if (currentPin[index]) {
        // Clear current field
        const newPin = [...currentPin]
        newPin[index] = ''
        setCurrentPin(newPin)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      refs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault()
      refs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e, isConfirm = false) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    if (!/^\d+$/.test(pastedData)) return

    const newPin = [...(isConfirm ? confirmPin : pin)]
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newPin[i] = pastedData[i]
    }
    
    if (isConfirm) {
      setConfirmPin(newPin)
      if (pastedData.length === 6) {
        confirmInputRefs.current[5]?.focus()
      }
    } else {
      setPin(newPin)
      if (pastedData.length === 6) {
        inputRefs.current[5]?.focus()
      }
    }
  }

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const handleContinue = () => {
    const pinString = pin.join('')
    if (pinString.length !== 6) {
      setError('Please enter all 6 digits')
      triggerShake()
      return
    }

    setError('')
    setStep('confirm')
  }

  const handleConfirm = async () => {
    const pinString = pin.join('')
    const confirmPinString = confirmPin.join('')

    if (confirmPinString.length !== 6) {
      setError('Please enter all 6 digits')
      triggerShake()
      return
    }

    if (pinString !== confirmPinString) {
      setError('PINs do not match. Please try again.')
      triggerShake()
      setConfirmPin(['', '', '', '', '', ''])
      confirmInputRefs.current[0]?.focus()
      return
    }

    setLoading(true)
    try {
      // Hash the PIN
      const pinHash = hashPIN(pinString)
      
      // Save to database
      await setupPIN(user.id, pinHash)
      
      // Store locally
      storePINLocally(user.id, pinHash)
      
      setError('')
      setStep('success')
      
      // Complete after showing success
      setTimeout(() => {
        if (onComplete) {
          onComplete()
        } else {
          navigate('/')
        }
      }, 2000)
    } catch (err) {
      setError(err.message || 'Failed to set up PIN')
      triggerShake()
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setError('')
    setConfirmPin(['', '', '', '', '', ''])
    setStep('enter')
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
        const newValue = e.target.value.replace(/[^0-9]/g, '') // Only allow digits
        onChange(index, newValue)
      }}
      onKeyDown={(e) => onKeyDown(index, e)}
      onPaste={onPaste}
      onFocus={(e) => e.target.select()} // Select content on focus for easy replacement
      autoFocus={autoFocus}
      autoComplete="off"
      className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 
                 text-center text-xl sm:text-2xl md:text-3xl font-bold 
                 bg-obsidian border-2 border-velvet-gray rounded-xl
                 focus:border-neon-orchid focus:shadow-glow-purple focus:scale-105 outline-none
                 transition-all duration-200
                 text-pearl flex-shrink-0"
      style={{
        WebkitTextSecurity: value ? 'disc' : 'none',
        textSecurity: value ? 'disc' : 'none'
      }}
    />
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-obsidian via-charcoal to-obsidian flex items-center justify-center p-4">
      <div className={`w-full max-w-md ${shake ? 'animate-shake' : ''}`}>
        <div className="unified-glass p-6 sm:p-8 md:p-10 rounded-2xl overflow-visible">
          {step === 'enter' && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-neon-orchid to-crimson flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gradient-primary mb-2">
                  Create your PIN
                </h2>
                <p className="text-pearl/70 text-sm sm:text-base">
                  Choose a 6-digit PIN to secure your account
                </p>
              </div>

              <div className="flex justify-center items-center gap-2 sm:gap-3 mb-6 px-2 py-4 overflow-visible">
                {pin.map((digit, index) => (
                  <PinInput
                    key={index}
                    value={digit}
                    onChange={handlePinChange}
                    onKeyDown={handleKeyDown}
                    onPaste={(e) => handlePaste(e, false)}
                    inputRef={(el) => (inputRefs.current[index] = el)}
                    index={index}
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-crimson/20 border border-crimson/50 rounded-lg text-crimson text-sm text-center">
                  {error}
                </div>
              )}

              <button
                onClick={handleContinue}
                disabled={pin.join('').length !== 6}
                className="w-full py-4 rounded-xl font-semibold text-lg
                         bg-gradient-to-r from-neon-orchid to-crimson text-white
                         disabled:from-velvet-gray disabled:to-velvet-gray disabled:text-pearl/50
                         shadow-glow-purple hover:shadow-glow transition-all
                         disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </>
          )}

          {step === 'confirm' && (
            <>
              <div className="text-center mb-8">
                <button
                  onClick={handleBack}
                  className="absolute top-6 left-6 p-2 rounded-lg hover:bg-velvet-gray/40 text-pearl transition-all"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gradient-primary mb-2">
                  Confirm your PIN
                </h2>
                <p className="text-pearl/70 text-sm sm:text-base">
                  Enter your PIN again to confirm
                </p>
              </div>

              <div className="flex justify-center items-center gap-2 sm:gap-3 mb-6 px-2 py-4 overflow-visible">
                {confirmPin.map((digit, index) => (
                  <PinInput
                    key={index}
                    value={digit}
                    onChange={(idx, val) => handlePinChange(idx, val, true)}
                    onKeyDown={(idx, e) => handleKeyDown(idx, e, true)}
                    onPaste={(e) => handlePaste(e, true)}
                    inputRef={(el) => (confirmInputRefs.current[index] = el)}
                    index={index}
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-crimson/20 border border-crimson/50 rounded-lg text-crimson text-sm text-center">
                  {error}
                </div>
              )}

              <button
                onClick={handleConfirm}
                disabled={confirmPin.join('').length !== 6 || loading}
                className="w-full py-4 rounded-xl font-semibold text-lg
                         bg-gradient-to-r from-emerald-500 to-teal-500 text-white
                         disabled:from-velvet-gray disabled:to-velvet-gray disabled:text-pearl/50
                         shadow-glow-purple hover:shadow-glow transition-all
                         disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Setting up...
                  </>
                ) : (
                  'Confirm PIN'
                )}
              </button>
            </>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center animate-scale-in">
                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gradient-primary mb-2">
                PIN Set Up Successfully!
              </h2>
              <p className="text-pearl/70">
                Your account is now secured with a 6-digit PIN
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-pearl/50 text-sm">
          <p>💡 Make sure to remember your PIN</p>
          <p className="mt-1">You'll need it to access your account</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        @keyframes scale-in {
          0% { transform: scale(0); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}

export default PINSetup

