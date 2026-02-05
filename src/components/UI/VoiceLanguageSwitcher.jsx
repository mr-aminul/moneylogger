import { useVoiceLanguage } from '../../contexts/VoiceLanguageContext'

export default function VoiceLanguageSwitcher({ className = '' }) {
  const { language, setLanguage } = useVoiceLanguage()

  return (
    <div
      className={`inline-flex rounded-lg border border-primary-200 dark:border-primary-600 bg-primary-100 dark:bg-primary-800 p-0.5 ${className}`}
      role="group"
      aria-label="Voice input language"
    >
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
          language === 'en'
            ? 'bg-primary-900 dark:bg-primary-600 text-white'
            : 'text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-700'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('bn')}
        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
          language === 'bn'
            ? 'bg-primary-900 dark:bg-primary-600 text-white'
            : 'text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-700'
        }`}
      >
        BN
      </button>
    </div>
  )
}
