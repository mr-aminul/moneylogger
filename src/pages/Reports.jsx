import { useState, useMemo } from 'react'
import { useData } from '../contexts/DataContext'
import {
  format,
  startOfYear,
  endOfYear,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  eachMonthOfInterval,
  eachDayOfInterval,
  isWithinInterval,
  differenceInDays,
  subDays,
  parseISO,
} from 'date-fns'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react'

const RANGE_MODES = [
  { value: 'year', label: 'This year' },
  { value: 'custom', label: 'Custom range' },
]

export default function Reports() {
  const { expenses, formatCurrency } = useData()
  const currentDate = new Date()

  const yearStart = startOfYear(currentDate)
  const yearEnd = endOfYear(currentDate)

  const [rangeMode, setRangeMode] = useState('year')
  const [customFrom, setCustomFrom] = useState(() => format(subDays(currentDate, 30), 'yyyy-MM-dd'))
  const [customTo, setCustomTo] = useState(() => format(currentDate, 'yyyy-MM-dd'))

  const { rangeStart, rangeEnd } = useMemo(() => {
    if (rangeMode === 'custom' && customFrom && customTo) {
      const from = startOfDay(parseISO(customFrom))
      const to = endOfDay(parseISO(customTo))
      return {
        rangeStart: from <= to ? from : to,
        rangeEnd: to >= from ? to : from,
      }
    }
    return { rangeStart: yearStart, rangeEnd: yearEnd }
  }, [rangeMode, customFrom, customTo, yearStart, yearEnd])

  const previousRangeEnd = subDays(rangeStart, 1)
  const rangeDays = differenceInDays(rangeEnd, rangeStart) + 1
  const previousRangeStart = subDays(previousRangeEnd, rangeDays - 1)

  const expensesOnly = useMemo(
    () => expenses.filter((exp) => exp.type !== 'income'),
    [expenses]
  )
  const incomeOnly = useMemo(
    () => expenses.filter((exp) => exp.type === 'income'),
    [expenses]
  )

  const periodData = useMemo(() => {
    const daysInRange = differenceInDays(rangeEnd, rangeStart) + 1
    if (daysInRange <= 31) {
      const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd })
      return days.map((day) => {
        const dStart = startOfDay(day)
        const dEnd = endOfDay(day)
        const dayExpenses = expensesOnly.filter((exp) =>
          isWithinInterval(new Date(exp.date), { start: dStart, end: dEnd })
        )
        const dayIncome = incomeOnly.filter((exp) =>
          isWithinInterval(new Date(exp.date), { start: dStart, end: dEnd })
        )
        const totalExpenses = dayExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
        const totalIncome = dayIncome.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
        return {
          label: format(day, 'MMM d'),
          total: totalExpenses,
          income: totalIncome,
          net: totalIncome - totalExpenses,
          count: dayExpenses.length + dayIncome.length,
        }
      })
    }
    const months = eachMonthOfInterval({ start: rangeStart, end: rangeEnd })
    return months.map((month) => {
      const mStart = startOfMonth(month)
      const mEnd = endOfMonth(month)
      const monthExpenses = expensesOnly.filter((exp) =>
        isWithinInterval(new Date(exp.date), { start: mStart, end: mEnd })
      )
      const monthIncome = incomeOnly.filter((exp) =>
        isWithinInterval(new Date(exp.date), { start: mStart, end: mEnd })
      )
      const totalExpenses = monthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
      const totalIncome = monthIncome.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
      return {
        label: format(month, 'MMM'),
        total: totalExpenses,
        income: totalIncome,
        net: totalIncome - totalExpenses,
        count: monthExpenses.length + monthIncome.length,
      }
    })
  }, [expensesOnly, incomeOnly, rangeStart, rangeEnd])

  const categoryPeriodData = useMemo(() => {
    const categoryTotals = {}
    expensesOnly.forEach((exp) => {
      const expDate = new Date(exp.date)
      if (isWithinInterval(expDate, { start: rangeStart, end: rangeEnd })) {
        const category = exp.category || 'Others'
        categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(exp.amount || 0)
      }
    })
    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [expensesOnly, rangeStart, rangeEnd])

  const totalPeriodExpenses = periodData.reduce((sum, m) => sum + m.total, 0)
  const totalPeriodIncome = periodData.reduce((sum, m) => sum + m.income, 0)
  const totalPeriodNet = totalPeriodIncome - totalPeriodExpenses
  const averagePerBucket = periodData.length > 0 ? totalPeriodExpenses / periodData.length : 0

  const previousPeriodExpenses = useMemo(() => {
    return expensesOnly
      .filter((exp) => isWithinInterval(new Date(exp.date), { start: previousRangeStart, end: previousRangeEnd }))
      .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
  }, [expensesOnly, previousRangeStart, previousRangeEnd])

  const previousPeriodIncome = useMemo(() => {
    return incomeOnly
      .filter((exp) => isWithinInterval(new Date(exp.date), { start: previousRangeStart, end: previousRangeEnd }))
      .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
  }, [incomeOnly, previousRangeStart, previousRangeEnd])

  const previousPeriodNet = previousPeriodIncome - previousPeriodExpenses

  const expenseChange = totalPeriodExpenses - previousPeriodExpenses
  const expenseChangePct = previousPeriodExpenses > 0 ? (expenseChange / previousPeriodExpenses) * 100 : (totalPeriodExpenses > 0 ? 100 : 0)
  const incomeChange = totalPeriodIncome - previousPeriodIncome
  const incomeChangePct = previousPeriodIncome > 0 ? (incomeChange / previousPeriodIncome) * 100 : (totalPeriodIncome > 0 ? 100 : 0)
  const netChange = totalPeriodNet - previousPeriodNet

  const rangeLabel = rangeMode === 'year'
    ? format(currentDate, 'yyyy')
    : `${format(rangeStart, 'MMM d, yyyy')} – ${format(rangeEnd, 'MMM d, yyyy')}`

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 dark:text-white">
            Reports
          </h1>
          <p className="text-sm text-primary-600 dark:text-primary-400 mt-1">
            {rangeMode === 'year' ? 'Annual' : 'Custom period'} income & spending
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary-500 dark:text-primary-400" />
            <select
              value={rangeMode}
              onChange={(e) => setRangeMode(e.target.value)}
              className="px-3 py-2 rounded-lg border border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-800 text-primary-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {RANGE_MODES.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {rangeMode === 'custom' && (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-3 py-2 rounded-lg border border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-800 text-primary-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-primary-500 dark:text-primary-400">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-3 py-2 rounded-lg border border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-800 text-primary-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Compare to previous period */}
      <div className="bg-white dark:bg-primary-800 rounded-xl p-6 shadow-sm border border-primary-200 dark:border-primary-700">
        <h3 className="text-lg font-semibold text-primary-900 dark:text-white mb-4">
          Compare to previous period
        </h3>
        <p className="text-sm text-primary-600 dark:text-primary-400 mb-4">
          Current: {rangeLabel} vs previous {rangeDays}-day period ending {format(previousRangeEnd, 'MMM d, yyyy')}.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-lg bg-primary-50 dark:bg-primary-700/50">
            <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-1">Income</p>
            <p className="text-xl font-bold text-primary-900 dark:text-white">
              {formatCurrency(totalPeriodIncome)}
            </p>
            <p className="text-sm text-primary-500 dark:text-primary-400 mt-1">
              Previous: {formatCurrency(previousPeriodIncome)}
            </p>
            <ChangeBadge value={incomeChange} pct={incomeChangePct} />
          </div>
          <div className="p-4 rounded-lg bg-primary-50 dark:bg-primary-700/50">
            <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-1">Expenses</p>
            <p className="text-xl font-bold text-primary-900 dark:text-white">
              {formatCurrency(totalPeriodExpenses)}
            </p>
            <p className="text-sm text-primary-500 dark:text-primary-400 mt-1">
              Previous: {formatCurrency(previousPeriodExpenses)}
            </p>
            <ChangeBadge value={-expenseChange} pct={-expenseChangePct} type="negative" />
          </div>
          <div className="p-4 rounded-lg bg-primary-50 dark:bg-primary-700/50">
            <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-1">Net</p>
            <p className={`text-xl font-bold ${totalPeriodNet >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(totalPeriodNet)}
            </p>
            <p className="text-sm text-primary-500 dark:text-primary-400 mt-1">
              Previous: {formatCurrency(previousPeriodNet)}
            </p>
            <ChangeBadge value={netChange} pct={previousPeriodNet !== 0 ? (netChange / Math.abs(previousPeriodNet)) * 100 : (netChange !== 0 ? 100 : 0)} />
          </div>
        </div>
      </div>

      {/* Income vs Expenses chart */}
      <div className="bg-white dark:bg-primary-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-primary-900 dark:text-white mb-4">
          Income vs Expenses — {rangeLabel}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Total Income</p>
            <p className="text-2xl font-bold text-primary-900 dark:text-white">
              {formatCurrency(totalPeriodIncome)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-1">Total Expenses</p>
            <p className="text-2xl font-bold text-primary-900 dark:text-white">
              {formatCurrency(totalPeriodExpenses)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-1">Net</p>
            <p className={`text-2xl font-bold ${totalPeriodNet >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(totalPeriodNet)}
            </p>
          </div>
        </div>
        {periodData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={periodData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
                formatter={(value) => [formatCurrency(value)]}
              />
              <Legend />
              <Bar dataKey="income" fill="#22c55e" name="Income" />
              <Bar dataKey="total" fill="#64748b" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-primary-400">
            No transactions in this period
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-primary-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-2">
            Total Period Expenses
          </h3>
          <p className="text-2xl font-bold text-primary-900 dark:text-white">
            {formatCurrency(totalPeriodExpenses)}
          </p>
        </div>
        <div className="bg-white dark:bg-primary-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-2">
            Average per {differenceInDays(rangeEnd, rangeStart) + 1 <= 31 ? 'day' : 'month'}
          </h3>
          <p className="text-2xl font-bold text-primary-900 dark:text-white">
            {formatCurrency(averagePerBucket)}
          </p>
        </div>
        <div className="bg-white dark:bg-primary-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-2">
            Total Transactions
          </h3>
          <p className="text-2xl font-bold text-primary-900 dark:text-white">
            {expenses.length}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-primary-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-primary-900 dark:text-white mb-4">
          Spending Trend — {rangeLabel}
        </h3>
        {periodData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={periodData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
                formatter={(value) => [formatCurrency(value), 'Total']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#64748b"
                strokeWidth={2}
                name="Expenses"
                dot={{ fill: '#64748b', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[400px] text-primary-400">
            No expenses in this period
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-primary-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-primary-900 dark:text-white mb-4">
          Category Breakdown — {rangeLabel}
        </h3>
        {categoryPeriodData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={categoryPeriodData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
                formatter={(value) => [formatCurrency(value), 'Amount']}
              />
              <Bar dataKey="value" fill="#64748b" name="Amount" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[400px] text-primary-400">
            No expenses in this period
          </div>
        )}
      </div>
    </div>
  )
}

function ChangeBadge({ value, pct }) {
  const safePct = Number.isFinite(pct) ? pct : 0
  if (value === 0 && safePct === 0) {
    return <p className="text-sm text-primary-500 dark:text-primary-400 mt-2">No change</p>
  }
  const isPositive = value > 0
  const color = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
  const Icon = isPositive ? TrendingUp : TrendingDown
  return (
    <p className={`text-sm font-medium mt-2 flex items-center gap-1 ${color}`}>
      <Icon className="w-4 h-4" />
      {isPositive ? '+' : ''}{safePct.toFixed(1)}% vs previous period
    </p>
  )
}
