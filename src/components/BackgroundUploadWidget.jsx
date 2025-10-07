import { useState, useEffect, useRef } from 'react'
import { getBackgroundUrl, updateBackgroundUrl, removeBackgroundUrl } from '../api/settings'
import { TEAM_ID } from '../api/config'
import { useConfirm } from '../hooks/useConfirm'
import { useToast } from '../contexts/ToastContext'

// Default background URL
const DEFAULT_BACKGROUND = 'https://res.cloudinary.com/dmbzcxhjn/image/upload/v1759767010/0a80caad8e77bea777fb41bf5438086e_ubbh2h.jpg'

// Cloudinary config
const CLOUDINARY_CLOUD_NAME = 'dmbzcxhjn'
const CLOUDINARY_UPLOAD_PRESET = 'ml_default' // You may need to create an unsigned upload preset in Cloudinary

function BackgroundUploadWidget() {
  const { confirm, ConfirmDialog } = useConfirm()
  const { toast } = useToast()
  const fileInputRef = useRef(null)
  const [backgroundUrl, setBackgroundUrl] = useState('')
  const [inputUrl, setInputUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [uploadMode, setUploadMode] = useState('file') // 'url' or 'file' - default to file

  const loadBackground = async () => {
    if (!TEAM_ID) return
    setLoading(true)
    try {
      const url = await getBackgroundUrl(TEAM_ID)
      setBackgroundUrl(url || DEFAULT_BACKGROUND)
      setInputUrl(url || '')
    } catch (err) {
      console.error('Failed to load background:', err)
      toast.error('Načtení pozadí selhalo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBackground()
  }, [])

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Prosím vyberte obrázek (JPG, PNG, atd.)')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Obrázek je příliš velký. Maximum je 10MB.')
      return
    }

    setUploading(true)
    try {
      // Try uploading to Cloudinary with unsigned upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      const data = await response.json()

      if (!response.ok) {
        // If upload preset doesn't work, fall back to data URL (base64)
        console.warn('Cloudinary upload failed, using data URL instead:', data)
        
        // Use FileReader to convert to base64 data URL
        const reader = new FileReader()
        reader.onload = async (event) => {
          const dataUrl = event.target.result
          
          try {
            // Save data URL to database
            await updateBackgroundUrl(TEAM_ID, dataUrl)
            setBackgroundUrl(dataUrl)
            setInputUrl(dataUrl)
            setShowForm(false)
            toast.success('Pozadí bylo úspěšně nahráno')

            // Trigger a page reload to apply the background
            setTimeout(() => {
              window.location.reload()
            }, 500)
          } catch (err) {
            console.error('Failed to save background:', err)
            toast.error('Uložení pozadí selhalo')
          } finally {
            setUploading(false)
          }
        }
        reader.readAsDataURL(file)
        return
      }

      const uploadedUrl = data.secure_url

      // Save to database
      await updateBackgroundUrl(TEAM_ID, uploadedUrl)
      setBackgroundUrl(uploadedUrl)
      setInputUrl(uploadedUrl)
      setShowForm(false)
      toast.success('Pozadí bylo úspěšně nahráno')

      // Trigger a page reload to apply the background
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (err) {
      console.error('Failed to upload background:', err)
      toast.error('Nahrání obrázku selhalo. Zkuste to prosím znovu.')
    } finally {
      setUploading(false)
    }
  }

  const handleUpdateBackground = async (e) => {
    e.preventDefault()
    if (!inputUrl.trim()) {
      toast.error('Zadejte platnou URL adresu obrázku')
      return
    }

    setSaving(true)
    try {
      await updateBackgroundUrl(TEAM_ID, inputUrl.trim())
      setBackgroundUrl(inputUrl.trim())
      setShowForm(false)
      toast.success('Pozadí bylo úspěšně aktualizováno')
      
      // Trigger a page reload to apply the background
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (err) {
      console.error('Failed to update background:', err)
      toast.error('Aktualizace pozadí selhala')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveBackground = async () => {
    const confirmed = await confirm(
      'Opravdu chcete odstranit vlastní pozadí a vrátit se k výchozímu?',
      'Odstranit pozadí'
    )
    if (!confirmed) return

    setSaving(true)
    try {
      await removeBackgroundUrl(TEAM_ID)
      setBackgroundUrl(DEFAULT_BACKGROUND)
      setInputUrl('')
      toast.success('Pozadí bylo obnoveno na výchozí')
      
      // Trigger a page reload to apply the background
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (err) {
      console.error('Failed to remove background:', err)
      toast.error('Odstranění pozadí selhalo')
    } finally {
      setSaving(false)
    }
  }

  const isDefaultBackground = !inputUrl || backgroundUrl === DEFAULT_BACKGROUND

  if (loading) {
    return (
      <div className="unified-glass p-4">
        <h2 className="text-lg font-bold text-gradient-gold mb-3">Pozadí aplikace</h2>
        <div className="text-pearl/70 text-center py-4">Načítání...</div>
      </div>
    )
  }

  return (
    <>
      <ConfirmDialog />
      <div className="unified-glass p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gradient-gold">Pozadí aplikace</h2>
          <div className="flex gap-2">
            {!isDefaultBackground && (
              <button
                type="button"
                onClick={handleRemoveBackground}
                disabled={saving}
                className="px-3 py-1 rounded-lg bg-crimson/20 hover:bg-crimson/40 text-pearl text-sm font-semibold transition-all disabled:opacity-50"
              >
                🗑️ Odstranit
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              disabled={saving}
              className="px-3 py-1 rounded-lg bg-gradient-to-r from-neon-orchid to-crimson text-white text-sm font-semibold shadow-glow-purple hover:shadow-glow transition-all disabled:opacity-50"
            >
              {showForm ? '✕ Zrušit' : '✏️ Změnit pozadí'}
            </button>
          </div>
        </div>

        {/* Current Background Preview */}
        <div className="mb-4">
          <label className="block text-pearl/80 text-sm mb-2">Aktuální pozadí</label>
          <div 
            className="w-full h-48 rounded-lg border-2 border-velvet-gray bg-obsidian/60 bg-cover bg-center bg-no-repeat relative overflow-hidden group"
            style={{ backgroundImage: `url("${backgroundUrl}")` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian/80 to-transparent flex items-end justify-center p-4">
              <span className="text-pearl/90 text-sm font-medium">
                {isDefaultBackground ? '✨ Výchozí pozadí' : '✅ Vlastní pozadí'}
              </span>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="mb-3 p-4 rounded-lg bg-obsidian/60 border border-neon-orchid/30">
            {/* Toggle between upload modes */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setUploadMode('file')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  uploadMode === 'file'
                    ? 'bg-gradient-to-r from-neon-orchid to-crimson text-white shadow-glow-purple'
                    : 'bg-obsidian border border-velvet-gray text-pearl/70 hover:text-pearl'
                }`}
              >
                📤 Nahrát soubor
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('url')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  uploadMode === 'url'
                    ? 'bg-gradient-to-r from-neon-orchid to-crimson text-white shadow-glow-purple'
                    : 'bg-obsidian border border-velvet-gray text-pearl/70 hover:text-pearl'
                }`}
              >
                🔗 Vložit URL
              </button>
            </div>

            {/* File Upload Mode */}
            {uploadMode === 'file' && (
              <div className="flex flex-col gap-3">
                <label className="block text-pearl/80 text-sm mb-2">
                  Vyberte obrázek ze svého počítače (max 10MB)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-3 rounded-lg bg-gradient-to-r from-neon-orchid to-crimson text-white font-semibold shadow-glow-purple disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>Nahrávání...</span>
                    </>
                  ) : (
                    <>
                      <span>📁</span>
                      <span>Vybrat obrázek</span>
                    </>
                  )}
                </button>
                <p className="text-pearl/60 text-xs">
                  💡 Podporované formáty: JPG, PNG, GIF, WebP
                </p>
              </div>
            )}

            {/* URL Input Mode */}
            {uploadMode === 'url' && (
              <form onSubmit={handleUpdateBackground} className="flex flex-col gap-3">
                <label className="block text-pearl/80 text-sm mb-2">
                  URL adresa obrázku (např. z Cloudinary, Imgur, atd.)
                </label>
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://res.cloudinary.com/..."
                  className="flex-1 bg-obsidian border border-velvet-gray rounded-lg px-3 py-2 text-pearl placeholder-pearl/50 focus:border-neon-orchid focus:shadow-glow-purple outline-none"
                  autoFocus
                  required
                />
                
                {/* Preview of new URL */}
                {inputUrl && (
                  <div className="relative">
                    <label className="block text-pearl/80 text-xs mb-1">Náhled</label>
                    <div 
                      className="w-full h-32 rounded-lg border border-velvet-gray bg-obsidian/40 bg-cover bg-center bg-no-repeat"
                      style={{ backgroundImage: `url("${inputUrl}")` }}
                    />
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={saving || !inputUrl.trim()}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-neon-orchid to-crimson text-white font-semibold shadow-glow-purple disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Ukládání...' : '💾 Uložit pozadí'}
                </button>
              </form>
            )}
          </div>
        )}

        <div className="mt-3 text-pearl/60 text-xs space-y-1">
          <p>💡 Pozadí se zobrazí na všech stránkách kromě Admin a přihlašovacích stránek</p>
          <p>🖼️ Doporučený formát: JPG nebo PNG, min. 1920×1080px</p>
          <p>📤 Můžete nahrát vlastní obrázek nebo vložit URL z Cloudinary/Imgur</p>
        </div>
      </div>
    </>
  )
}

export default BackgroundUploadWidget

