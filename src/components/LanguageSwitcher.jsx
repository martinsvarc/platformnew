import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const { updateUserLanguage } = useAuth()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isChanging, setIsChanging] = useState(false)

  const languages = [
    { code: 'cs', name: 'Čeština', flag: '🇨🇿' },
    { code: 'en', name: 'English', flag: '🇬🇧' }
  ]

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

  const handleLanguageChange = async (languageCode) => {
    if (languageCode === i18n.language) {
      setIsOpen(false)
      return
    }

    setIsChanging(true)
    try {
      const result = await updateUserLanguage(languageCode)
      if (result.success) {
        toast.success(
          languageCode === 'cs' 
            ? 'Jazyk byl změněn na češtinu' 
            : 'Language changed to English'
        )
        setIsOpen(false)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Failed to change language:', error)
      toast.error(
        i18n.language === 'cs' 
          ? 'Nepodařilo se změnit jazyk' 
          : 'Failed to change language'
      )
    } finally {
      setIsChanging(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isChanging}
        className="flex items-center justify-center w-10 h-10 rounded-lg border border-transparent text-pearl hover:bg-charcoal/20 hover:border-neon-orchid/20 hover:scale-110 smooth-hover disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Change language"
        title={currentLanguage.name}
      >
        <span className="text-2xl">{currentLanguage.flag}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 unified-glass rounded-lg border border-neon-orchid/30 overflow-hidden shadow-lg z-50 min-w-[140px]">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                disabled={isChanging}
                className={`w-full flex items-center space-x-2 px-3 py-2 text-left transition-colors ${
                  language.code === i18n.language
                    ? 'bg-gradient-to-r from-neon-orchid to-crimson text-white'
                    : 'text-pearl hover:bg-charcoal/20 hover:text-neon-orchid'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span className="text-lg">{language.flag}</span>
                <span className="font-medium text-sm">{language.name}</span>
                {language.code === i18n.language && (
                  <svg className="ml-auto w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default LanguageSwitcher

