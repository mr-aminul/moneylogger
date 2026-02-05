import { useState, useRef, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import FloatingActionButton from '../UI/FloatingActionButton'

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const voiceInputRef = useRef(null)

  useEffect(() => {
    const isInputField = () => {
      const target = document.activeElement
      return target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.getAttribute?.('contenteditable') === 'true'
      )
    }
    const onKeyDown = (e) => {
      if (e.code !== 'Space' || e.repeat) return
      if (isInputField()) return
      e.preventDefault()
      voiceInputRef.current?.startHold?.()
    }
    const onKeyUp = (e) => {
      if (e.code !== 'Space' || e.repeat) return
      if (isInputField()) return
      e.preventDefault()
      voiceInputRef.current?.endHold?.()
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  return (
    <div className="flex h-screen bg-primary-50 dark:bg-primary-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
      <FloatingActionButton ref={voiceInputRef} />
    </div>
  )
}
