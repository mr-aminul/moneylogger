import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { Mic, MicOff, Loader2, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useData } from '../../contexts/DataContext'
import { useVoiceLanguage } from '../../contexts/VoiceLanguageContext'

const SpeechRecognitionAPI =
  typeof window !== 'undefined' &&
  (window.SpeechRecognition || window.webkitSpeechRecognition)

const VoiceInputButton = forwardRef(function VoiceInputButton({
  onOpenWithTranscript,
  className = '',
  size = 'md',
  variant = 'secondary',
}, ref) {
  const { user } = useAuth()
  const { refetchExpenses } = useData()
  const { language: voiceLanguage } = useVoiceLanguage()
  const [status, setStatus] = useState('idle') // idle | listening | processing | success | error
  const [message, setMessage] = useState('')
  const [liveTranscript, setLiveTranscript] = useState('') // word-by-word caption while listening
  const recognitionRef = useRef(null)
  const resultReceivedRef = useRef(false)
  const holdModeRef = useRef(false)
  const lastTranscriptRef = useRef('')

  const webhookUrl = import.meta.env.VITE_N8N_VOICE_WEBHOOK_URL?.trim() || null

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (_) {}
      recognitionRef.current = null
    }
  }, [])

  const submitTranscript = useCallback(
    (trimmed) => {
      if (webhookUrl) {
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: trimmed, user_id: user.id }),
        })
          .then(async (res) => {
            const body = await res.json().catch(() => ({}))
            if (!res.ok) {
              const msg = body?.message || body?.error?.message || res.statusText || 'Workflow failed'
              throw new Error(msg)
            }
            return body
          })
          .then((body) => {
            if (body && body.ok === false) {
              setStatus('error')
              setMessage(body.reason || body.message || 'Expense could not be added.')
              return
            }
            setStatus('success')
            setMessage('Expense added from voice!')
            refetchExpenses?.()
            setTimeout(() => {
              setStatus('idle')
              setMessage('')
            }, 2500)
          })
          .catch((err) => {
            setStatus('error')
            setMessage(err.message || 'Failed to add expense from voice.')
          })
      } else {
        onOpenWithTranscript?.(trimmed)
        setStatus('idle')
      }
    },
    [user?.id, webhookUrl, onOpenWithTranscript, refetchExpenses]
  )

  const startListening = useCallback(
    (holdMode = false) => {
      if (!SpeechRecognitionAPI) {
        setStatus('error')
        setMessage('Voice input is not supported in this browser. Try Chrome or Edge.')
        return
      }
      if (!user?.id) {
        setStatus('error')
        setMessage('Please sign in to add an expense.')
        return
      }

      setMessage('')
      setLiveTranscript('')
      setStatus('listening')
      resultReceivedRef.current = false
      holdModeRef.current = holdMode
      lastTranscriptRef.current = ''

      const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new Recognition()
      recognition.continuous = holdMode
      recognition.interimResults = true
      recognition.lang = voiceLanguage === 'bn' ? 'bn-BD' : 'en-US'

      recognition.onresult = (event) => {
        const results = event.results
        let fullTranscript = ''
        for (let i = 0; i < results.length; i++) {
          fullTranscript += (results[i][0]?.transcript || '')
          if (i < results.length - 1) fullTranscript += ' '
        }
        const trimmed = fullTranscript.trim()
        lastTranscriptRef.current = trimmed
        setLiveTranscript(trimmed)

        if (holdMode) return

        const last = results.length - 1
        const isFinal = results[last]?.isFinal
        if (!isFinal) return

        resultReceivedRef.current = true
        if (!trimmed) {
          setStatus('error')
          setMessage('No speech detected. Try again.')
          setLiveTranscript('')
          return
        }

        setStatus('processing')
        setLiveTranscript('')
        submitTranscript(trimmed)
      }

      recognition.onerror = (event) => {
        setLiveTranscript('')
        if (holdModeRef.current) return
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setStatus('error')
          setMessage('Microphone access denied. Allow mic in browser settings.')
        } else if (event.error === 'no-speech') {
          setStatus('error')
          setMessage('No speech detected. Try again.')
        } else {
          setStatus('error')
          setMessage('Voice recognition failed. Try again.')
        }
      }

      recognition.onend = () => {
        recognitionRef.current = null
        if (holdModeRef.current) return
        if (!resultReceivedRef.current) {
          setStatus('idle')
          setLiveTranscript('')
        }
      }

      recognitionRef.current = recognition
      recognition.start()
    },
    [user?.id, voiceLanguage, submitTranscript]
  )

  const startHold = useCallback(() => {
    if (status === 'processing') return
    if (status === 'listening') return
    startListening(true)
  }, [status, startListening])

  const endHold = useCallback(() => {
    if (!holdModeRef.current || !recognitionRef.current) return
    resultReceivedRef.current = true
    holdModeRef.current = false
    stopListening()
    const trimmed = lastTranscriptRef.current.trim()
    setLiveTranscript('')
    if (!trimmed) {
      setStatus('error')
      setMessage('No speech detected. Try again.')
      return
    }
    setStatus('processing')
    submitTranscript(trimmed)
  }, [stopListening, submitTranscript])

  const handleClick = () => {
    if (status === 'listening') {
      if (holdModeRef.current) {
        endHold()
        return
      }
      stopListening()
      setStatus('idle')
      setLiveTranscript('')
      return
    }
    if (status === 'processing') return
    startListening(false)
  }

  useImperativeHandle(ref, () => ({
    trigger: handleClick,
    startHold,
    endHold,
  }), [status, handleClick, startHold, endHold])

  const showWebhookToast = (status === 'success' || status === 'error') && message
  const dismissToast = useCallback(() => {
    setStatus('idle')
    setMessage('')
  }, [])

  const sizeClasses = size === 'sm' ? 'p-2' : size === 'lg' ? 'p-4' : 'p-3'
  const iconSize = size === 'sm' ? 20 : size === 'lg' ? 28 : 24

  const baseClasses =
    'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-primary-900 min-w-[44px] min-h-[44px] touch-target'
  const variantClasses =
    variant === 'secondary'
      ? 'bg-white/20 dark:bg-primary-700/80 text-white hover:bg-white/30 dark:hover:bg-primary-600 border border-white/30 dark:border-primary-600 focus:ring-primary-400'
      : 'bg-primary-800 dark:bg-primary-600 text-white hover:bg-primary-700 dark:hover:bg-primary-500 border border-primary-600 focus:ring-primary-400'

  return (
    <div className="inline-flex flex-col items-center gap-1">
      {/* Webhook success/error — same fixed top-center toast as FAB/Dashboard */}
      {showWebhookToast && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg border max-w-[min(420px,calc(100vw-2rem))] toast-notice ${
            status === 'success'
              ? 'bg-emerald-100 dark:bg-emerald-900/90 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
              : 'bg-red-100 dark:bg-red-900/90 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800'
          }`}
        >
          <span className="text-sm font-medium flex-1">{message}</span>
          <button
            type="button"
            onClick={dismissToast}
            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={status === 'processing'}
        className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className} ${
          status === 'listening' ? 'animate-pulse ring-2 ring-white/50' : ''
        }`}
        aria-label={status === 'listening' ? 'Stop listening' : 'Add expense with voice'}
        title={status === 'listening' ? 'Stop listening' : 'Say title and amount (e.g. "orange juice 50" or "50 taka coffee")'}
      >
        {status === 'processing' ? (
          <Loader2 className="animate-spin" style={{ width: iconSize, height: iconSize }} />
        ) : status === 'listening' ? (
          <MicOff style={{ width: iconSize, height: iconSize }} />
        ) : (
          <Mic style={{ width: iconSize, height: iconSize }} />
        )}
      </button>
      {status === 'listening' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 dark:bg-black/50 pointer-events-none">
          <div className="text-center max-w-4xl w-full">
            <p className="text-xs sm:text-sm text-primary-200 dark:text-primary-300 mb-2 uppercase tracking-wider">
              Live caption
            </p>
            <p className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-white drop-shadow-lg min-h-[1.5em]">
              {liveTranscript || (
                <span className="opacity-70">e.g. orange juice 50 or 50tk coffee</span>
              )}
            </p>
          </div>
        </div>
      )}
      {/* Inline message only when not showing the toast (e.g. listening errors before final) */}
      {message && !showWebhookToast && (
        <span
          className={`text-xs max-w-[180px] text-center ${
            status === 'error' ? 'text-red-200 dark:text-red-400' : 'text-primary-200 dark:text-primary-300'
          }`}
        >
          {message}
        </span>
      )}
    </div>
  )
})

export default VoiceInputButton
