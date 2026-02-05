import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../contexts/DataContext'
import { isWithinInterval } from 'date-fns'
import { getPeriodRange, formatPeriodLabel } from '../lib/period'
import { Plus, Target, AlertCircle, Trash2, ChevronRight, ArrowUpDown } from 'lucide-react'
import BudgetModal from '../components/BudgetModal'

const SORT_OPTIONS = [
  { value: 'name', label: 'By name' },
  { value: 'risk', label: 'By % used (risk first)' },
  { value: 'remaining', label: 'By remaining (lowest first)' },
  { value: 'budget', label: 'By budget amount' },
]

export default function Budgets() {
  const { budgets, setBudget, deleteBudget, expenses, categoryNames, formatCurrency, budgetPeriod } = useData()
  const [showModal, setShowModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const [sortBy, setSortBy] = useState('risk')

  const currentDate = new Date()
  const { start: periodStart, end: periodEnd } = getPeriodRange(budgetPeriod, currentDate)
  const periodLabel = formatPeriodLabel(budgetPeriod, currentDate)

  const periodExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      if (exp.type === 'income') return false
      const expDate = new Date(exp.date)
      return isWithinInterval(expDate, { start: periodStart, end: periodEnd })
    })
  }, [expenses, periodStart, periodEnd])

  const totalBudget = useMemo(() => {
    return Object.values(budgets).reduce((sum, amount) => sum + parseFloat(amount || 0), 0)
  }, [budgets])

  const totalSpent = useMemo(() => {
    return periodExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
  }, [periodExpenses])

  const budgetDetails = useMemo(() => {
    return Object.entries(budgets).map(([category, budgetAmount]) => {
      const spent = periodExpenses
        .filter((exp) => exp.category === category)
        .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
      const budget = parseFloat(budgetAmount || 0)
      const remaining = budget - spent
      const percentage = budget > 0 ? (spent / budget) * 100 : 0
      const exceeded = spent > budget
      const approaching = percentage >= 80 && !exceeded

      return {
        category,
        budget,
        spent,
        remaining,
        percentage,
        exceeded,
        approaching,
      }
    })
  }, [budgets, periodExpenses])

  const sortedBudgetDetails = useMemo(() => {
    const list = [...budgetDetails]
    switch (sortBy) {
      case 'name':
        return list.sort((a, b) => a.category.localeCompare(b.category))
      case 'risk':
        return list.sort((a, b) => b.percentage - a.percentage)
      case 'remaining':
        return list.sort((a, b) => a.remaining - b.remaining)
      case 'budget':
        return list.sort((a, b) => b.budget - a.budget)
      default:
        return list
    }
  }, [budgetDetails, sortBy])

  // Derived values: only use variables declared above (totalBudget, totalSpent, budgetDetails)
  const approachingBudgets = budgetDetails.filter((d) => d.approaching)
  const exceededBudgets = budgetDetails.filter((d) => d.exceeded)
  const utilizationPercent = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0

  const handleEdit = (category) => {
    setEditingBudget({ category, amount: budgets[category] })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingBudget(null)
  }

  const availableCategories = categoryNames.filter((cat) => !budgets[cat])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 dark:text-white">
            Budgets
          </h1>
          <p className="text-sm text-primary-500 dark:text-primary-400 mt-1">
            Manage your spending limits for {periodLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-lg border border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-800 text-primary-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {availableCategories.length > 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-900 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-800 dark:hover:bg-primary-600 font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Budget
            </button>
          )}
        </div>
      </div>

      {availableCategories.length > 0 && (
        <p className="text-sm text-primary-500 dark:text-primary-400">
          Categories without a budget: {availableCategories.join(', ')}. Add one above to track spending.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-primary-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h3 className="text-sm font-medium text-primary-500 dark:text-primary-400">
              Total Budget
            </h3>
          </div>
          <p className="text-2xl font-bold text-primary-900 dark:text-white">
            {formatCurrency(totalBudget)}
          </p>
        </div>

        <div className="bg-white dark:bg-primary-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h3 className="text-sm font-medium text-primary-500 dark:text-primary-400">
              Total Spent
            </h3>
          </div>
          <p className="text-2xl font-bold text-primary-900 dark:text-white">
            {formatCurrency(totalSpent)}
          </p>
        </div>

        <div className="bg-white dark:bg-primary-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h3 className="text-sm font-medium text-primary-500 dark:text-primary-400">
              Remaining
            </h3>
          </div>
          <p
            className={`text-2xl font-bold ${
              totalBudget - totalSpent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {formatCurrency(totalBudget - totalSpent)}
          </p>
        </div>

        <div className="bg-white dark:bg-primary-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h3 className="text-sm font-medium text-primary-500 dark:text-primary-400">
              Budget used
            </h3>
          </div>
          <p className="text-2xl font-bold text-primary-900 dark:text-white">
            {totalBudget > 0 ? utilizationPercent.toFixed(0) : 0}%
          </p>
          <p className="text-sm text-primary-500 dark:text-primary-400 mt-1">
            {formatCurrency(totalSpent)} of {formatCurrency(totalBudget)}
          </p>
        </div>
      </div>

      {approachingBudgets.length > 0 && (
        <div className="bg-white dark:bg-primary-800 rounded-xl p-6 shadow-sm border-amber-500/30">
          <h3 className="text-lg font-semibold text-amber-600 dark:text-amber-400 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Approaching budget (80%+)
          </h3>
          <div className="space-y-2">
            {approachingBudgets.map((d) => (
              <div
                key={d.category}
                className="flex justify-between items-center p-3 bg-white dark:bg-primary-800 rounded-lg"
              >
                <span className="font-medium text-primary-900 dark:text-white">{d.category}</span>
                <span className="text-amber-600 dark:text-amber-400 text-sm font-medium">
                  {d.percentage.toFixed(0)}% used · {formatCurrency(d.remaining)} left
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {budgetDetails.length === 0 ? (
        <div className="bg-white dark:bg-primary-800 rounded-xl p-12 shadow-sm text-center">
          <Target className="w-12 h-12 text-primary-500 dark:text-primary-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-primary-900 dark:text-white mb-2">
            No budgets set
          </h3>
          <p className="text-sm text-primary-500 dark:text-primary-400 mb-6">
            Create budgets for your expense categories to track your spending
          </p>
          {availableCategories.length > 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-900 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-800 dark:hover:bg-primary-600 font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Your First Budget
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedBudgetDetails.map((detail) => (
            <div
              key={detail.category}
              className={`bg-white dark:bg-primary-800 rounded-xl p-6 shadow-sm border-l-4 ${
                detail.exceeded ? 'border-red-500 dark:border-red-400' : 'border-primary-500 dark:border-primary-400'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-primary-900 dark:text-white">
                      {detail.category}
                    </h3>
                    {detail.exceeded && (
                      <div className="flex items-center gap-1 text-red-600 dark:text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-medium">Exceeded</span>
                      </div>
                    )}
                    {detail.approaching && !detail.exceeded && (
                      <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-medium">Approaching</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-primary-500 dark:text-primary-400">
                    <span>Budget: {formatCurrency(detail.budget)}</span>
                    <span>•</span>
                    <span>Spent: {formatCurrency(detail.spent)}</span>
                    <span>•</span>
                    <span
                      className={
                        detail.remaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }
                    >
                      {detail.remaining >= 0 ? 'Remaining' : 'Over by'}: {formatCurrency(Math.abs(detail.remaining))}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/expenses?category=${encodeURIComponent(detail.category)}`}
                    className="inline-flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:text-white hover:underline"
                  >
                    <ChevronRight className="w-4 h-4" />
                    View expenses
                  </Link>
                  <button
                    onClick={() => handleEdit(detail.category)}
                    className="p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-700 text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:text-white transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this budget?')) {
                        try {
                          await deleteBudget(detail.category)
                        } catch (err) {
                          alert(err.message ?? 'Failed to delete budget')
                        }
                      }
                    }}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-primary-500 dark:text-primary-400">
                    Progress
                  </span>
                  <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                    {Math.min(detail.percentage, 100).toFixed(1)}%
                  </span>
                </div>
                <div className="progress-track h-3">
                  <div
                    className={`h-3 ${
                      detail.exceeded
                        ? 'progress-fill-danger'
                        : detail.approaching
                          ? 'progress-fill-warning'
                          : 'progress-fill-success'
                    }`}
                    style={{ width: `${Math.min(detail.percentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <BudgetModal
          budget={editingBudget}
          availableCategories={availableCategories}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}
