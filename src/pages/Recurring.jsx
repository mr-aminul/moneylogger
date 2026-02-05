import { useState } from 'react'
import { useData } from '../contexts/DataContext'
import { format } from 'date-fns'
import { Plus, Repeat, Edit2, Trash2, PlusCircle } from 'lucide-react'
import RecurringModal from '../components/RecurringModal'

export default function Recurring() {
  const {
    recurring,
    deleteRecurring,
    createTransactionFromRecurring,
    formatCurrency,
  } = useData()
  const [showModal, setShowModal] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState(null)
  const [addingId, setAddingId] = useState(null)

  const handleEdit = (item) => {
    setEditingRecurring(item)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingRecurring(null)
  }

  const handleAddThisPeriod = async (id) => {
    setAddingId(id)
    try {
      await createTransactionFromRecurring(id)
    } catch (err) {
      alert(err.message ?? 'Failed to add transaction')
    } finally {
      setAddingId(null)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this recurring item? It will not affect existing transactions.')) return
    try {
      await deleteRecurring(id)
    } catch (err) {
      alert(err.message ?? 'Failed to delete')
    }
  }

  const safeRecurring = Array.isArray(recurring) ? recurring : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 dark:text-white">
            Recurring
          </h1>
          <p className="text-sm text-primary-600 dark:text-primary-400 mt-1">
            Subscriptions, rent, salary — add a transaction for the current period with one click
          </p>
        </div>
        <button
          onClick={() => {
            setEditingRecurring(null)
            setShowModal(true)
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-900 dark:bg-primary-700 text-white rounded-lg font-medium hover:bg-primary-800 dark:hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Recurring
        </button>
      </div>

      {safeRecurring.length === 0 ? (
        <div className="bg-white dark:bg-primary-800 rounded-xl p-12 shadow-sm text-center">
          <Repeat className="w-12 h-12 text-primary-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-primary-900 dark:text-white mb-2">
            No recurring items yet
          </h3>
          <p className="text-sm text-primary-600 dark:text-primary-400 mb-6">
            Add subscriptions, rent, salary or any repeating expense/income. Then use &quot;Add this period&quot; to log it quickly.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-900 dark:bg-primary-700 text-white rounded-lg font-medium hover:bg-primary-800 dark:hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Your First Recurring
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {safeRecurring.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-primary-800 rounded-xl p-6 shadow-sm border-l-4 border-primary-500 dark:border-primary-400"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-primary-900 dark:text-white">
                      {item.title || 'Untitled'}
                    </h3>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        item.type === 'income'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-primary-100 dark:bg-primary-700 text-primary-700 dark:text-primary-300'
                      }`}
                    >
                      {item.type === 'income' ? 'Income' : 'Expense'}
                    </span>
                    <span className="text-xs text-primary-500 dark:text-primary-400 capitalize">
                      {item.frequency}
                    </span>
                  </div>
                  <p className="text-sm text-primary-600 dark:text-primary-400">
                    {formatCurrency(item.amount)} · {item.category}
                    {item.note ? ` · ${item.note}` : ''}
                  </p>
                  <p className="text-xs text-primary-500 dark:text-primary-400 mt-1">
                    Next: {format(new Date(item.nextDate), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleAddThisPeriod(item.id)}
                    disabled={addingId === item.id}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-green-600 dark:bg-green-700 text-white text-sm font-medium hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PlusCircle className="w-4 h-4" />
                    {addingId === item.id ? 'Adding…' : 'Add this period'}
                  </button>
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-700 text-primary-600 dark:text-primary-400 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <RecurringModal
          recurring={editingRecurring}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}
