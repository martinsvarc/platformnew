import { useEffect, useState } from 'react'

function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 10)
    } else {
      setIsVisible(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const handleCancel = () => {
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-[10001] transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleCancel}
      />
      
      {/* Dialog */}
      <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4 pointer-events-none">
        <div 
          className={`
            pointer-events-auto w-full max-w-md
            bg-gradient-to-br from-obsidian via-charcoal to-obsidian
            border border-velvet-gray/50 rounded-2xl shadow-2xl
            p-6 overflow-hidden
            transition-all duration-300 ease-out
            ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
          `}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-neon-orchid/10 to-crimson/10 rounded-2xl pointer-events-none" />
          
          <div className="relative">
            {/* Icon */}
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-neon-orchid/20 to-crimson/20 border border-neon-orchid/30">
              <svg className="w-6 h-6 text-neon-orchid" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-center text-gradient-primary mb-3">
              {title || 'Potvrdit akci'}
            </h3>

            {/* Message */}
            <p className="text-pearl/80 text-center mb-6">
              {message || 'Opravdu chcete pokračovat?'}
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2.5 rounded-lg bg-velvet-gray text-pearl border border-velvet-gray hover:border-pearl/30 transition-all"
              >
                Zrušit
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-neon-orchid to-crimson text-white shadow-glow-purple hover:brightness-110 transition-all"
              >
                Potvrdit
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ConfirmDialog

