import { useState, useEffect, useCallback, useMemo } from 'react'
import { useData } from '../contexts/DataContext'
import { X, Link2, ChevronLeft, ChevronRight } from 'lucide-react'
import CategoryIcon from './CategoryIcon'

const ADD_EXPENSE_STEPS = ['amount', 'title', 'category']
const ADD_INCOME_STEPS = ['amount', 'title']

export default function ExpenseModal({
  transaction,
  type = 'expense',
  onClose,
  initialTitle = '',
  initialAmount = '',
  initialCategory = '',
}) {
  const { addExpense, addIncome, updateExpense, categoryNames, findMatchingUpcomingForExpense } = useData()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [upcomingConfirmMatch, setUpcomingConfirmMatch] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: categoryNames[0] || '',
    date: new Date().toISOString().split('T')[0],
    note: '',
  })

  const isIncome = type === 'income'
  const label = isIncome ? 'Income' : 'Expense'
  const isEdit = !!transaction

  const steps = useMemo(
    () => (isIncome ? ADD_INCOME_STEPS : ADD_EXPENSE_STEPS),
    [isIncome]
  )
  const [step, setStep] = useState(0)
  const currentStepId = steps[step]
  const isFirstStep = step === 0
  const isLastStep = step === steps.length - 1

  useEffect(() => {
    if (transaction) {
      setFormData({
        title: transaction.title || '',
        amount: transaction.amount ?? '',
        category: transaction.category || categoryNames[0] || '',
        date: transaction.date || new Date().toISOString().split('T')[0],
        note: transaction.note || '',
      })
    } else {
      const validCategory =
        initialCategory && categoryNames.includes(initialCategory)
          ? initialCategory
          : categoryNames[0] || ''
      const today = new Date().toISOString().split('T')[0]
      setFormData((prev) => ({
        ...prev,
        date: today,
        note: '',
        ...(initialTitle && initialTitle !== 'Expense' && { title: initialTitle }),
        ...(initialAmount && { amount: String(initialAmount) }),
        ...(validCategory && { category: validCategory }),
      }))
    }
  }, [transaction, categoryNames, initialTitle, initialAmount, initialCategory])

  useEffect(() => {
    if (!isEdit) setStep(0)
  }, [isEdit])

  const canProceedFromStep = useCallback(() => {
    switch (currentStepId) {
      case 'amount':
        return formData.amount !== '' && !isNaN(parseFloat(formData.amount)) && parseFloat(formData.amount) >= 0
      case 'title':
        return (formData.title || '').trim() !== ''
      case 'category':
        return !!(formData.category && formData.category.trim())
      default:
        return true
    }
  }, [currentStepId, formData])

  const goNext = () => {
    if (!canProceedFromStep()) return
    setError('')
    if (isLastStep) return
    setStep((s) => Math.min(s + 1, steps.length - 1))
  }

  const goBack = () => {
    setError('')
    setStep((s) => Math.max(0, s - 1))
  }

  const handleSubmit = async (e, linkedRecurringId = null) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (transaction) {
        const updates = isIncome ? { ...formData, category: undefined } : formData
        await updateExpense(transaction.id, updates)
      } else if (isIncome) {
        await addIncome(formData)
      } else {
        const payload = { ...formData }
        if (linkedRecurringId) payload.recurringTransactionId = linkedRecurringId
        await addExpense(payload)
      }
      onClose()
    } catch (err) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitClick = (e, fromButton = false) => {
    e.preventDefault()
    // In step-flow add expense, only run submit when the Add button was explicitly clicked (stops category select from auto-submitting)
    if (!isEdit && !isIncome && !fromButton) {
      return
    }
    if (transaction || isIncome) {
      handleSubmit(e)
      return
    }
    const match = findMatchingUpcomingForExpense?.(formData.amount, formData.category, formData.date)
    if (match) {
      setUpcomingConfirmMatch(match)
    } else {
      handleSubmit(e)
    }
  }

  const handleUpcomingConfirm = (linkIt) => {
    const fakeEvent = { preventDefault: () => {} }
    handleSubmit(fakeEvent, linkIt ? upcomingConfirmMatch.id : null)
    setUpcomingConfirmMatch(null)
  }

  const dismissConfirm = useCallback(() => {
    if (upcomingConfirmMatch && !submitting) {
      handleUpcomingConfirm(false)
    }
  }, [upcomingConfirmMatch, submitting])

  useEffect(() => {
    if (!upcomingConfirmMatch) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        dismissConfirm()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [upcomingConfirmMatch, dismissConfirm])

  return (
    <>
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-primary-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-primary-800 flex items-center justify-between px-4 py-3 sm:p-6 border-b border-primary-200 dark:border-primary-700 z-10">
          <h2 className="text-xl sm:text-2xl font-bold text-primary-900 dark:text-white">
            {transaction ? `Edit ${label}` : `Add ${label}`}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-700 text-primary-600 dark:text-primary-400 transition-colors touch-target"
            aria-label="Close"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmitClick} className="px-4 py-3 sm:p-6">
          {error && (
            <div className="p-2.5 sm:p-3 mb-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {isEdit ? (
            /* Full form for edit mode */
            <div className="space-y-3 sm:space-y-5">
              <div>
                <label className="block text-sm sm:text-base font-semibold text-primary-700 dark:text-primary-300 mb-1.5 sm:mb-3">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  autoFocus
                  className="w-full px-3 py-2.5 sm:px-5 sm:py-4 text-base sm:text-lg rounded-lg sm:rounded-xl border-2 border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder={isIncome ? 'What did you receive?' : 'What did you spend on?'}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
                <div>
                  <label className="block text-sm sm:text-base font-semibold text-primary-700 dark:text-primary-300 mb-1.5 sm:mb-3">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    inputMode="decimal"
                    className="w-full px-3 py-2.5 sm:px-5 sm:py-4 text-base sm:text-lg rounded-lg sm:rounded-xl border-2 border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0.00"
                  />
                </div>
                {!isIncome && (
                  <div>
                    <label className="block text-sm sm:text-base font-semibold text-primary-700 dark:text-primary-300 mb-1.5 sm:mb-3">Category *</label>
                    <div className="flex items-center gap-2 sm:gap-3">
                      {formData.category && <CategoryIcon name={formData.category} size={22} className="shrink-0 text-primary-600 dark:text-primary-400" />}
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                        className="flex-1 min-w-0 px-3 py-2.5 sm:px-5 sm:py-4 text-base sm:text-lg rounded-lg sm:rounded-xl border-2 border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        {categoryNames.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm sm:text-base font-semibold text-primary-700 dark:text-primary-300 mb-1.5 sm:mb-3">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 sm:px-5 sm:py-4 text-base sm:text-lg rounded-lg sm:rounded-xl border-2 border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm sm:text-base font-semibold text-primary-700 dark:text-primary-300 mb-1.5 sm:mb-3">Note (Optional)</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2.5 sm:px-5 sm:py-4 text-base sm:text-lg rounded-lg sm:rounded-xl border-2 border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none min-h-[56px]"
                  placeholder="Add any additional details..."
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-3 pb-2 sm:pt-6">
                <button type="button" onClick={onClose} className="flex-1 px-4 py-3 sm:px-6 sm:py-4 text-base sm:text-lg rounded-lg sm:rounded-xl border-2 border-primary-300 dark:border-primary-600 text-primary-700 dark:text-primary-300 font-semibold hover:bg-primary-50 dark:hover:bg-primary-700 active:scale-95 transition-all touch-target">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-3 sm:px-6 sm:py-4 text-base sm:text-lg rounded-lg sm:rounded-xl bg-primary-900 dark:bg-primary-700 text-white font-semibold hover:bg-primary-800 dark:hover:bg-primary-600 active:scale-95 transition-all shadow-lg touch-target disabled:opacity-50 disabled:cursor-not-allowed">{submitting ? 'Saving…' : 'Update'} {label}</button>
              </div>
            </div>
          ) : (
            /* Step-by-step flow for add */
            <>
              <div className="mb-2 flex items-center justify-center gap-1">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 max-w-8 rounded-full transition-colors ${i <= step ? 'bg-primary-500' : 'bg-primary-200 dark:bg-primary-600'}`}
                    aria-hidden
                  />
                ))}
              </div>
              <p className="text-xs text-primary-500 dark:text-primary-400 text-center mb-4">
                Step {step + 1} of {steps.length}
              </p>

              <div className="min-h-[120px] flex flex-col justify-center">
                {currentStepId === 'amount' && (
                  <div>
                    <label className="block text-sm font-semibold text-primary-700 dark:text-primary-300 mb-2">Amount *</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const current = parseFloat(formData.amount) || 0
                          setFormData({ ...formData, amount: String(Math.max(0, current - 5)) })
                        }}
                        className="shrink-0 px-4 py-3 text-lg font-medium rounded-xl border-2 border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-600 transition-colors touch-target"
                        aria-label="Subtract 5"
                      >
                        −5
                      </button>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), goNext())}
                        inputMode="decimal"
                        autoFocus
                        className="flex-1 min-w-0 px-4 py-3 text-lg rounded-xl border-2 border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="0.00"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const current = parseFloat(formData.amount) || 0
                          setFormData({ ...formData, amount: String(current + 10) })
                        }}
                        className="shrink-0 px-4 py-3 text-lg font-medium rounded-xl border-2 border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-600 transition-colors touch-target"
                        aria-label="Add 10"
                      >
                        +10
                      </button>
                    </div>
                  </div>
                )}
                {currentStepId === 'title' && (
                  <div>
                    <label className="block text-sm font-semibold text-primary-700 dark:text-primary-300 mb-2">Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), goNext())}
                      autoFocus
                      className="w-full px-4 py-3 text-lg rounded-xl border-2 border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder={isIncome ? 'What did you receive?' : 'What did you spend on?'}
                    />
                  </div>
                )}
                {currentStepId === 'category' && (
                  <div>
                    <label className="block text-sm font-semibold text-primary-700 dark:text-primary-300 mb-2">Category *</label>
                    <div className="flex items-center gap-3">
                      {formData.category && <CategoryIcon name={formData.category} size={22} className="shrink-0 text-primary-600 dark:text-primary-400" />}
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                        className="flex-1 min-w-0 px-4 py-3 text-lg rounded-xl border-2 border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        {categoryNames.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 pb-2">
                {isFirstStep ? (
                  <button type="button" onClick={onClose} className="flex-1 px-4 py-3 text-base rounded-xl border-2 border-primary-300 dark:border-primary-600 text-primary-700 dark:text-primary-300 font-semibold hover:bg-primary-50 dark:hover:bg-primary-700 active:scale-95 transition-all touch-target">Cancel</button>
                ) : (
                  <button type="button" onClick={goBack} className="flex-1 px-4 py-3 text-base rounded-xl border-2 border-primary-300 dark:border-primary-600 text-primary-700 dark:text-primary-300 font-semibold hover:bg-primary-50 dark:hover:bg-primary-700 active:scale-95 transition-all touch-target inline-flex items-center justify-center gap-1">
                    <ChevronLeft className="w-5 h-5" /> Back
                  </button>
                )}
                {isLastStep ? (
                  <button type="button" disabled={submitting} onClick={(e) => handleSubmitClick(e, true)} className="flex-1 px-4 py-3 text-base rounded-xl bg-primary-900 dark:bg-primary-700 text-white font-semibold hover:bg-primary-800 dark:hover:bg-primary-600 active:scale-95 transition-all shadow-lg touch-target disabled:opacity-50 disabled:cursor-not-allowed">
                    {submitting ? 'Saving…' : `Add ${label}`}
                  </button>
                ) : (
                  <button type="button" onClick={goNext} disabled={!canProceedFromStep()} className="flex-1 px-4 py-3 text-base rounded-xl bg-primary-900 dark:bg-primary-700 text-white font-semibold hover:bg-primary-800 dark:hover:bg-primary-600 active:scale-95 transition-all shadow-lg touch-target disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1">
                    Next <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </>
          )}
        </form>
      </div>
    </div>

    {/* Confirmation modal: link this expense to an upcoming item? */}
    {upcomingConfirmMatch && (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upcoming-confirm-title"
        aria-describedby="upcoming-confirm-desc"
        onClick={(e) => e.target === e.currentTarget && dismissConfirm()}
      >
        <div
          className="bg-white dark:bg-primary-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-primary-200 dark:border-primary-700"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 p-6 pb-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-700 flex items-center justify-center shrink-0">
                <Link2 className="w-7 h-7 text-primary-600 dark:text-primary-300" />
              </div>
              <div className="min-w-0">
                <h2 id="upcoming-confirm-title" className="text-xl font-semibold text-primary-900 dark:text-white">
                  Link to upcoming expense?
                </h2>
                <p id="upcoming-confirm-desc" className="text-primary-600 dark:text-primary-400 mt-1 text-sm">
                  Match found in your upcoming list
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={dismissConfirm}
              disabled={submitting}
              className="p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-700 text-primary-500 dark:text-primary-400 transition-colors shrink-0 touch-target"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="px-6 pb-6">
            <div className="rounded-xl bg-primary-50 dark:bg-primary-700/50 border border-primary-200 dark:border-primary-600 p-4 mb-6">
              <p className="text-primary-700 dark:text-primary-300 text-sm mb-1">Upcoming item</p>
              <p className="text-primary-900 dark:text-white font-medium">"{upcomingConfirmMatch.title}"</p>
              <p className="text-primary-600 dark:text-primary-400 text-sm mt-2">
                Do you want to record this expense as paying that upcoming item? It will mark the item as paid for this period.
              </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => handleUpcomingConfirm(false)}
                disabled={submitting}
                className="flex-1 px-5 py-3.5 rounded-xl border-2 border-primary-300 dark:border-primary-600 text-primary-700 dark:text-primary-300 font-medium hover:bg-primary-50 dark:hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                No, save as separate
              </button>
              <button
                type="button"
                onClick={() => handleUpcomingConfirm(true)}
                disabled={submitting}
                className="flex-1 px-5 py-3.5 rounded-xl bg-primary-900 dark:bg-primary-600 text-white font-medium hover:bg-primary-800 dark:hover:bg-primary-500 transition-colors disabled:opacity-50 shadow-lg"
              >
                Yes, link to upcoming
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
