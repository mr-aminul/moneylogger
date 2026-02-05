import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Receipt, 
  TrendingUp,
  FolderOpen, 
  Target, 
  Repeat,
  Gift,
  ListChecks,
  BarChart3, 
  Settings,
  X
} from 'lucide-react'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/expenses', label: 'Expenses', icon: Receipt },
  { path: '/income', label: 'Income', icon: TrendingUp },
  { path: '/categories', label: 'Categories', icon: FolderOpen },
  { path: '/budgets', label: 'Budgets', icon: Target },
  { path: '/recurring', label: 'Recurring', icon: Repeat },
  { path: '/wishlist', label: 'Wishlist', icon: Gift },
  { path: '/shopping-list', label: 'Shopping list', icon: ListChecks },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-white dark:bg-primary-800 border-r border-primary-200 dark:border-primary-700 flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-6 border-b border-primary-200 dark:border-primary-700 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary-900 dark:text-white">
            Expense Manager
          </h1>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-700 text-primary-600 dark:text-primary-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-100 dark:bg-primary-700 text-primary-900 dark:text-white font-medium'
                      : 'text-primary-600 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-700/50'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
