import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import { User, Mail, Calendar, Coins, Target } from 'lucide-react'

export default function Settings() {
  const { user } = useAuth()
  const { currency, currencies, setCurrency, formatCurrency, budgetPeriod, budgetPeriods, setBudgetPeriod } = useData()
  const [savingCurrency, setSavingCurrency] = useState(false)
  const [currencyError, setCurrencyError] = useState('')
  const [savingPeriod, setSavingPeriod] = useState(false)
  const [periodError, setPeriodError] = useState('')

  const handleCurrencyChange = async (e) => {
    const newCurrency = e.target.value
    setCurrencyError('')
    setSavingCurrency(true)
    try {
      await setCurrency(newCurrency)
    } catch (err) {
      setCurrencyError(err.message ?? 'Failed to save currency')
    } finally {
      setSavingCurrency(false)
    }
  }

  const handleBudgetPeriodChange = async (e) => {
    const newPeriod = e.target.value
    setPeriodError('')
    setSavingPeriod(true)
    try {
      await setBudgetPeriod(newPeriod)
    } catch (err) {
      setPeriodError(err.message ?? 'Failed to save budget period')
    } finally {
      setSavingPeriod(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-900 dark:text-white">
          Settings
        </h1>
        <p className="text-sm text-primary-600 dark:text-primary-400 mt-1">
          Manage your account settings
        </p>
      </div>

      <div className="bg-white dark:bg-primary-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-primary-900 dark:text-white mb-6">
          Account Information
        </h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6 pb-6 border-b border-primary-200 dark:border-primary-700">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="w-20 h-20 rounded-full object-cover ring-2 ring-primary-200 dark:ring-primary-600"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary-200 dark:bg-primary-600 flex items-center justify-center">
              <User className="w-10 h-10 text-primary-600 dark:text-primary-300" />
            </div>
          )}
          <div>
            <p className="text-2xl font-semibold text-primary-900 dark:text-white">
              {user?.name || 'N/A'}
            </p>
            <p className="text-primary-600 dark:text-primary-400">{user?.email || 'N/A'}</p>
            {user?.createdAt && (
              <p className="text-sm text-primary-500 dark:text-primary-400 mt-1">
                Member since {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-primary-50 dark:bg-primary-700/50">
            <div className="w-10 h-10 rounded-full bg-primary-200 dark:bg-primary-600 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-primary-600 dark:text-primary-300" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-primary-600 dark:text-primary-400">Name</p>
              <p className="font-medium text-primary-900 dark:text-white truncate">
                {user?.name || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-lg bg-primary-50 dark:bg-primary-700/50">
            <div className="w-10 h-10 rounded-full bg-primary-200 dark:bg-primary-600 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-primary-600 dark:text-primary-300" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-primary-600 dark:text-primary-400">Email</p>
              <p className="font-medium text-primary-900 dark:text-white truncate">
                {user?.email || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-lg bg-primary-50 dark:bg-primary-700/50">
            <div className="w-10 h-10 rounded-full bg-primary-200 dark:bg-primary-600 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-300" />
            </div>
            <div>
              <p className="text-sm text-primary-600 dark:text-primary-400">Member Since</p>
              <p className="font-medium text-primary-900 dark:text-white">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-primary-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-primary-900 dark:text-white mb-6 flex items-center gap-2">
          <Coins className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          Currency
        </h2>
        <p className="text-sm text-primary-600 dark:text-primary-400 mb-4">
          All amounts in the app (expenses, budgets, reports) will be shown in this currency.
        </p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <label htmlFor="currency" className="text-sm font-medium text-primary-700 dark:text-primary-300 shrink-0">
            Default currency
          </label>
          <select
            id="currency"
            value={currency}
            onChange={handleCurrencyChange}
            disabled={savingCurrency}
            className="px-4 py-2 rounded-lg border border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} ({c.symbol})
              </option>
            ))}
          </select>
          <span className="text-sm text-primary-500 dark:text-primary-400">
            Example: {formatCurrency(1234.56)}
          </span>
        </div>
        {currencyError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{currencyError}</p>
        )}
      </div>

      <div className="bg-white dark:bg-primary-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-primary-900 dark:text-white mb-6 flex items-center gap-2">
          <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          Budget period
        </h2>
        <p className="text-sm text-primary-600 dark:text-primary-400 mb-4">
          Budgets are compared against spending for this period (weekly, monthly, or yearly).
        </p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <label htmlFor="budget-period" className="text-sm font-medium text-primary-700 dark:text-primary-300 shrink-0">
            Period
          </label>
          <select
            id="budget-period"
            value={budgetPeriod}
            onChange={handleBudgetPeriodChange}
            disabled={savingPeriod}
            className="px-4 py-2 rounded-lg border border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
          >
            {budgetPeriods.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        {periodError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{periodError}</p>
        )}
      </div>

      <div className="bg-white dark:bg-primary-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-primary-900 dark:text-white mb-4">
          Data Management
        </h2>
        <p className="text-sm text-primary-600 dark:text-primary-400 mb-4">
          Your account and data (expenses, budgets) are stored securely with Supabase and sync across
          devices when you sign in with Google. You can export your expenses as CSV from the Expenses page.
        </p>
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            <strong>Signed in with Google.</strong> Your name, email, and profile picture come from your
            Google account and are used only to personalize this app.
          </p>
        </div>
      </div>
    </div>
  )
}
