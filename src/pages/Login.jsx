import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Chrome } from 'lucide-react'

export default function Login() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      navigate('/')
    } catch (err) {
      setError(err.message ?? 'Sign in failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-50 dark:bg-primary-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-primary-800 rounded-2xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-primary-900 dark:text-white mb-2">
            Welcome
          </h1>
          <p className="text-primary-600 dark:text-primary-400 mb-8">
            Sign in with Google to manage your expenses
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-primary-700 border-2 border-primary-300 dark:border-primary-600 text-primary-900 dark:text-white rounded-lg font-medium hover:bg-primary-50 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Chrome className="w-5 h-5" aria-hidden />
            {loading ? 'Signing in…' : 'Continue with Google'}
          </button>
        </div>
      </div>
    </div>
  )
}
