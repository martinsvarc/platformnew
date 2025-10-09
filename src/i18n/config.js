import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import cs from './locales/cs.json'
import en from './locales/en.json'

const resources = {
  cs: {
    translation: cs
  },
  en: {
    translation: en
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'cs', // Czech as default
    lng: 'cs', // Default language
    debug: false,
    interpolation: {
      escapeValue: false // React already safes from xss
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng'
    }
  })

export default i18n

