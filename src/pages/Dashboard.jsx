import { useState, useMemo, useCallback } from 'react'
import { useData } from '../contexts/DataContext'
import { format, startOfMonth, endOfMonth, isWithinInterval, isSameDay } from 'date-fns'
import { getPeriodRange, formatPeriodLabel, getDaysRemainingInPeriod } from '../lib/period'
import { parseVoiceExpense } from '../lib/parseVoiceExpense'
import { TrendingUp, TrendingDown, AlertCircle, DollarSign, Plus, Receipt, Calendar, HelpCircle, X } from 'lucide-react'
import CategoryIcon from '../components/CategoryIcon'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import ExpenseModal from '../components/ExpenseModal'
import VoiceInputButton from '../components/UI/VoiceInputButton'
import VoiceLanguageSwitcher from '../components/UI/VoiceLanguageSwitcher'

const COLORS = ['#64748b', '#34d399', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

export default function Dashboard() {
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [voiceMessage, setVoiceMessage] = useState(null) // { type: 'success'|'error', text: string }
  const [showAllowanceExplanation, setShowAllowanceExplanation] = useState(false)
  const { expenses, budgets, recurring, formatCurrency, budgetPeriod, categoryNames, addExpense } = useData()
  const voiceParsed = useMemo(
    () => parseVoiceExpense(voiceTranscript, categoryNames),
    [voiceTranscript, categoryNames]
  )

  // Create expense directly from voice and show success/error message
  const handleVoiceTranscript = useCallback(
    async (text) => {
      if (!text?.trim()) return
      const parsed = parseVoiceExpense(text.trim(), categoryNames)
      const amount = parsed.amount ? parseFloat(parsed.amount) : 0
      if (!amount || amount <= 0) {
        setVoiceMessage({ type: 'error', text: "Couldn't detect amount. Try: \"orange juice 50\" or \"50 taka orange juice\"." })
        setVoiceTranscript('')
        return
      }
      try {
        const dateToUse = parsed.date || format(new Date(), 'yyyy-MM-dd')
        await addExpense({
          title: (parsed.title || 'Expense').trim(),
          amount,
          category: parsed.category || 'Others',
          date: dateToUse,
          note: '',
        })
        setVoiceMessage({
          type: 'success',
          text: `Added: ${parsed.title || 'Expense'} — ${formatCurrency(amount)}`,
        })
        setVoiceTranscript('')
      } catch (err) {
        setVoiceMessage({ type: 'error', text: err?.message ?? 'Failed to add expense.' })
        setVoiceTranscript('')
      }
      setTimeout(() => setVoiceMessage(null), 4000)
    },
    [categoryNames, addExpense, formatCurrency]
  )

  const currentDate = new Date()
  const { start: periodStart, end: periodEnd } = getPeriodRange(budgetPeriod, currentDate)
  const periodLabel = formatPeriodLabel(budgetPeriod, currentDate)

  const periodTransactions = useMemo(() => {
    return expenses.filter((exp) => {
      const expDate = new Date(exp.date)
      return isWithinInterval(expDate, { start: periodStart, end: periodEnd })
    })
  }, [expenses, periodStart, periodEnd])

  const periodExpenses = useMemo(
    () => periodTransactions.filter((t) => t.type === 'expense'),
    [periodTransactions]
  )
  const periodIncomeList = useMemo(
    () => periodTransactions.filter((t) => t.type === 'income'),
    [periodTransactions]
  )

  const totalExpenses = useMemo(() => {
    return periodExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
  }, [periodExpenses])
  const totalIncome = useMemo(() => {
    return periodIncomeList.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
  }, [periodIncomeList])
  const netCashFlow = totalIncome - totalExpenses

  const categoryBreakdown = useMemo(() => {
    const breakdown = {}
    periodExpenses.forEach((exp) => {
      const category = exp.category || 'Others'
      breakdown[category] = (breakdown[category] || 0) + parseFloat(exp.amount || 0)
    })
    return Object.entries(breakdown).map(([name, value]) => ({ name, value }))
  }, [periodExpenses])

  const largestCategory = useMemo(() => {
    if (categoryBreakdown.length === 0) return null
    return categoryBreakdown.reduce((max, cat) => 
      cat.value > max.value ? cat : max
    )
  }, [categoryBreakdown])

  const totalBudget = useMemo(() => {
    return Object.values(budgets).reduce((sum, amount) => sum + parseFloat(amount || 0), 0)
  }, [budgets])

  const periodSpent = useMemo(
    () => periodExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0),
    [periodExpenses]
  )

  // Recurring due this period (nextDate in range), expense type only. Exclude already paid (matching expense in period).
  // Use date strings (YYYY-MM-DD) so timezone doesn't exclude e.g. 2026-02-28.
  const periodStartStr = format(periodStart, 'yyyy-MM-dd')
  const periodEndStr = format(periodEnd, 'yyyy-MM-dd')

  const { recurringReserved, recurringReservedList } = useMemo(() => {
    const list = Array.isArray(recurring) ? recurring : []
    const dueThisPeriod = list.filter((r) => {
      if (r.type === 'income') return false
      const nextStr = r.nextDate ? (typeof r.nextDate === 'string' ? r.nextDate : format(new Date(r.nextDate), 'yyyy-MM-dd')) : ''
      if (!nextStr) return false
      return nextStr >= periodStartStr && nextStr <= periodEndStr
    })
    let reserved = 0
    const reservedList = []
    dueThisPeriod.forEach((r) => {
      const amount = parseFloat(r.amount) || 0
      const title = (r.title || '').trim()
      // Paid if user linked this expense to this upcoming item, or logged with same title + amount.
      const alreadyPaid = periodExpenses.some(
        (exp) =>
          exp.recurringTransactionId === r.id ||
          (parseFloat(exp.amount) === amount && (exp.title || '').trim() === title)
      )
      if (!alreadyPaid) {
        reserved += amount
        reservedList.push({ title: title || 'Upcoming expense', amount })
      }
    })
    return { recurringReserved: reserved, recurringReservedList: reservedList }
  }, [recurring, periodStartStr, periodEndStr, periodExpenses])

  // Income-based spendable: Income − Recurring reserved − Already spent. Fallback to budget-based if no income.
  const spendable = useMemo(() => {
    const base = totalIncome > 0 ? totalIncome - recurringReserved - periodSpent : totalBudget - periodSpent
    return base
  }, [totalIncome, totalBudget, recurringReserved, periodSpent])

  const budgetRemaining = totalBudget - periodSpent
  const daysRemaining = getDaysRemainingInPeriod(budgetPeriod, currentDate)
  const dailyAllowance = useMemo(() => {
    if (daysRemaining <= 0) return 0
    return Math.max(0, spendable) / daysRemaining
  }, [spendable, daysRemaining])

  const spentToday = useMemo(() => {
    return periodExpenses
      .filter((exp) => isSameDay(new Date(exp.date), currentDate))
      .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
  }, [periodExpenses, currentDate])

  // Today you can spend = allowed today − spent today (remaining for the day)
  const todayRemaining = Math.max(0, dailyAllowance - spentToday)

  const monthlyTrend = useMemo(() => {
    const last6Months = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthStart = startOfMonth(date)
      const monthEnd = endOfMonth(date)
      const monthExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.date)
        return isWithinInterval(expDate, { start: monthStart, end: monthEnd })
      })
      const total = monthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
      last6Months.push({
        month: format(date, 'MMM'),
        amount: total,
      })
    }
    return last6Months
  }, [expenses, currentDate])

  const budgetStatus = useMemo(() => {
    const status = {}
    Object.entries(budgets).forEach(([category, budget]) => {
      const categoryExpenses = periodExpenses
        .filter((exp) => exp.category === category)
        .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
      const budgetNum = parseFloat(budget || 0)
      const percentage = budgetNum > 0 ? (categoryExpenses / budgetNum) * 100 : 0
      const exceeded = categoryExpenses > budgetNum
      status[category] = {
        budget: budgetNum,
        spent: categoryExpenses,
        remaining: budgetNum - categoryExpenses,
        percentage,
        exceeded,
        approaching: percentage >= 80 && !exceeded,
      }
    })
    return status
  }, [budgets, periodExpenses])

  const exceededBudgets = Object.values(budgetStatus).filter((s) => s.exceeded)
  const approachingBudgets = Object.entries(budgetStatus).filter(([, s]) => s.approaching)
  const hasTransactions = expenses.length > 0

  return (
    <div className="space-y-6">
      {/* Voice success/error — fixed top-center so it's always visible and noticeable */}
      {voiceMessage && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg border max-w-[min(420px,calc(100vw-2rem))] toast-notice ${
            voiceMessage.type === 'success'
              ? 'bg-emerald-100 dark:bg-emerald-900/90 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
              : 'bg-red-100 dark:bg-red-900/90 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800'
          }`}
        >
          <span className="text-sm font-medium flex-1">{voiceMessage.text}</span>
          <button
            type="button"
            onClick={() => setVoiceMessage(null)}
            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Prominent Add Expense Section */}
      <div className="bg-gradient-to-br from-primary-900 to-primary-800 dark:from-primary-800 dark:to-primary-900 rounded-2xl p-8 shadow-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              {hasTransactions ? 'Add New Expense' : 'Welcome! Let\'s Get Started'}
            </h2>
            <p className="text-primary-200 text-lg">
              {hasTransactions
                ? 'Quickly record your expense on the go'
                : 'Start tracking your expenses by adding your first one'}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
            <button
              onClick={() => { setVoiceTranscript(''); setShowExpenseModal(true); }}
              className="group flex items-center gap-3 px-8 py-4 bg-white dark:bg-primary-700 text-primary-900 dark:text-white rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 min-w-[200px] justify-center sm:justify-start"
            >
              <div className="w-10 h-10 rounded-full bg-primary-900 dark:bg-primary-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <span>Add Expense</span>
            </button>
            <VoiceLanguageSwitcher />
            <VoiceInputButton
              onOpenWithTranscript={handleVoiceTranscript}
              size="lg"
              variant="secondary"
              className="shrink-0"
            />
          </div>
        </div>
      </div>

      {/* Daily allowance – income-based, recurring reserved, no double-count; + spent today bar */}
      {(totalIncome > 0 || totalBudget > 0) && (
        <button
          type="button"
          onClick={() => setShowAllowanceExplanation(true)}
          className="w-full text-left bg-white dark:bg-primary-800 rounded-2xl p-6 sm:p-8 shadow-lg border-2 border-primary-200 dark:border-primary-700 hover:border-primary-400 dark:hover:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-primary-900 transition-colors"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-700 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary-600 dark:text-primary-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-primary-600 dark:text-primary-400">
                    Today you can spend
                  </h3>
                  <HelpCircle className="w-4 h-4 text-primary-400 shrink-0" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-primary-900 dark:text-white">
                  {spendable < 0
                    ? formatCurrency(0)
                    : formatCurrency(todayRemaining)}
                </p>
                <p className="text-xs text-primary-500 dark:text-primary-400 mt-1">
                  Click to see how this is calculated
                </p>
              </div>
            </div>
            <div className="text-sm text-primary-600 dark:text-primary-400 sm:text-right">
              {spendable < 0 ? (
                <span className="text-red-600 dark:text-red-400 font-medium">
                  Over by {formatCurrency(Math.abs(spendable))} ·{' '}
                  {daysRemaining > 0
                    ? `Try to spend less over the next ${daysRemaining} days`
                    : 'Period ended'}
                </span>
              ) : daysRemaining > 0 ? (
                <>
                  <span className="font-medium">{daysRemaining} days left</span>
                  {' · '}
                  {formatCurrency(spendable)} left to spend this {budgetPeriod === 'monthly' ? 'month' : budgetPeriod === 'weekly' ? 'week' : 'year'}
                </>
              ) : (
                'Period ended'
              )}
            </div>
          </div>

          {/* Breakdown: Income − Recurring − Spent = Remaining (when income-based) */}
          {totalIncome > 0 && (
            <div className="mt-4 pt-4 border-t border-primary-200 dark:border-primary-700 text-xs text-primary-600 dark:text-primary-400 space-y-1">
              <div className="flex justify-between">
                <span>Income this period</span>
                <span className="font-medium text-primary-900 dark:text-white">{formatCurrency(totalIncome)}</span>
              </div>
              {recurringReserved > 0 && (
                <div className="flex justify-between">
                  <span>Upcoming expenses due (not yet paid)</span>
                  <span>-{formatCurrency(recurringReserved)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Spent so far</span>
                <span>-{formatCurrency(periodSpent)}</span>
              </div>
              <div className="flex justify-between font-medium text-primary-900 dark:text-white pt-1">
                <span>Remaining</span>
                <span>{formatCurrency(spendable)}</span>
              </div>
            </div>
          )}

          {/* Spent today bar */}
          <div className="mt-4 pt-4 border-t border-primary-200 dark:border-primary-700">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-primary-600 dark:text-primary-400">Spent today</span>
              <span className="font-medium text-primary-900 dark:text-white">
                {formatCurrency(spentToday)}
                {dailyAllowance > 0 && (
                  <span className="text-primary-500 dark:text-primary-400 font-normal">
                    {' '}/ {formatCurrency(dailyAllowance)} allowed
                  </span>
                )}
              </span>
            </div>
            {dailyAllowance > 0 && (() => {
              const pct = (spentToday / dailyAllowance) * 100
              const fillClass = spentToday > dailyAllowance ? 'progress-fill-danger' : pct >= 80 ? 'progress-fill-warning' : 'progress-fill-success'
              return (
                <div className="progress-track h-3">
                  <div
                    className={`h-full ${fillClass}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              )
            })()}
          </div>

          <p className="mt-3 text-xs text-primary-500 dark:text-primary-400">
            Allowance is income minus recurring (due this period) and what you’ve already spent.
          </p>
        </button>
      )}

      {/* Explanation modal: how "Today you can spend" is calculated */}
      {showAllowanceExplanation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowAllowanceExplanation(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="allowance-explanation-title"
        >
          <div
            className="bg-white dark:bg-primary-800 rounded-2xl border border-primary-200 dark:border-primary-700 shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-primary-800 px-6 pt-6 pb-2 flex items-center justify-between border-b border-primary-200 dark:border-primary-700">
              <h2 id="allowance-explanation-title" className="text-lg font-semibold text-primary-900 dark:text-white">
                How we calculate today’s amount
              </h2>
              <button
                type="button"
                onClick={() => setShowAllowanceExplanation(false)}
                className="p-2 rounded-lg text-primary-500 dark:text-primary-400 hover:bg-primary-100 dark:bg-primary-700 hover:text-primary-900 dark:text-white"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-primary-600 dark:text-primary-400">
                We start from your income, reserve recurring payments, subtract what you’ve already spent, then split the rest by days and subtract what you spent today.
              </p>

              {/* Visual flow */}
              <div className="space-y-0">
                {/* Step 1: Income */}
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4">
                  <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-1">Step 1</div>
                  <div className="text-sm text-primary-700 dark:text-primary-300">Income this period</div>
                  <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(totalIncome > 0 ? totalIncome : totalBudget)}</div>
                </div>
                <div className="flex justify-center py-1">
                  <span className="text-primary-400 dark:text-primary-500 text-sm">− Recurring due</span>
                </div>

                {/* Step 2: Recurring */}
                {recurringReserved > 0 && (
                  <>
                    <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
                      <div className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">Step 2</div>
                      <div className="text-sm text-primary-700 dark:text-primary-300 mb-2">Upcoming expenses due this period (not yet paid)</div>
                      <p className="text-xs text-primary-500 dark:text-primary-400 mb-2">
                        We treat one as paid when you linked it (via the prompt when adding an expense) or logged an expense with the same title and amount.
                      </p>
                      {recurringReservedList.length > 0 && (
                        <ul className="space-y-1 mb-2 text-sm text-primary-600 dark:text-primary-400">
                          {recurringReservedList.map((item, i) => (
                            <li key={i} className="flex justify-between">
                              <span>{item.title}</span>
                              <span className="font-medium text-amber-700 dark:text-amber-300">−{formatCurrency(item.amount)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="text-lg font-bold text-amber-700 dark:text-amber-300 border-t border-amber-200 dark:border-amber-700 pt-2 mt-1">
                        Total reserved: −{formatCurrency(recurringReserved)}
                      </div>
                    </div>
                    <div className="flex justify-center py-1">
                      <span className="text-primary-400 dark:text-primary-500 text-sm">− Spent so far</span>
                    </div>
                  </>
                )}

                {/* Step 3: Spent so far */}
                <div className="rounded-xl bg-slate-100 dark:bg-primary-700 border border-slate-200 dark:border-primary-600 p-4">
                  <div className="text-xs font-medium text-slate-600 dark:text-primary-400 uppercase tracking-wide mb-1">
                    {recurringReserved > 0 ? 'Step 3' : 'Step 2'}
                  </div>
                  <div className="text-sm text-primary-700 dark:text-primary-300">Spent so far this period</div>
                  <div className="text-xl font-bold text-slate-700 dark:text-primary-200">−{formatCurrency(periodSpent)}</div>
                </div>
                <div className="flex justify-center py-1">
                  <span className="text-primary-400 dark:text-primary-500 text-sm">= Remaining for period</span>
                </div>

                {/* Step 4: Remaining */}
                <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
                  <div className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-1">
                    {recurringReserved > 0 ? 'Step 4' : 'Step 3'}
                  </div>
                  <div className="text-sm text-primary-600 dark:text-primary-400">Remaining to spend</div>
                  <div className="text-xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(spendable)}</div>
                </div>
                <div className="flex justify-center py-1">
                  <span className="text-primary-500 dark:text-primary-400 text-sm">÷ {daysRemaining} days left</span>
                </div>

                {/* Step 5: Daily allowance */}
                <div className="rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 p-4">
                  <div className="text-xs font-medium text-violet-700 dark:text-violet-400 uppercase tracking-wide mb-1">
                    {recurringReserved > 0 ? 'Step 5' : 'Step 4'}
                  </div>
                  <div className="text-sm text-primary-600 dark:text-primary-400">Daily allowance</div>
                  <div className="text-xl font-bold text-violet-700 dark:text-violet-300">{formatCurrency(dailyAllowance)}</div>
                </div>
                <div className="flex justify-center py-1">
                  <span className="text-primary-500 dark:text-primary-400 text-sm">− Spent today</span>
                </div>

                {/* Step 6: Spent today */}
                <div className="rounded-xl bg-primary-100 dark:bg-primary-700 border border-primary-200 dark:border-primary-700 p-4">
                  <div className="text-xs font-medium text-primary-500 dark:text-primary-400 uppercase tracking-wide mb-1">
                    {recurringReserved > 0 ? 'Step 6' : 'Step 5'}
                  </div>
                  <div className="text-sm text-primary-600 dark:text-primary-400">Spent today</div>
                  <div className="text-xl font-bold text-primary-600 dark:text-primary-400">−{formatCurrency(spentToday)}</div>
                </div>
                <div className="flex justify-center py-1">
                  <span className="text-primary-500 dark:text-primary-400 text-sm font-medium">= Today you can spend</span>
                </div>

                {/* Result */}
                <div className="rounded-xl bg-primary-100 dark:bg-primary-700 border-2 border-primary-500 dark:border-primary-400 p-5 mt-2">
                  <div className="text-sm text-primary-600 dark:text-primary-400 mb-1">Result</div>
                  <div className="text-2xl font-bold text-primary-900 dark:text-white">
                    {formatCurrency(todayRemaining)}
                  </div>
                  <div className="text-xs text-primary-500 dark:text-primary-400 mt-1">
                    This is the amount you can still spend today.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats - Only show if there are transactions */}
      {hasTransactions && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Income"
          value={formatCurrency(totalIncome)}
          subtitle={periodLabel}
          icon={TrendingUp}
          trend="positive"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(totalExpenses)}
          subtitle={periodLabel}
          icon={DollarSign}
          trend="negative"
        />
        <StatCard
          title="Net"
          value={formatCurrency(netCashFlow)}
          subtitle={netCashFlow >= 0 ? 'Surplus' : 'Deficit'}
          icon={TrendingDown}
          trend={netCashFlow >= 0 ? 'positive' : 'negative'}
        />
        <StatCard
          title="Budget Remaining"
          value={formatCurrency(Math.max(0, budgetRemaining))}
          subtitle={budgetRemaining < 0 ? 'Over budget' : 'Available'}
          icon={budgetRemaining < 0 ? AlertCircle : TrendingDown}
          trend={budgetRemaining < 0 ? 'negative' : 'positive'}
        />
        <StatCard
          title="Largest Category"
          value={largestCategory ? largestCategory.name : 'N/A'}
          subtitle={largestCategory ? formatCurrency(largestCategory.value) : 'No expenses this period'}
          icon={Receipt}
          trend={null}
        />
        <StatCard
          title="Budget Alerts"
          value={exceededBudgets.length}
          subtitle={exceededBudgets.length > 0 ? 'Categories over budget' : 'All within budget'}
          icon={AlertCircle}
          trend={exceededBudgets.length > 0 ? 'negative' : 'positive'}
        />
      </div>
      )}

      {/* Charts Section - Only show if there are expenses */}
      {hasTransactions && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-primary-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-primary-900 dark:text-white mb-4">
            Monthly Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#64748b"
                strokeWidth={2}
                dot={{ fill: '#64748b', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-primary-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-primary-900 dark:text-white mb-4">
            Category Breakdown
          </h3>
          {categoryBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-primary-400">
              No expenses this period
            </div>
          )}
        </div>
      </div>
      )}

      {/* Approaching budget (80%+) */}
      {approachingBudgets.length > 0 && (
        <div className="bg-white dark:bg-primary-800 rounded-xl p-6 shadow-sm border-amber-500/30">
          <h3 className="text-lg font-semibold text-amber-600 dark:text-amber-400 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Approaching budget (80%+)
          </h3>
          <div className="space-y-2">
            {approachingBudgets.map(([category, status]) => (
              <div
                key={category}
                className="flex justify-between items-center p-3 bg-primary-100 dark:bg-primary-700 rounded-lg"
              >
                <span className="font-medium text-primary-900 dark:text-white flex items-center gap-2">
                  <CategoryIcon name={category} size={18} className="shrink-0 text-primary-600 dark:text-primary-400" />
                  {category}
                </span>
                <span className="text-amber-600 dark:text-amber-400 text-sm font-medium">
                  {status.percentage.toFixed(0)}% used · {formatCurrency(status.remaining)} left
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget Exceeded Alerts */}
      {exceededBudgets.length > 0 && (
        <div className="bg-white dark:bg-primary-800 rounded-xl p-6 shadow-sm border-red-200 dark:border-red-800">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Budget exceeded
          </h3>
          <div className="space-y-2">
            {Object.entries(budgetStatus)
              .filter(([, status]) => status.exceeded)
              .map(([category, status]) => (
                <div
                  key={category}
                  className="flex justify-between items-center p-3 bg-primary-100 dark:bg-primary-700 rounded-lg"
                >
                  <span className="font-medium text-primary-900 dark:text-white flex items-center gap-2">
                    <CategoryIcon name={category} size={18} className="shrink-0 text-primary-600 dark:text-primary-400" />
                    {category}
                  </span>
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    Over by {formatCurrency(Math.abs(status.remaining))}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Empty State - Show when no transactions */}
      {!hasTransactions && (
        <div className="bg-white dark:bg-primary-800 rounded-xl p-12 shadow-sm text-center">
          <div className="w-20 h-20 rounded-full bg-accent-100 dark:bg-accent-900/20 flex items-center justify-center mx-auto mb-6">
            <Receipt className="w-10 h-10 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="text-2xl font-semibold text-primary-900 dark:text-white mb-2">
            No expenses yet
          </h3>
          <p className="text-primary-600 dark:text-primary-400 mb-8 max-w-md mx-auto">
            Start tracking your spending by adding your first expense. It only takes a few seconds.
          </p>
          <button
            onClick={() => setShowExpenseModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-900 dark:bg-primary-700 text-white rounded-lg font-semibold transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Your First Expense
          </button>
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <ExpenseModal
          transaction={null}
          type="expense"
          onClose={() => { setShowExpenseModal(false); setVoiceTranscript(''); }}
          initialTitle={voiceParsed.title}
          initialAmount={voiceParsed.amount}
          initialCategory={voiceParsed.category}
        />
      )}
    </div>
  )
}

function StatCard({ title, value, subtitle, icon: Icon, trend }) {
  return (
    <div className="bg-white dark:bg-primary-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-primary-600 dark:text-primary-400">
          {title}
        </h3>
        <Icon
          className={`w-5 h-5 ${
            trend === 'positive'
              ? 'text-green-500'
              : trend === 'negative'
              ? 'text-red-500'
              : 'text-primary-400'
          }`}
        />
      </div>
      <p className="text-2xl font-bold text-primary-900 dark:text-white mb-1">
        {value}
      </p>
      <p className="text-sm text-primary-500 dark:text-primary-400">{subtitle}</p>
    </div>
  )
}
