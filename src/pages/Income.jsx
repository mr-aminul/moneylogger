import { useState, useMemo } from 'react'
import { useData } from '../contexts/DataContext'
import { format, parseISO } from 'date-fns'
import { Plus, Search, Edit2, Trash2, Download } from 'lucide-react'
import ExpenseModal from '../components/ExpenseModal'
import Button from '../components/UI/Button'

export default function Income() {
  const { expenses, deleteExpense, categoryNames: categories, formatCurrency } = useData()
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [sortBy, setSortBy] = useState('date-desc')

  const incomeEntries = useMemo(() => expenses.filter((t) => t.type === 'income'), [expenses])

  const filteredIncome = useMemo(() => {
    let filtered = [...incomeEntries]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          t.title?.toLowerCase().includes(query) || t.note?.toLowerCase().includes(query)
      )
    }
    if (filterCategory) filtered = filtered.filter((t) => t.category === filterCategory)
    if (filterDateFrom) filtered = filtered.filter((t) => t.date >= filterDateFrom)
    if (filterDateTo) filtered = filtered.filter((t) => t.date <= filterDateTo)

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date) - new Date(a.date)
        case 'date-asc':
          return new Date(a.date) - new Date(b.date)
        case 'amount-desc':
          return parseFloat(b.amount || 0) - parseFloat(a.amount || 0)
        case 'amount-asc':
          return parseFloat(a.amount || 0) - parseFloat(b.amount || 0)
        default:
          return 0
      }
    })
    return filtered
  }, [incomeEntries, searchQuery, filterCategory, filterDateFrom, filterDateTo, sortBy])

  const totalAmount = filteredIncome.reduce(
    (sum, t) => sum + parseFloat(t.amount || 0),
    0
  )

  const handleEdit = (item) => {
    setEditingItem(item)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this income entry?')) {
      try {
        await deleteExpense(id)
      } catch (err) {
        alert(err.message ?? 'Failed to delete')
      }
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingItem(null)
  }

  const handleExport = () => {
    const csv = [
      ['Date', 'Title', 'Category', 'Amount', 'Note'].join(','),
      ...filteredIncome.map((t) =>
        [
          t.date,
          `"${t.title || ''}"`,
          t.category || '',
          t.amount || 0,
          `"${t.note || ''}"`,
        ].join(',')
      ),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `income_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 dark:text-white">
            Income
          </h1>
          <p className="text-sm text-primary-600 dark:text-primary-400 mt-1">
            {filteredIncome.length} entr{filteredIncome.length !== 1 ? 'ies' : 'y'} • Total: {formatCurrency(totalAmount)}
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleExport} variant="outline" icon={Download}>
            Export CSV
          </Button>
          <Button onClick={() => setShowModal(true)} icon={Plus}>
            Add Income
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-primary-800 rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-400" />
            <input
              type="text"
              placeholder="Search income..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 rounded-lg border border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="px-4 py-2 rounded-lg border border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="px-4 py-2 rounded-lg border border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex justify-end mb-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 rounded-lg border border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          >
            <option value="date-desc">Sort by Date (Newest)</option>
            <option value="date-asc">Sort by Date (Oldest)</option>
            <option value="amount-desc">Sort by Amount (High to Low)</option>
            <option value="amount-asc">Sort by Amount (Low to High)</option>
          </select>
        </div>

        {filteredIncome.length === 0 ? (
          <div className="text-center py-12 text-primary-400">
            <p className="text-lg mb-2">No income found</p>
            <p className="text-sm">
              {incomeEntries.length === 0
                ? 'Start by adding your first income'
                : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredIncome.map((item) => (
              <IncomeRow
                key={item.id}
                item={item}
                formatCurrency={formatCurrency}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <ExpenseModal
          transaction={editingItem}
          type="income"
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}

function IncomeRow({ item, formatCurrency, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-primary-200 dark:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-700/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="font-semibold text-primary-900 dark:text-white">
            {item.title || 'Untitled'}
          </h3>
          <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
            {item.category || 'Others'}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-primary-600 dark:text-primary-400">
          <span>{format(parseISO(item.date), 'MMM dd, yyyy')}</span>
          {item.note && <span className="truncate max-w-md">{item.note}</span>}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-lg font-semibold text-green-600 dark:text-green-400">
          +{formatCurrency(parseFloat(item.amount || 0))}
        </span>
        <button
          onClick={() => onEdit(item)}
          className="p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-700 text-primary-600 dark:text-primary-400 transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
