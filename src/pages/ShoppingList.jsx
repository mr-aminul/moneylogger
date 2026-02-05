import { useState, useMemo } from 'react'
import { useData } from '../contexts/DataContext'
import { format, isToday, isPast, startOfDay } from 'date-fns'
import { Plus, ShoppingCart, Check, Trash2, Pencil, Calendar, AlertCircle } from 'lucide-react'

export default function ShoppingList() {
  const {
    shoppingList,
    addShoppingItem,
    updateShoppingItem,
    deleteShoppingItem,
    clearCompletedShoppingItems,
  } = useData()
  const [newTitle, setNewTitle] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDueDate, setEditDueDate] = useState('')

  const today = startOfDay(new Date())
  const safeList = Array.isArray(shoppingList) ? shoppingList : []

  const { overdue, dueToday, upcoming, noDate, completed } = useMemo(() => {
    const o = []
    const d = []
    const u = []
    const n = []
    const c = []
    safeList.forEach((item) => {
      if (item.completed) {
        c.push(item)
        return
      }
      if (!item.dueDate) {
        n.push(item)
        return
      }
      const due = startOfDay(new Date(item.dueDate))
      if (isPast(due) && !isToday(due)) o.push(item)
      else if (isToday(due)) d.push(item)
      else u.push(item)
    })
    return { overdue: o, dueToday: d, upcoming: u, noDate: n, completed: c }
  }, [safeList])

  const handleAdd = async (e) => {
    e.preventDefault()
    const title = newTitle.trim()
    if (!title) return
    setSubmitting(true)
    try {
      await addShoppingItem({ title, dueDate: newDueDate || null })
      setNewTitle('')
      setNewDueDate('')
    } catch (err) {
      alert(err.message ?? 'Failed to add')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (item) => {
    try {
      await updateShoppingItem(item.id, { completed: !item.completed })
    } catch (err) {
      alert(err.message ?? 'Failed to update')
    }
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditTitle(item.title)
    setEditDueDate(item.dueDate || '')
  }

  const handleSaveEdit = async (id) => {
    try {
      await updateShoppingItem(id, {
        title: editTitle.trim(),
        dueDate: editDueDate || null,
      })
      setEditingId(null)
      setEditTitle('')
      setEditDueDate('')
    } catch (err) {
      alert(err.message ?? 'Failed to update')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this item from the list?')) return
    try {
      await deleteShoppingItem(id)
      if (editingId === id) setEditingId(null)
    } catch (err) {
      alert(err.message ?? 'Failed to delete')
    }
  }

  const handleClearCompleted = async () => {
    if (completed.length === 0) return
    if (!window.confirm(`Remove ${completed.length} bought item(s) from the list?`)) return
    try {
      await clearCompletedShoppingItems()
    } catch (err) {
      alert(err.message ?? 'Failed to clear')
    }
  }

  const renderItem = (item) => (
    <li
      key={item.id}
      className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-primary-800 border border-primary-200 dark:border-primary-700 group"
    >
      <button
        type="button"
        onClick={() => handleToggle(item)}
        className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
          item.completed
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-primary-400 dark:border-primary-500 hover:border-primary-600 dark:hover:border-primary-400'
        }`}
        title={item.completed ? 'Mark as to buy' : 'Mark as bought'}
      >
        {item.completed && <Check className="w-4 h-4" />}
      </button>
      {editingId === item.id ? (
        <div className="flex-1 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="flex-1 min-w-[120px] px-3 py-1.5 rounded-lg border border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Item name"
            autoFocus
          />
          <input
            type="date"
            value={editDueDate}
            onChange={(e) => setEditDueDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="button"
            onClick={() => handleSaveEdit(item.id)}
            className="px-3 py-1.5 rounded-lg bg-primary-900 dark:bg-primary-700 text-white text-sm font-medium hover:bg-primary-800 dark:hover:bg-primary-600"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => { setEditingId(null); setEditTitle(''); setEditDueDate('') }}
            className="px-3 py-1.5 rounded-lg border border-primary-300 dark:border-primary-600 text-primary-700 dark:text-primary-300 text-sm"
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          <span
            className={`flex-1 text-left ${
              item.completed ? 'line-through text-primary-500 dark:text-primary-400' : 'text-primary-900 dark:text-white'
            }`}
          >
            {item.title || 'Untitled'}
          </span>
          {item.dueDate && (
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                item.completed
                  ? 'bg-primary-100 dark:bg-primary-700 text-primary-500 dark:text-primary-400'
                  : isToday(startOfDay(new Date(item.dueDate)))
                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200'
                    : isPast(startOfDay(new Date(item.dueDate)))
                      ? 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'
                      : 'bg-primary-100 dark:bg-primary-700 text-primary-600 dark:text-primary-300'
              }`}
            >
              {format(new Date(item.dueDate), 'MMM d')}
            </span>
          )}
          {!item.completed && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => startEdit(item)}
                className="p-1.5 rounded hover:bg-primary-100 dark:hover:bg-primary-700 text-primary-600 dark:text-primary-400"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                title="Remove"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </li>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-900 dark:text-white">
          Shopping list
        </h1>
        <p className="text-sm text-primary-600 dark:text-primary-400 mt-1">
          Necessities to buy — add items when they run out (e.g. eggs, milk). Set a &quot;buy by&quot; date to remind you when to buy.
        </p>
      </div>

      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-medium text-primary-600 dark:text-primary-400 mb-1">
            Add item
          </label>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Eggs, Milk, Bread"
            className="w-full px-4 py-2 rounded-lg border border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-800 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={submitting}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-primary-600 dark:text-primary-400 mb-1">
            Buy by (optional)
          </label>
          <input
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            className="px-4 py-2 rounded-lg border border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-800 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={submitting}
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !newTitle.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-900 dark:bg-primary-700 text-white rounded-lg font-medium hover:bg-primary-800 dark:hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </form>

      {safeList.length === 0 ? (
        <div className="bg-white dark:bg-primary-800 rounded-xl p-12 shadow-sm text-center">
          <ShoppingCart className="w-12 h-12 text-primary-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-primary-900 dark:text-white mb-2">
            List is empty
          </h3>
          <p className="text-sm text-primary-600 dark:text-primary-400 mb-6 max-w-md mx-auto">
            Add items when they run out — like eggs or milk. Optionally set a &quot;buy by&quot; date so you’re reminded when to buy.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {(overdue.length > 0 || dueToday.length > 0) && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {overdue.length > 0 ? 'Overdue' : 'Due today'}
              </h3>
              <ul className="space-y-2">
                {overdue.map(renderItem)}
                {dueToday.map(renderItem)}
              </ul>
            </div>
          )}

          {upcoming.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-primary-700 dark:text-primary-300 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Upcoming
              </h3>
              <ul className="space-y-2">
                {upcoming.map(renderItem)}
              </ul>
            </div>
          )}

          {noDate.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-primary-700 dark:text-primary-300 mb-2">
                No date
              </h3>
              <ul className="space-y-2">
                {noDate.map(renderItem)}
              </ul>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-primary-500 dark:text-primary-400">
                  Bought
                </h3>
                <button
                  type="button"
                  onClick={handleClearCompleted}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Clear bought items
                </button>
              </div>
              <ul className="space-y-2 opacity-75">
                {completed.map(renderItem)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
