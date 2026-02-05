import { useState, useMemo } from 'react'
import { useData } from '../contexts/DataContext'
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { FolderOpen, Plus, Pencil, Trash2, X } from 'lucide-react'

const PRESET_COLORS = [
  '#64748b', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
]

export default function Categories() {
  const {
    expenses,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    formatCurrency,
  } = useData()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const currentDate = new Date()
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)

  const handleAdd = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await addCategory(newName.trim(), newColor)
      setNewName('')
      setNewColor(PRESET_COLORS[0])
      setShowAddForm(false)
    } catch (err) {
      setError(err.message ?? 'Failed to add category')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (cat) => {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditColor(cat.color || PRESET_COLORS[0])
    setError('')
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!editingId) return
    setError('')
    setSaving(true)
    try {
      await updateCategory(editingId, { name: editName.trim(), color: editColor })
      setEditingId(null)
    } catch (err) {
      setError(err.message ?? 'Failed to update category')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const cat = safeCategories.find((c) => c.id === id)
    if (!cat) return
    if (!window.confirm(`Delete "${cat.name}"? Expenses and budgets using it will be reassigned.`)) return
    try {
      await deleteCategory(id)
    } catch (err) {
      alert(err.message ?? 'Failed to delete category')
    }
  }

  const categoryStats = useMemo(() => {
    const monthlyExpenses = (Array.isArray(expenses) ? expenses : []).filter((exp) => {
      if (exp.type === 'income') return false
      const expDate = new Date(exp.date)
      return isWithinInterval(expDate, { start: monthStart, end: monthEnd })
    })

    const catList = Array.isArray(categories) ? categories : []
    const stats = catList.map((cat) => {
      const categoryExpenses = monthlyExpenses.filter((exp) => exp.category === cat.name)
      const total = categoryExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
      const count = categoryExpenses.length
      return {
        id: cat.id,
        category: cat.name,
        color: cat.color,
        total,
        count,
        percentage: 0,
      }
    })
    const grandTotal = stats.reduce((sum, stat) => sum + stat.total, 0)
    return stats.map((stat) => ({
      ...stat,
      percentage: grandTotal > 0 ? (stat.total / grandTotal) * 100 : 0,
    }))
  }, [expenses, categories, monthStart, monthEnd])

  const safeCategories = Array.isArray(categories) ? categories : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-900 dark:text-white">
          Categories
        </h1>
        <p className="text-sm text-primary-600 dark:text-primary-400 mt-1">
          Manage categories and view spending for {format(currentDate, 'MMMM yyyy')}
        </p>
      </div>

      {/* Manage categories */}
      <div className="bg-white dark:bg-primary-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-primary-900 dark:text-white mb-4">
          Your categories
        </h2>
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        {showAddForm ? (
          <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3 mb-4">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-primary-600 dark:text-primary-400 mb-1">
                Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Groceries"
                className="w-full px-3 py-2 rounded-lg border border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
            </div>
            <div className="flex gap-2 items-center">
              <label className="text-xs font-medium text-primary-600 dark:text-primary-400">
                Color
              </label>
              <div className="flex gap-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${newColor === c ? 'border-primary-900 dark:border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setNewName(''); setError(''); }}
                className="px-3 py-2 rounded-lg border border-primary-300 dark:border-primary-600 text-primary-700 dark:text-primary-300 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !newName.trim()}
                className="px-3 py-2 rounded-lg bg-primary-900 dark:bg-primary-700 text-white text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'Adding…' : 'Add'}
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-primary-300 dark:border-primary-600 text-primary-700 dark:text-primary-300 text-sm font-medium mb-4 hover:bg-primary-50 dark:hover:bg-primary-700/50"
          >
            <Plus className="w-4 h-4" />
            Add category
          </button>
        )}
        <ul className="space-y-2">
          {safeCategories.map((cat) => (
            <li
              key={cat.id}
              className="flex items-center justify-between p-3 rounded-lg border border-primary-200 dark:border-primary-700"
            >
              {editingId === cat.id ? (
                <form onSubmit={handleUpdate} className="flex flex-wrap items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 min-w-[120px] px-3 py-2 rounded-lg border border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <div className="flex gap-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditColor(c)}
                        className={`w-5 h-5 rounded-full border-2 ${editColor === c ? 'border-primary-900 dark:border-white' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <button type="submit" disabled={saving || !editName.trim()} className="px-2 py-1 rounded bg-primary-900 dark:bg-primary-700 text-white text-sm disabled:opacity-50">
                    Save
                  </button>
                  <button type="button" onClick={() => setEditingId(null)} className="p-1 rounded hover:bg-primary-100 dark:hover:bg-primary-700">
                    <X className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    {cat.color ? (
                      <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    ) : (
                      <FolderOpen className="w-4 h-4 text-primary-500" />
                    )}
                    <span className="font-medium text-primary-900 dark:text-white">{cat.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(cat)}
                      className="p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-700 text-primary-600 dark:text-primary-400"
                      aria-label="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat.id)}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      <h2 className="text-lg font-semibold text-primary-900 dark:text-white">
        Spending by category
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categoryStats.map((stat) => (
          <div
            key={stat.id}
            className="bg-white dark:bg-primary-800 rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${!stat.color ? 'bg-primary-100 dark:bg-primary-700' : ''}`}
                style={stat.color ? { backgroundColor: `${stat.color}20` } : undefined}
              >
                {stat.color ? (
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: stat.color }}
                  />
                ) : (
                  <FolderOpen className="w-5 h-5 text-primary-600 dark:text-primary-300" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-primary-900 dark:text-white">
                {stat.category}
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-primary-600 dark:text-primary-400">
                  Total Spent
                </span>
                <span className="text-xl font-bold text-primary-900 dark:text-white">
                  {formatCurrency(stat.total)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-primary-600 dark:text-primary-400">
                  Transactions
                </span>
                <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                  {stat.count}
                </span>
              </div>
              <div className="mt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-primary-500 dark:text-primary-400">
                    Percentage
                  </span>
                  <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                    {stat.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="progress-track h-2">
                  <div
                    className="progress-fill-accent h-2"
                    style={{ width: `${stat.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
