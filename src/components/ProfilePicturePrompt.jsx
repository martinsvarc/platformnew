import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

function ProfilePicturePrompt() {
  const { user, updateUserAvatar } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const fileInputRef = useRef(null)

  // Check if we should show the prompt
  useEffect(() => {
    if (user && !user.avatar_url) {
      // Check if user has dismissed this prompt before
      const dismissed = localStorage.getItem(`avatar-prompt-dismissed-${user.id}`)
      if (!dismissed) {
        // Show prompt after a short delay
        const timer = setTimeout(() => {
          setIsOpen(true)
        }, 1000)
        return () => clearTimeout(timer)
      }
    }
  }, [user])

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Prosím nahrajte obrázek')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Obrázek je příliš velký. Maximum je 5MB')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!previewUrl) {
      toast.error('Prosím vyberte obrázek')
      return
    }

    setUploading(true)
    try {
      const result = await updateUserAvatar(previewUrl)
      if (result.success) {
        toast.success('Profilový obrázek byl úspěšně nahrán!')
        setIsOpen(false)
        // Navigate to StarTeam page
        navigate('/starteam')
      } else {
        toast.error('Nepodařilo se nahrát obrázek')
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Nastala chyba při nahrávání')
    } finally {
      setUploading(false)
    }
  }

  const handleSkip = () => {
    // Mark as dismissed so it doesn't show again
    if (user?.id) {
      localStorage.setItem(`avatar-prompt-dismissed-${user.id}`, 'true')
    }
    setIsOpen(false)
    // Navigate to StarTeam page
    navigate('/starteam')
  }

  const handleClickOutside = (e) => {
    if (e.target === e.currentTarget) {
      handleSkip()
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in"
      onClick={handleClickOutside}
    >
      <div className="bg-black/30 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl shadow-black/50 max-w-md w-full animate-scale-in">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-neon-orchid to-crimson rounded-full mb-4">
            <span className="text-3xl">📸</span>
          </div>
          <h2 className="text-2xl font-bold text-pearl mb-2">
            Přidejte profilový obrázek
          </h2>
          <p className="text-pearl/70 text-sm">
            Personalizujte svůj profil pomocí profilového obrázku
          </p>
        </div>

        {/* Preview or Upload Area */}
        <div className="mb-6">
          {previewUrl ? (
            <div className="relative">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-neon-orchid/30"
              />
              <button
                onClick={() => {
                  setPreviewUrl(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="absolute top-0 right-1/2 translate-x-16 bg-crimson text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-crimson/80 transition-colors"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-8 border-2 border-dashed border-neon-orchid/40 rounded-xl hover:border-neon-orchid/60 transition-colors flex flex-col items-center justify-center gap-2"
            >
              <div className="text-4xl">📁</div>
              <span className="text-pearl/70 text-sm">
                Klikněte pro výběr obrázku
              </span>
              <span className="text-pearl/50 text-xs">
                PNG, JPG nebo GIF (max 5MB)
              </span>
            </button>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            disabled={uploading}
            className="flex-1 px-6 py-3 border border-pearl/20 rounded-xl text-pearl hover:bg-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Přeskočit
          </button>
          <button
            onClick={handleUpload}
            disabled={!previewUrl || uploading}
            className="flex-1 bg-gradient-to-r from-neon-orchid to-crimson text-white font-bold py-3 px-6 rounded-xl hover:shadow-glow-purple transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {uploading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Nahrávání...</span>
              </div>
            ) : (
              'Nahrát'
            )}
          </button>
        </div>

        {/* Info Text */}
        <p className="text-pearl/50 text-xs text-center mt-4">
          Tento obrázek můžete změnit kdykoliv v navigačním menu
        </p>
      </div>
    </div>
  )
}

export default ProfilePicturePrompt

