import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Moon, Sun, User, LogOut, Calendar, Menu } from 'lucide-react'
import { format } from 'date-fns'

export default function TopBar({ onMenuClick }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains('dark')
  )
  const [selectedDate, setSelectedDate] = useState(new Date())
  const profileMenuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
    }

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileMenu])

  const pageTitles = {
    '/': 'Dashboard',
    '/expenses': 'Expenses',
    '/income': 'Income',
    '/categories': 'Categories',
    '/budgets': 'Budgets',
    '/recurring': 'Recurring',
    '/wishlist': 'Wishlist',
    '/shopping-list': 'Shopping list',
    '/reports': 'Reports',
    '/settings': 'Settings',
  }

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    if (newMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', JSON.stringify(newMode))
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="bg-white dark:bg-primary-800 border-b border-primary-200 dark:border-primary-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-700 text-primary-600 dark:text-primary-300 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="text-xl sm:text-2xl font-semibold text-primary-900 dark:text-white">
            {pageTitles[location.pathname] || 'Dashboard'}
          </h2>
          <div className="hidden sm:flex items-center gap-2 text-primary-600 dark:text-primary-300">
            <Calendar className="w-4 h-4" />
            <input
              type="month"
              value={format(selectedDate, 'yyyy-MM')}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="bg-transparent border-none outline-none text-sm font-medium cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-700 text-primary-600 dark:text-primary-300 transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-700 transition-colors"
              aria-label="Account menu"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-200 dark:ring-primary-600"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-200 dark:bg-primary-700 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-600 dark:text-primary-300" />
                </div>
              )}
              <span className="hidden sm:inline text-sm font-medium text-primary-900 dark:text-white">
                {user?.name || 'User'}
              </span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-primary-800 rounded-lg shadow-lg border border-primary-200 dark:border-primary-700 py-2 z-50">
                <div className="px-4 py-3 border-b border-primary-200 dark:border-primary-700">
                  <p className="text-sm font-medium text-primary-900 dark:text-white truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-primary-500 dark:text-primary-400 truncate">
                    {user?.email || ''}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
