import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useData } from '../../contexts/DataContext'

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
  const [status, setStatus] = useState('idle') // idle | listening | processing | success | error
  const [message, setMessage] = useState('')
  const [liveTranscript, setLiveTranscript] = useState('') // word-by-word caption while listening
  const recognitionRef = useRef(null)
  const resultReceivedRef = useRef(false)

  const webhookUrl = import.meta.env.VITE_N8N_VOICE_WEBHOOK_URL?.trim() || null

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (_) {}
      recognitionRef.current = null
    }
  }, [])

  const startListening = useCallback(() => {
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

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new Recognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      const results = event.results
      const last = results.length - 1
      let fullTranscript = ''
      for (let i = 0; i <= last; i++) {
        fullTranscript += (results[i][0]?.transcript || '')
        if (i < last) fullTranscript += ' '
      }
      const trimmed = fullTranscript.trim()

      setLiveTranscript(trimmed)

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

      if (webhookUrl) {
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: trimmed, user_id: user.id }),
        })
          .then((res) => {
            if (!res.ok) throw new Error(res.statusText || 'Webhook failed')
            return res.json().catch(() => ({}))
          })
          .then(() => {
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
    }

    recognition.onerror = (event) => {
      setLiveTranscript('')
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
      if (!resultReceivedRef.current) {
        setStatus('idle')
        setLiveTranscript('')
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [user?.id, webhookUrl, onOpenWithTranscript, refetchExpenses, status])

  const handleClick = () => {
    if (status === 'listening') {
      stopListening()
      setStatus('idle')
      setLiveTranscript('')
      return
    }
    if (status === 'processing') return
    startListening()
  }

  useImperativeHandle(ref, () => ({
    trigger: handleClick,
  }), [status, handleClick])

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
      <button
        type="button"
        onClick={handleClick}
        disabled={status === 'processing'}
        className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className} ${
          status === 'listening' ? 'animate-pulse ring-2 ring-white/50' : ''
        }`}
        aria-label={status === 'listening' ? 'Stop listening' : 'Add expense with voice'}
        title={status === 'listening' ? 'Stop listening' : 'Say your expense (e.g. "50 dollars on food")'}
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
        <div className="w-full max-w-[280px] min-h-[2.5rem] px-3 py-2 rounded-lg bg-black/20 dark:bg-black/30 border border-white/20 dark:border-primary-600/50">
          <p className="text-xs text-primary-300 dark:text-primary-400 mb-0.5">Live caption</p>
          <p className="text-sm font-medium text-white min-h-[1.25rem]">
            {liveTranscript || <span className="opacity-60">Say your expense…</span>}
          </p>
        </div>
      )}
      {message && (
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
