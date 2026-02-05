import { useState, useCallback, forwardRef } from 'react'
import { format } from 'date-fns'
import { X } from 'lucide-react'
import { useData } from '../../contexts/DataContext'
import { parseVoiceExpense } from '../../lib/parseVoiceExpense'
import VoiceInputButton from './VoiceInputButton'
import VoiceLanguageSwitcher from './VoiceLanguageSwitcher'

const FloatingActionButton = forwardRef(function FloatingActionButton(props, ref) {
  const { categoryNames, addExpense, formatCurrency } = useData()
  const [voiceMessage, setVoiceMessage] = useState(null) // { type: 'success'|'error', text: string }

  const handleVoiceTranscript = useCallback(
    async (text) => {
      if (!text?.trim()) return
      const parsed = parseVoiceExpense(text.trim(), categoryNames)
      const amount = parsed.amount ? parseFloat(parsed.amount) : 0
      if (!amount || amount <= 0) {
        setVoiceMessage({
          type: 'error',
          text: "Couldn't detect amount. Try: \"orange juice 50\" or \"50 taka orange juice\".",
        })
        return
      }
      try {
        const dateToUse = parsed.date || format(new Date(), 'yyyy-MM-dd')
        await addExpense({
          title: (parsed.title || 'Expense').trim(),
          amount,
          category: parsed.category || 'Others',
          date: dateToUse,
          note: '',
        })
        setVoiceMessage({
          type: 'success',
          text: `Added: ${parsed.title || 'Expense'} — ${formatCurrency(amount)}`,
        })
      } catch (err) {
        setVoiceMessage({
          type: 'error',
          text: err?.message ?? 'Failed to add expense.',
        })
      }
      setTimeout(() => setVoiceMessage(null), 4000)
    },
    [categoryNames, addExpense, formatCurrency]
  )

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-2">
      {/* Success/error toast — fixed top-center so it's impossible to miss */}
      {voiceMessage && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg border max-w-[min(420px,calc(100vw-2rem))] toast-notice ${
            voiceMessage.type === 'success'
              ? 'bg-emerald-100 dark:bg-emerald-900/90 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
              : 'bg-red-100 dark:bg-red-900/90 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800'
          }`}
        >
          <span className="text-sm font-medium flex-1">{voiceMessage.text}</span>
          <button
            type="button"
            onClick={() => setVoiceMessage(null)}
            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <VoiceLanguageSwitcher className="mb-1" />
      <div className="shadow-2xl rounded-full hover:shadow-primary-900/50 transition-shadow">
        <VoiceInputButton
          ref={ref}
          onOpenWithTranscript={handleVoiceTranscript}
          size="lg"
          variant="secondary"
          className="!rounded-full !w-16 !h-16 sm:!w-20 sm:!h-20 !min-w-16 !min-h-16 sm:!min-w-20 sm:!min-h-20 !p-0 hover:scale-110 active:scale-95 transition-transform duration-200 !bg-primary-900 dark:!bg-primary-700 !border-0 text-white hover:!bg-primary-800 dark:hover:!bg-primary-600"
        />
      </div>
    </div>
  )
})

export default FloatingActionButton
