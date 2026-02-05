import { useState, useMemo } from 'react'
import { useData } from '../contexts/DataContext'
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  addMonths,
  differenceInMonths,
  isWithinInterval,
  isBefore,
} from 'date-fns'
import { Plus, Gift, Edit2, Trash2, ChevronDown, ChevronUp, TrendingUp, PiggyBank } from 'lucide-react'
import GoalModal from '../components/GoalModal'

const STAGES = [
  { min: 0, max: 0, label: 'Not started', color: 'bg-primary-200 dark:bg-primary-600 text-primary-800 dark:text-primary-200' },
  { min: 1, max: 49, label: 'Saving', color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200' },
  { min: 50, max: 89, label: 'Almost there', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200' },
  { min: 90, max: 100, label: 'Ready', color: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200' },
]

function getStage(progressPercent) {
  const p = Math.min(100, Math.max(0, progressPercent))
  const found = STAGES.find((s) => p >= s.min && p <= s.max) ?? STAGES[0]
  const stageIndex = STAGES.indexOf(found)
  return { ...found, index: stageIndex }
}

export default function Wishlist() {
  const { savingsGoals, updateSavingsGoal, deleteSavingsGoal, expenses, formatCurrency } = useData()
  const [showModal, setShowModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [addSavedAmount, setAddSavedAmount] = useState({})

  const today = new Date()
  const threeMonthsAgo = startOfMonth(subMonths(today, 2))

  const { monthlySurplus, topCategories } = useMemo(() => {
    const list = Array.isArray(expenses) ? expenses : []
    const inRange = list.filter((exp) => {
      const d = new Date(exp.date)
      return isWithinInterval(d, { start: threeMonthsAgo, end: today })
    })
    const income = inRange.filter((e) => e.type === 'income').reduce((s, e) => s + parseFloat(e.amount || 0), 0)
    const expenseTotal = inRange.filter((e) => e.type !== 'income').reduce((s, e) => s + parseFloat(e.amount || 0), 0)
    const monthsCount = Math.max(1, differenceInMonths(today, threeMonthsAgo) + 1)
    const surplus = (income - expenseTotal) / monthsCount

    const byCategory = {}
    inRange.filter((e) => e.type !== 'income').forEach((e) => {
      const cat = e.category || 'Others'
      byCategory[cat] = (byCategory[cat] || 0) + parseFloat(e.amount || 0)
    })
    const top = Object.entries(byCategory)
      .map(([name, value]) => ({ name, value: value / monthsCount }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    return { monthlySurplus: surplus, topCategories: top }
  }, [expenses, threeMonthsAgo, today])

  const handleEdit = (goal) => {
    setEditingGoal(goal)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingGoal(null)
  }

  const handleAddSaved = async (goal) => {
    const amount = addSavedAmount[goal.id]
    const add = parseFloat(amount) || 0
    if (add <= 0) return
    const current = parseFloat(goal.currentAmount) || 0
    try {
      await updateSavingsGoal(goal.id, { currentAmount: current + add })
      setAddSavedAmount((prev) => ({ ...prev, [goal.id]: '' }))
    } catch (err) {
      alert(err.message ?? 'Failed to update')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this goal from your wishlist?')) return
    try {
      await deleteSavingsGoal(id)
    } catch (err) {
      alert(err.message ?? 'Failed to delete')
    }
  }

  const safeGoals = Array.isArray(savingsGoals) ? savingsGoals : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 dark:text-white">
            Wishlist
          </h1>
          <p className="text-sm text-primary-600 dark:text-primary-400 mt-1">
            What you want to buy — we&apos;ll show when you can get it and where to spend less to get there faster.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingGoal(null)
            setShowModal(true)
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-900 dark:bg-primary-700 text-white rounded-lg font-medium hover:bg-primary-800 dark:hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add goal
        </button>
      </div>

      {monthlySurplus <= 0 && safeGoals.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
          <PiggyBank className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900 dark:text-amber-200">Spending more than you earn</p>
            <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
              Over the last 3 months your expenses exceeded income. Cut spending or add income to start saving toward your goals. Check &quot;Where to spend less&quot; on each goal for ideas.
            </p>
          </div>
        </div>
      )}

      {safeGoals.length === 0 ? (
        <div className="bg-white dark:bg-primary-800 rounded-xl p-12 shadow-sm text-center">
          <Gift className="w-12 h-12 text-primary-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-primary-900 dark:text-white mb-2">
            No goals yet
          </h3>
          <p className="text-sm text-primary-600 dark:text-primary-400 mb-6 max-w-md mx-auto">
            Add something you want to buy — like a washing machine or a laptop. We&apos;ll show your progress, when you can afford it, and where to spend less to get there faster.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-900 dark:bg-primary-700 text-white rounded-lg font-medium hover:bg-primary-800 dark:hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add your first goal
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {safeGoals.map((goal) => {
            const targetAmount = parseFloat(goal.targetAmount) || 0
            const currentAmount = parseFloat(goal.currentAmount) || 0
            const amountNeeded = Math.max(0, targetAmount - currentAmount)
            const progressPercent = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0
            const stage = getStage(progressPercent)

            const monthsToGoal =
              monthlySurplus > 0 && amountNeeded > 0 ? amountNeeded / monthlySurplus : null
            const estimatedDate = monthsToGoal != null ? addMonths(today, Math.ceil(monthsToGoal)) : null

            const targetDateObj = goal.targetDate ? new Date(goal.targetDate) : null
            const monthsUntilTarget =
              targetDateObj && isBefore(today, targetDateObj)
                ? differenceInMonths(targetDateObj, today) + 1
                : null
            const requiredPerMonth =
              monthsUntilTarget != null && monthsUntilTarget > 0 && amountNeeded > 0
                ? amountNeeded / monthsUntilTarget
                : null

            const isExpanded = expandedId === goal.id

            return (
              <div
                key={goal.id}
                className="bg-white dark:bg-primary-800 rounded-xl shadow-sm border border-primary-200 dark:border-primary-700 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="text-lg font-semibold text-primary-900 dark:text-white">
                          {goal.title || 'Untitled goal'}
                        </h3>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded ${stage.color}`}
                        >
                          {stage.label}
                        </span>
                      </div>
                      <p className="text-sm text-primary-600 dark:text-primary-400">
                        {formatCurrency(currentAmount)} of {formatCurrency(targetAmount)} saved
                        {amountNeeded > 0 && ` · ${formatCurrency(amountNeeded)} to go`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(goal)}
                        className="p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-700 text-primary-600 dark:text-primary-400 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-1 text-xs text-primary-500 dark:text-primary-400">
                      <span>Progress</span>
                      <span>{progressPercent.toFixed(0)}%</span>
                    </div>
                    <div className="progress-track h-3">
                      <div
                        className={`h-3 progress-fill-stage-${stage.index}`}
                        style={{ width: `${Math.min(100, progressPercent)}%` }}
                      />
                    </div>
                  </div>

                  {amountNeeded > 0 && (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="text-sm text-primary-600 dark:text-primary-400">I saved:</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0"
                        value={addSavedAmount[goal.id] ?? ''}
                        onChange={(e) => setAddSavedAmount((prev) => ({ ...prev, [goal.id]: e.target.value }))}
                        className="w-24 px-3 py-1.5 rounded-lg border border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSaved(goal)}
                        className="px-3 py-1.5 rounded-lg bg-green-600 dark:bg-green-700 text-white text-sm font-medium hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  )}

                  {amountNeeded > 0 && (
                    <div className="mt-4 p-4 rounded-lg bg-primary-50 dark:bg-primary-700/50 border border-primary-100 dark:border-primary-600">
                      <p className="text-sm font-medium text-primary-800 dark:text-primary-200 mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        When can I get it?
                      </p>
                      {requiredPerMonth != null && requiredPerMonth > 0 && (
                        <p className="text-sm text-primary-700 dark:text-primary-300">
                          To reach by {format(targetDateObj, 'MMM d, yyyy')}, save{' '}
                          <strong>{formatCurrency(requiredPerMonth)}</strong> per month.
                          {monthlySurplus > 0 && monthlySurplus < requiredPerMonth && (
                            <span className="block mt-1 text-amber-700 dark:text-amber-300">
                              You&apos;re currently saving ~{formatCurrency(monthlySurplus)}/month — increase savings or cut spending to hit this date.
                            </span>
                          )}
                        </p>
                      )}
                      {monthlySurplus > 0 && monthsToGoal != null && !requiredPerMonth && (
                        <p className="text-sm text-primary-700 dark:text-primary-300">
                          At your current rate (~{formatCurrency(monthlySurplus)}/month), you&apos;ll reach this in about{' '}
                          <strong>{Math.ceil(monthsToGoal)} months</strong>
                          {estimatedDate && ` (by ${format(estimatedDate, 'MMM yyyy')})`}.
                        </p>
                      )}
                      {monthlySurplus <= 0 && !requiredPerMonth && (
                        <p className="text-sm text-primary-700 dark:text-primary-300">
                          Start saving (spend less than you earn) to see an estimated date. Check where to spend less below.
                        </p>
                      )}
                    </div>
                  )}

                  {topCategories.length > 0 && amountNeeded > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : goal.id)}
                        className="mt-4 flex items-center gap-2 text-sm font-medium text-primary-700 dark:text-primary-300 hover:text-primary-900 dark:hover:text-white transition-colors"
                      >
                        Where to spend less to get there faster
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {isExpanded && (
                        <div className="mt-3 space-y-2 pl-1">
                          {topCategories.map((cat) => {
                            const cutAmount = Math.round(cat.value * 0.1) || 10
                            const newSurplus = monthlySurplus + cutAmount
                            const oldMonths = monthlySurplus > 0 ? amountNeeded / monthlySurplus : 999
                            const newMonths = newSurplus > 0 ? amountNeeded / newSurplus : 999
                            const monthsEarlier = Math.max(0, Math.ceil(oldMonths - newMonths))
                            return (
                              <p key={cat.name} className="text-sm text-primary-600 dark:text-primary-400">
                                Spend <strong>{formatCurrency(cutAmount)} less</strong> per month on{' '}
                                <strong>{cat.name}</strong>
                                {monthsEarlier > 0 && (
                                  <> → reach about <strong>{monthsEarlier} months</strong> earlier</>
                                )}.
                              </p>
                            )
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <GoalModal goal={editingGoal} onClose={handleCloseModal} />
      )}
    </div>
  )
}
