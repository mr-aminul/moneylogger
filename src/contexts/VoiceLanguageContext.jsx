import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'voiceInputLang'

const VoiceLanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
})

export function VoiceLanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved === 'bn' ? 'bn' : 'en'
    } catch {
      return 'en'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language)
    } catch (_) {}
  }, [language])

  const setLanguage = useCallback((lang) => {
    setLanguageState(lang === 'bn' ? 'bn' : 'en')
  }, [])

  return (
    <VoiceLanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </VoiceLanguageContext.Provider>
  )
}

export function useVoiceLanguage() {
  const ctx = useContext(VoiceLanguageContext)
  if (!ctx) throw new Error('useVoiceLanguage must be used within VoiceLanguageProvider')
  return ctx
}
