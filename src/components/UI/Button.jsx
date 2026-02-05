export default function Button({ children, onClick, icon: Icon, variant = 'primary', className = '' }) {
  const baseClasses = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors'
  
  const variants = {
    primary: 'bg-primary-900 dark:bg-primary-700 text-white hover:bg-primary-800 dark:hover:bg-primary-600',
    outline: 'border border-primary-300 dark:border-primary-600 text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-700',
  }

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  )
}
