import { useState } from 'react'
import { Plus } from 'lucide-react'
import ExpenseModal from '../ExpenseModal'

export default function FloatingActionButton() {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 sm:w-20 sm:h-20 bg-primary-900 dark:bg-primary-700 text-white rounded-full shadow-2xl hover:shadow-primary-900/50 hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center group"
        aria-label="Add Expense"
      >
        <Plus className="w-8 h-8 sm:w-10 sm:h-10 group-hover:rotate-90 transition-transform duration-200" />
      </button>
      {showModal && (
        <ExpenseModal
          transaction={null}
          type="expense"
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
