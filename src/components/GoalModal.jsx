import { useState, useEffect } from 'react'
import { useData } from '../contexts/DataContext'
import { X } from 'lucide-react'
import { format } from 'date-fns'

export default function GoalModal({ goal: editingGoal, onClose }) {
  const { addSavingsGoal, updateSavingsGoal } = useData()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const today = format(new Date(), 'yyyy-MM-dd')
  const [formData, setFormData] = useState({
    title: '',
    targetAmount: '',
    targetDate: '',
    currentAmount: '0',
  })

  useEffect(() => {
    if (editingGoal) {
      setFormData({
        title: editingGoal.title ?? '',
        targetAmount: String(editingGoal.targetAmount ?? ''),
        targetDate: editingGoal.targetDate ? editingGoal.targetDate : '',
        currentAmount: String(editingGoal.currentAmount ?? 0),
      })
    } else {
      setFormData({
        title: '',
        targetAmount: '',
        targetDate: '',
        currentAmount: '0',
      })
    }
  }, [editingGoal])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const targetAmount = parseFloat(formData.targetAmount)
      if (Number.isNaN(targetAmount) || targetAmount <= 0) throw new Error('Target amount must be greater than 0')
      const currentAmount = parseFloat(formData.currentAmount) || 0
      if (currentAmount < 0) throw new Error('Current amount cannot be negative')
      if (editingGoal) {
        await updateSavingsGoal(editingGoal.id, {
          title: formData.title.trim(),
          targetAmount,
          targetDate: formData.targetDate || null,
          currentAmount,
        })
      } else {
        await addSavingsGoal({
          title: formData.title.trim(),
          targetAmount,
          targetDate: formData.targetDate || null,
          currentAmount,
        })
      }
      onClose()
    } catch (err) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-primary-800 rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-primary-200 dark:border-primary-700">
          <h2 className="text-xl font-semibold text-primary-900 dark:text-white">
            {editingGoal ? 'Edit goal' : 'Add to wishlist'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-700 text-primary-600 dark:text-primary-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
              What do you want to buy? *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-2 rounded-lg border border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g. Washing machine, New laptop"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
              Target amount *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.targetAmount}
              onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
              required
              className="w-full px-4 py-2 rounded-lg border border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g. 500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
              Already saved (optional)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.currentAmount}
              onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
              Want it by (optional)
            </label>
            <input
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              min={today}
              className="w-full px-4 py-2 rounded-lg border border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-primary-500 dark:text-primary-400 mt-1">
              We&apos;ll tell you how much to save per month to reach by this date.
            </p>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-primary-300 dark:border-primary-600 text-primary-700 dark:text-primary-300 font-medium hover:bg-primary-50 dark:hover:bg-primary-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 rounded-lg bg-primary-900 dark:bg-primary-700 text-white font-medium hover:bg-primary-800 dark:hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving…' : editingGoal ? 'Update' : 'Add'} goal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
