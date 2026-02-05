import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { addMonths, addWeeks, addYears } from 'date-fns'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
import { formatCurrency as formatCurrencyUtil, CURRENCIES } from '../lib/currency'
import { PERIODS, getPeriodRange } from '../lib/period'
import { format } from 'date-fns'

const DataContext = createContext()

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}

const DEFAULT_CATEGORY_NAMES = ['Food', 'Transport', 'Rent', 'Utilities', 'Shopping', 'Others']

function mapTransaction(row) {
  return {
    id: row.id,
    type: row.type === 'income' ? 'income' : 'expense',
    title: row.title ?? '',
    amount: parseFloat(row.amount) ?? 0,
    category: row.category ?? 'Others',
    date: row.date,
    note: row.note ?? '',
    createdAt: row.created_at,
    recurringTransactionId: row.recurring_transaction_id ?? null,
  }
}

function mapRecurring(row) {
  return {
    id: row.id,
    title: row.title ?? '',
    amount: parseFloat(row.amount) ?? 0,
    category: row.category ?? 'Others',
    type: row.type === 'income' ? 'income' : 'expense',
    frequency: row.frequency ?? 'monthly',
    nextDate: row.next_date,
    note: row.note ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapGoal(row) {
  return {
    id: row.id,
    title: row.title ?? '',
    targetAmount: parseFloat(row.target_amount) ?? 0,
    targetDate: row.target_date ?? null,
    currentAmount: parseFloat(row.current_amount) ?? 0,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapShoppingItem(row) {
  return {
    id: row.id,
    title: row.title ?? '',
    completed: !!row.completed,
    dueDate: row.due_date ?? null,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at ?? null,
  }
}

export function DataProvider({ children }) {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [budgets, setBudgets] = useState({})
  const [categories, setCategoriesState] = useState([])
  const [recurring, setRecurring] = useState([])
  const [savingsGoals, setSavingsGoals] = useState([])
  const [shoppingList, setShoppingList] = useState([])
  const [currency, setCurrencyState] = useState('USD')
  const [budgetPeriod, setBudgetPeriodState] = useState('monthly')
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState(null)

  const fetchProfile = useCallback(async () => {
    if (!user?.id) return
    const { data } = await supabase.from('profiles').select('currency, budget_period').eq('id', user.id).single()
    if (data?.currency) setCurrencyState(data.currency)
    if (data?.budget_period && ['weekly', 'monthly', 'yearly'].includes(data.budget_period)) {
      setBudgetPeriodState(data.budget_period)
    }
  }, [user?.id])

  const setCurrency = useCallback(
    async (newCurrency) => {
      if (!user?.id) return
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, currency: newCurrency, updated_at: new Date().toISOString() }, { onConflict: 'id' })
      if (error) throw new Error(error.message)
      setCurrencyState(newCurrency)
    },
    [user?.id]
  )

  const setBudgetPeriod = useCallback(
    async (period) => {
      if (!user?.id) return
      if (!['weekly', 'monthly', 'yearly'].includes(period)) return
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, budget_period: period, updated_at: new Date().toISOString() }, { onConflict: 'id' })
      if (error) throw new Error(error.message)
      setBudgetPeriodState(period)
    },
    [user?.id]
  )

  const formatCurrency = useCallback(
    (amount) => formatCurrencyUtil(amount, currency),
    [currency]
  )

  const fetchExpenses = useCallback(async () => {
    if (!user?.id) return
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })
    if (error) {
      setDataError(error.message)
      return
    }
    setExpenses((data ?? []).map(mapTransaction))
  }, [user?.id])

  const fetchBudgets = useCallback(async () => {
    if (!user?.id) return
    const { data, error } = await supabase
      .from('budgets')
      .select('category, amount')
    if (error) {
      setDataError(error.message)
      return
    }
    const map = {}
    ;(data ?? []).forEach((row) => {
      map[row.category] = parseFloat(row.amount) ?? 0
    })
    setBudgets(map)
  }, [user?.id])

  const fetchCategories = useCallback(async () => {
    if (!user?.id) return []
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, color, sort_order')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
    if (error) {
      setDataError(error.message)
      setCategoriesState([])
      return []
    }
    const list = (data ?? []).map((row) => ({
      id: row.id,
      name: row.name ?? '',
      color: row.color ?? null,
      sortOrder: row.sort_order ?? 0,
    }))
    setCategoriesState(list)
    return list
  }, [user?.id])

  const fetchRecurring = useCallback(async () => {
    if (!user?.id) return
    const { data, error } = await supabase
      .from('recurring_transactions')
      .select('*')
      .order('next_date', { ascending: true })
    if (error) {
      setDataError(error.message)
      setRecurring([])
      return
    }
    setRecurring((data ?? []).map(mapRecurring))
  }, [user?.id])

  const fetchSavingsGoals = useCallback(async () => {
    if (!user?.id) return
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
    if (error) {
      setDataError(error.message)
      setSavingsGoals([])
      return
    }
    setSavingsGoals((data ?? []).map(mapGoal))
  }, [user?.id])

  const fetchShoppingList = useCallback(async () => {
    if (!user?.id) return
    const { data, error } = await supabase
      .from('shopping_list')
      .select('*')
      .order('completed', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })
    if (error) {
      setDataError(error.message)
      setShoppingList([])
      return
    }
    setShoppingList((data ?? []).map(mapShoppingItem))
  }, [user?.id])

  const ensureDefaultCategories = useCallback(async () => {
    if (!user?.id) return
    try {
      const { data } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
      if (data && data.length > 0) return
      const { error } = await supabase.from('categories').insert(
        DEFAULT_CATEGORY_NAMES.map((name, i) => ({
          user_id: user.id,
          name,
          sort_order: i,
        }))
      )
      if (error) throw error
      await fetchCategories()
    } catch (err) {
      setDataError(err?.message ?? 'Failed to create default categories')
      setCategoriesState([])
    }
  }, [user?.id, fetchCategories])

  const addCategory = async (name, color = null) => {
    if (!user?.id) return null
    const trimmed = String(name).trim()
    if (!trimmed) throw new Error('Category name is required')
    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: user.id,
        name: trimmed,
        color: color || null,
        sort_order: categories.length,
      })
      .select('id, name, color, sort_order')
      .single()
    if (error) throw new Error(error.message)
    const newCat = { id: data.id, name: data.name, color: data.color, sortOrder: data.sort_order ?? 0 }
    setCategoriesState((prev) => [...prev, newCat])
    return newCat
  }

  const updateCategory = async (id, updates) => {
    if (!user?.id) return
    const cat = categories.find((c) => c.id === id)
    if (!cat) throw new Error('Category not found')
    const newName = updates.name !== undefined ? String(updates.name).trim() : cat.name
    if (!newName) throw new Error('Category name is required')
    const { error } = await supabase
      .from('categories')
      .update({
        ...(updates.name !== undefined && { name: newName }),
        ...(updates.color !== undefined && { color: updates.color || null }),
      })
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) throw new Error(error.message)
    if (updates.name !== undefined && cat.name !== newName) {
      await supabase
        .from('expenses')
        .update({ category: newName })
        .eq('user_id', user.id)
        .eq('category', cat.name)
      const oldBudgetAmount = budgets[cat.name]
      await supabase.from('budgets').delete().eq('user_id', user.id).eq('category', cat.name)
      if (oldBudgetAmount != null && oldBudgetAmount > 0) {
        await supabase.from('budgets').upsert(
          {
            user_id: user.id,
            category: newName,
            amount: oldBudgetAmount,
            updated_at: new Date().toISOString(),
          },
          { onConflict: ['user_id', 'category'] }
        )
      }
      setBudgets((prev) => {
        const next = { ...prev }
        delete next[cat.name]
        if (oldBudgetAmount != null) next[newName] = oldBudgetAmount
        return next
      })
      setExpenses((prev) =>
        prev.map((e) => (e.category === cat.name ? { ...e, category: newName } : e))
      )
    }
    setCategoriesState((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: newName, color: updates.color ?? c.color } : c))
    )
  }

  const deleteCategory = async (id) => {
    if (!user?.id) return
    const cat = categories.find((c) => c.id === id)
    if (!cat) throw new Error('Category not found')
    const fallbackName = categories.find((c) => c.id !== id)?.name ?? DEFAULT_CATEGORY_NAMES[0]
    await supabase
      .from('expenses')
      .update({ category: fallbackName })
      .eq('user_id', user.id)
      .eq('category', cat.name)
    await supabase.from('budgets').delete().eq('user_id', user.id).eq('category', cat.name)
    const { error } = await supabase.from('categories').delete().eq('id', id).eq('user_id', user.id)
    if (error) throw new Error(error.message)
    setCategoriesState((prev) => prev.filter((c) => c.id !== id))
    setBudgets((prev) => {
      const next = { ...prev }
      delete next[cat.name]
      return next
    })
    setExpenses((prev) =>
      prev.map((e) => (e.category === cat.name ? { ...e, category: fallbackName } : e))
    )
  }

  const categoryNames = useMemo(
    () => (Array.isArray(categories) ? categories.map((c) => c.name) : []),
    [categories]
  )

  useEffect(() => {
    if (!user?.id) {
      setExpenses([])
      setBudgets({})
      setCategoriesState([])
      setRecurring([])
      setSavingsGoals([])
      setShoppingList([])
      setCurrencyState('USD')
      setBudgetPeriodState('monthly')
      setDataLoading(false)
      setDataError(null)
      return
    }
    setDataLoading(true)
    setDataError(null)
    Promise.all([
      fetchProfile(),
      fetchExpenses(),
      fetchBudgets(),
      fetchRecurring(),
      fetchSavingsGoals(),
      fetchShoppingList(),
      fetchCategories().then((list) => {
        if (Array.isArray(list) && list.length === 0) return ensureDefaultCategories()
      }),
    ])
      .catch((err) => {
        setDataError(err?.message ?? 'Failed to load data')
      })
      .finally(() => setDataLoading(false))
  }, [user?.id, fetchProfile, fetchExpenses, fetchBudgets, fetchRecurring, fetchSavingsGoals, fetchShoppingList, fetchCategories, ensureDefaultCategories])

  const addExpense = async (expense) => {
    if (!user?.id) return null
    const payload = {
      user_id: user.id,
      type: 'expense',
      title: expense.title ?? '',
      amount: parseFloat(expense.amount) ?? 0,
      category: expense.category ?? 'Others',
      date: expense.date,
      note: expense.note ?? '',
    }
    if (expense.recurringTransactionId) {
      payload.recurring_transaction_id = expense.recurringTransactionId
    }
    const { data, error } = await supabase
      .from('expenses')
      .insert(payload)
      .select('*')
      .single()
    if (error) throw new Error(error.message)
    const newRow = mapTransaction(data)
    setExpenses((prev) => [newRow, ...prev])
    return newRow
  }

  const addIncome = async (income) => {
    if (!user?.id) return null
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id: user.id,
        type: 'income',
        title: income.title ?? '',
        amount: parseFloat(income.amount) ?? 0,
        category: income.category ?? 'Others',
        date: income.date,
        note: income.note ?? '',
      })
      .select('*')
      .single()
    if (error) throw new Error(error.message)
    const newRow = mapTransaction(data)
    setExpenses((prev) => [newRow, ...prev])
    return newRow
  }

  const updateExpense = async (id, updates) => {
    if (!user?.id) return
    const payload = {
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.amount !== undefined && { amount: parseFloat(updates.amount) }),
      ...(updates.category !== undefined && { category: updates.category }),
      ...(updates.date !== undefined && { date: updates.date }),
      ...(updates.note !== undefined && { note: updates.note }),
      ...(updates.type !== undefined && { type: updates.type }),
      ...(updates.recurringTransactionId !== undefined && { recurring_transaction_id: updates.recurringTransactionId || null }),
    }
    const { error } = await supabase
      .from('expenses')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) throw new Error(error.message)
    setExpenses((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, ...updates } : exp))
    )
  }

  const deleteExpense = async (id) => {
    if (!user?.id) return
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) throw new Error(error.message)
    setExpenses((prev) => prev.filter((exp) => exp.id !== id))
  }

  const setBudget = async (category, amount) => {
    if (!user?.id) return
    const num = parseFloat(amount) ?? 0
    const { error } = await supabase.from('budgets').upsert(
      {
        user_id: user.id,
        category,
        amount: num,
        updated_at: new Date().toISOString(),
      },
      { onConflict: ['user_id', 'category'] }
    )
    if (error) throw new Error(error.message)
    setBudgets((prev) => ({ ...prev, [category]: num }))
  }

  const deleteBudget = async (category) => {
    if (!user?.id) return
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('user_id', user.id)
      .eq('category', category)
    if (error) throw new Error(error.message)
    setBudgets((prev) => {
      const next = { ...prev }
      delete next[category]
      return next
    })
  }

  const addRecurring = async (item) => {
    if (!user?.id) return null
    const { data, error } = await supabase
      .from('recurring_transactions')
      .insert({
        user_id: user.id,
        title: item.title ?? '',
        amount: parseFloat(item.amount) ?? 0,
        category: item.category ?? 'Others',
        type: item.type === 'income' ? 'income' : 'expense',
        frequency: item.frequency ?? 'monthly',
        next_date: item.nextDate,
        note: item.note ?? '',
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single()
    if (error) throw new Error(error.message)
    const newRow = mapRecurring(data)
    setRecurring((prev) => [...prev, newRow].sort((a, b) => (a.nextDate > b.nextDate ? 1 : -1)))
    return newRow
  }

  const updateRecurring = async (id, updates) => {
    if (!user?.id) return
    const payload = {
      updated_at: new Date().toISOString(),
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.amount !== undefined && { amount: parseFloat(updates.amount) }),
      ...(updates.category !== undefined && { category: updates.category }),
      ...(updates.type !== undefined && { type: updates.type }),
      ...(updates.frequency !== undefined && { frequency: updates.frequency }),
      ...(updates.nextDate !== undefined && { next_date: updates.nextDate }),
      ...(updates.note !== undefined && { note: updates.note }),
    }
    const { error } = await supabase
      .from('recurring_transactions')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) throw new Error(error.message)
    setRecurring((prev) =>
      prev
        .map((r) => (r.id === id ? { ...r, ...updates, nextDate: updates.nextDate ?? r.nextDate } : r))
        .sort((a, b) => (a.nextDate > b.nextDate ? 1 : -1))
    )
  }

  const deleteRecurring = async (id) => {
    if (!user?.id) return
    const { error } = await supabase
      .from('recurring_transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) throw new Error(error.message)
    setRecurring((prev) => prev.filter((r) => r.id !== id))
  }

  const createTransactionFromRecurring = async (recurringId) => {
    if (!user?.id) return null
    const item = recurring.find((r) => r.id === recurringId)
    if (!item) throw new Error('Recurring item not found')
    const today = new Date().toISOString().slice(0, 10)
    const transaction = {
      title: item.title,
      amount: item.amount,
      category: item.category,
      date: today,
      note: item.note ? `Upcoming: ${item.note}` : '',
    }
    if (item.type === 'income') {
      await addIncome(transaction)
    } else {
      await addExpense({ ...transaction, recurringTransactionId: recurringId })
    }
    const next = new Date(item.nextDate)
    const nextDate =
      item.frequency === 'weekly'
        ? addWeeks(next, 1)
        : item.frequency === 'yearly'
          ? addYears(next, 1)
          : addMonths(next, 1)
    await updateRecurring(recurringId, { nextDate: nextDate.toISOString().slice(0, 10) })
    return null
  }

  /** Find an upcoming (recurring) expense due in the same period as the given date, with same amount and category, that is not yet paid. Used to prompt: "Are you recording this for [title]?" */
  const findMatchingUpcomingForExpense = useCallback(
    (amount, category, dateStr) => {
      const amountNum = parseFloat(amount)
      if (!Number.isFinite(amountNum) || !category) return null
      const list = Array.isArray(recurring) ? recurring : []
      const { start, end } = getPeriodRange(budgetPeriod, dateStr ? new Date(dateStr) : new Date())
      const periodStartStr = format(start, 'yyyy-MM-dd')
      const periodEndStr = format(end, 'yyyy-MM-dd')
      const periodExpenses = expenses.filter((e) => {
        if (e.type !== 'expense') return false
        const d = e.date ? (typeof e.date === 'string' ? e.date : format(new Date(e.date), 'yyyy-MM-dd')) : ''
        return d >= periodStartStr && d <= periodEndStr
      })
      for (const r of list) {
        if (r.type === 'income') continue
        const rAmount = parseFloat(r.amount) || 0
        const rCat = (r.category || '').trim()
        if (rAmount !== amountNum || (r.category || '').trim() !== (category || '').trim()) continue
        const nextStr = r.nextDate ? (typeof r.nextDate === 'string' ? r.nextDate : format(new Date(r.nextDate), 'yyyy-MM-dd')) : ''
        if (!nextStr || nextStr < periodStartStr || nextStr > periodEndStr) continue
        const alreadyPaid = periodExpenses.some(
          (exp) =>
            exp.recurringTransactionId === r.id ||
            (parseFloat(exp.amount) === rAmount && (exp.title || '').trim() === (r.title || '').trim())
        )
        if (!alreadyPaid) return { id: r.id, title: (r.title || '').trim() || 'Upcoming expense' }
      }
      return null
    },
    [recurring, expenses, budgetPeriod]
  )

  const addSavingsGoal = async (goal) => {
    if (!user?.id) return null
    const targetAmount = parseFloat(goal.targetAmount) ?? 0
    if (targetAmount <= 0) throw new Error('Target amount must be greater than 0')
    const { data, error } = await supabase
      .from('savings_goals')
      .insert({
        user_id: user.id,
        title: (goal.title ?? '').trim(),
        target_amount: targetAmount,
        target_date: goal.targetDate || null,
        current_amount: parseFloat(goal.currentAmount) ?? 0,
        sort_order: savingsGoals.length,
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single()
    if (error) throw new Error(error.message)
    const newRow = mapGoal(data)
    setSavingsGoals((prev) => [...prev, newRow])
    return newRow
  }

  const updateSavingsGoal = async (id, updates) => {
    if (!user?.id) return
    const payload = {
      updated_at: new Date().toISOString(),
      ...(updates.title !== undefined && { title: String(updates.title).trim() }),
      ...(updates.targetAmount !== undefined && { target_amount: parseFloat(updates.targetAmount) }),
      ...(updates.targetDate !== undefined && { target_date: updates.targetDate || null }),
      ...(updates.currentAmount !== undefined && { current_amount: parseFloat(updates.currentAmount) }),
      ...(updates.sortOrder !== undefined && { sort_order: updates.sortOrder }),
    }
    const { error } = await supabase
      .from('savings_goals')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) throw new Error(error.message)
    setSavingsGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updates } : g))
    )
  }

  const deleteSavingsGoal = async (id) => {
    if (!user?.id) return
    const { error } = await supabase
      .from('savings_goals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) throw new Error(error.message)
    setSavingsGoals((prev) => prev.filter((g) => g.id !== id))
  }

  const addShoppingItem = async (item) => {
    if (!user?.id) return null
    const title = (item.title ?? '').trim()
    if (!title) throw new Error('Item name is required')
    const { data, error } = await supabase
      .from('shopping_list')
      .insert({
        user_id: user.id,
        title,
        completed: false,
        due_date: item.dueDate || null,
        sort_order: shoppingList.length,
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single()
    if (error) throw new Error(error.message)
    const newRow = mapShoppingItem(data)
    setShoppingList((prev) => [newRow, ...prev])
    return newRow
  }

  const updateShoppingItem = async (id, updates) => {
    if (!user?.id) return
    const payload = {
      updated_at: new Date().toISOString(),
      ...(updates.title !== undefined && { title: String(updates.title).trim() }),
      ...(updates.completed !== undefined && {
        completed: !!updates.completed,
        completed_at: updates.completed ? new Date().toISOString() : null,
      }),
      ...(updates.dueDate !== undefined && { due_date: updates.dueDate || null }),
    }
    const { error } = await supabase
      .from('shopping_list')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) throw new Error(error.message)
    setShoppingList((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i
        const next = { ...i, ...updates }
        if (updates.completed === true) next.completedAt = new Date().toISOString()
        if (updates.completed === false) next.completedAt = null
        return next
      })
    )
  }

  const deleteShoppingItem = async (id) => {
    if (!user?.id) return
    const { error } = await supabase
      .from('shopping_list')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) throw new Error(error.message)
    setShoppingList((prev) => prev.filter((i) => i.id !== id))
  }

  const clearCompletedShoppingItems = async () => {
    if (!user?.id) return
    const { error } = await supabase
      .from('shopping_list')
      .delete()
      .eq('user_id', user.id)
      .eq('completed', true)
    if (error) throw new Error(error.message)
    setShoppingList((prev) => prev.filter((i) => !i.completed))
  }

  return (
    <DataContext.Provider
      value={{
        expenses,
        budgets,
        categories,
        categoryNames,
        addCategory,
        updateCategory,
        deleteCategory,
        currency,
        currencies: CURRENCIES,
        setCurrency,
        formatCurrency,
        budgetPeriod,
        budgetPeriods: PERIODS,
        setBudgetPeriod,
        addExpense,
        addIncome,
        updateExpense,
        deleteExpense,
        setBudget,
        deleteBudget,
        dataLoading,
        dataError,
        recurring,
        addRecurring,
        updateRecurring,
        deleteRecurring,
        createTransactionFromRecurring,
        findMatchingUpcomingForExpense,
        savingsGoals,
        addSavingsGoal,
        updateSavingsGoal,
        deleteSavingsGoal,
        refetchExpenses: fetchExpenses,
        refetchBudgets: fetchBudgets,
        refetchRecurring: fetchRecurring,
        refetchSavingsGoals: fetchSavingsGoals,
        shoppingList,
        addShoppingItem,
        updateShoppingItem,
        deleteShoppingItem,
        clearCompletedShoppingItems,
        refetchShoppingList: fetchShoppingList,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}
