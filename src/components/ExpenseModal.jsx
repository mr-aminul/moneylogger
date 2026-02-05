import { useState, useEffect, useCallback } from 'react'
import { useData } from '../contexts/DataContext'
import { X, Link2 } from 'lucide-react'
import CategoryIcon from './CategoryIcon'

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

  useEffect(() => {
    if (transaction) {
      setFormData({
        title: transaction.title || '',
        amount: transaction.amount ?? '',
        category: transaction.category || categoryNames[0] || '',
        date: transaction.date || new Date().toISOString().split('T')[0],
        note: transaction.note || '',
      })
    } else if (initialTitle || initialAmount || initialCategory) {
      const validCategory =
        initialCategory && categoryNames.includes(initialCategory)
          ? initialCategory
          : categoryNames[0] || ''
      setFormData((prev) => ({
        ...prev,
        ...(initialTitle && { title: initialTitle }),
        ...(initialAmount && { amount: String(initialAmount) }),
        ...(validCategory && { category: validCategory }),
      }))
    }
  }, [transaction, categoryNames, initialTitle, initialAmount, initialCategory])

  const handleSubmit = async (e, linkedRecurringId = null) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (transaction) {
        await updateExpense(transaction.id, formData)
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

  const handleSubmitClick = (e) => {
    e.preventDefault()
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
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white dark:bg-primary-800 rounded-t-2xl sm:rounded-xl shadow-xl max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-primary-800 flex items-center justify-between p-6 border-b border-primary-200 dark:border-primary-700 z-10">
          <h2 className="text-2xl font-bold text-primary-900 dark:text-white">
            {transaction ? `Edit ${label}` : `Add ${label}`}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-700 text-primary-600 dark:text-primary-400 transition-colors touch-target"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmitClick} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-base font-semibold text-primary-700 dark:text-primary-300 mb-3">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              autoFocus
              className="w-full px-5 py-4 text-lg rounded-xl border-2 border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder={isIncome ? 'What did you receive?' : 'What did you spend on?'}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-base font-semibold text-primary-700 dark:text-primary-300 mb-3">
                Amount *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                inputMode="decimal"
                className="w-full px-5 py-4 text-lg rounded-xl border-2 border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-primary-700 dark:text-primary-300 mb-3">
                Category *
              </label>
              <div className="flex items-center gap-3">
                {formData.category && (
                  <CategoryIcon name={formData.category} size={22} className="shrink-0 text-primary-600 dark:text-primary-400" />
                )}
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="flex-1 min-w-0 px-5 py-4 text-lg rounded-xl border-2 border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {categoryNames.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-base font-semibold text-primary-700 dark:text-primary-300 mb-3">
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="w-full px-5 py-4 text-lg rounded-xl border-2 border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-base font-semibold text-primary-700 dark:text-primary-300 mb-3">
              Note (Optional)
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={4}
              className="w-full px-5 py-4 text-lg rounded-xl border-2 border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              placeholder="Add any additional details..."
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 text-lg rounded-xl border-2 border-primary-300 dark:border-primary-600 text-primary-700 dark:text-primary-300 font-semibold hover:bg-primary-50 dark:hover:bg-primary-700 active:scale-95 transition-all touch-target"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-4 text-lg rounded-xl bg-primary-900 dark:bg-primary-700 text-white font-semibold hover:bg-primary-800 dark:hover:bg-primary-600 active:scale-95 transition-all shadow-lg touch-target disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving…' : transaction ? 'Update' : 'Add'} {label}
            </button>
          </div>
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
