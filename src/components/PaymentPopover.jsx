import { useState, useEffect, useRef } from 'react'
import PaymentWizard from './PaymentWizard'
import { useCelebration } from '../contexts/CelebrationContext'

function PaymentPopover() {
  const [isOpen, setIsOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const popoverRef = useRef(null)
  const { celebrate } = useCelebration()

  // Handle opening animation
  const handleOpen = () => {
    setIsOpen(true)
    setIsAnimating(true)
    // Small delay to ensure DOM is ready for animation
    setTimeout(() => setIsAnimating(false), 50)
  }

  // Handle closing animation
  const handleClose = () => {
    setIsAnimating(true)
    setTimeout(() => {
      setIsOpen(false)
      setIsAnimating(false)
    }, 300) // Match the duration of the exit animation
  }

  // Handle successful payment submission
  const handlePaymentSuccess = () => {
    celebrate() // Trigger fire celebration on profile picture!
    handleClose()
  }

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Prevent body scroll when popover is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-neon-orchid to-crimson text-white px-6 py-3 rounded-full shadow-lg hover:shadow-glow-purple transition-all duration-300 flex items-center justify-center font-bold hover:scale-105"
        title="Nová platba"
      >
        <span className="text-xl">C$NK</span>
      </button>

      {/* Popover Overlay */}
      {isOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />
          
          {/* Popover Content */}
          <div 
            ref={popoverRef}
            className={`relative w-full h-full max-w-4xl max-h-[90vh] mx-4 my-8 bg-transparent flex items-center justify-center transition-all duration-300 ${isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
          >
            {/* Payment Wizard */}
            <div className="w-full h-full flex items-center justify-center">
              <PaymentWizard onSuccess={handlePaymentSuccess} onClose={handleClose} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default PaymentPopover
