import { useState, useEffect } from 'react'
import { useData } from '../contexts/DataContext'
import { X } from 'lucide-react'
import CategoryIcon from './CategoryIcon'
import { format } from 'date-fns'

const FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

export default function RecurringModal({ recurring: editingItem, onClose }) {
  const { addRecurring, updateRecurring, categoryNames } = useData()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Others',
    type: 'expense',
    frequency: 'monthly',
    nextDate: format(new Date(), 'yyyy-MM-dd'),
    note: '',
  })

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd')
    if (editingItem) {
      setFormData({
        title: editingItem.title ?? '',
        amount: String(editingItem.amount ?? ''),
        category: editingItem.category ?? 'Others',
        type: editingItem.type ?? 'expense',
        frequency: editingItem.frequency ?? 'monthly',
        nextDate: editingItem.nextDate ?? today,
        note: editingItem.note ?? '',
      })
    } else {
      setFormData((prev) => ({
        ...prev,
        category: categoryNames[0] || 'Others',
        nextDate: today,
      }))
    }
  }, [editingItem, categoryNames])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const amount = parseFloat(formData.amount)
      if (Number.isNaN(amount) || amount < 0) throw new Error('Enter a valid amount')
      if (editingItem) {
        await updateRecurring(editingItem.id, {
          title: formData.title.trim(),
          amount,
          category: formData.category,
          type: formData.type,
          frequency: formData.frequency,
          nextDate: formData.nextDate,
          note: formData.note.trim(),
        })
      } else {
        await addRecurring({
          title: formData.title.trim(),
          amount,
          category: formData.category,
          type: formData.type,
          frequency: formData.frequency,
          nextDate: formData.nextDate,
          note: formData.note.trim(),
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
      <div className="bg-white dark:bg-primary-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-primary-200 dark:border-primary-700">
          <h2 className="text-xl font-semibold text-primary-900 dark:text-white">
            {editingItem ? 'Edit Recurring' : 'Add Recurring'}
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
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-2 rounded-lg border border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g. Netflix, Rent, Salary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
              Amount *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              className="w-full px-4 py-2 rounded-lg border border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
              Category *
            </label>
            <div className="flex items-center gap-2">
              {formData.category && (
                <CategoryIcon name={formData.category} size={18} className="shrink-0 text-primary-600 dark:text-primary-400" />
              )}
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                className="flex-1 min-w-0 px-4 py-2 rounded-lg border border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {categoryNames.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
              Frequency
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
              Next date
            </label>
            <input
              type="date"
              value={formData.nextDate}
              onChange={(e) => setFormData({ ...formData, nextDate: e.target.value })}
              required
              className="w-full px-4 py-2 rounded-lg border border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
              Note (optional)
            </label>
            <input
              type="text"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Optional note"
            />
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
              {submitting ? 'Saving…' : editingItem ? 'Update' : 'Add'} Recurring
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
