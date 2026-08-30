import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { setCommandPaletteOpen, toggleTheme, openModal } from '../store/slices/uiSlice'
import { logout as logoutAction } from '../store/slices/authSlice'
import { useLogoutMutation } from '../store/api'

const CommandPalette = () => {
  const isOpen = useSelector((state) => state.ui.commandPaletteOpen)
  const user = useSelector((state) => state.auth.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [logoutMutation] = useLogoutMutation()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)

  const close = () => {
    dispatch(setCommandPaletteOpen(false))
    setQuery('')
    setActiveIndex(0)
  }

  const commands = useMemo(() => [
    { id: 'new-drop', label: 'New Drop', keywords: 'create add capture', run: () => dispatch(openModal({ modal: 'createDrop' })) },
    { id: 'dashboard', label: 'Go to Dashboard', keywords: 'home stats', run: () => navigate('/') },
    { id: 'recall', label: 'Start Recall Session', keywords: 'review spaced repetition', run: () => navigate('/recall') },
    { id: 'my-drops', label: 'Go to My Drops', keywords: 'drops list', run: () => navigate('/my-drops') },
    { id: 'explorer', label: 'Go to Explorer', keywords: 'search filter browse', run: () => navigate('/explorer') },
    { id: 'collections', label: 'Go to Collections', keywords: 'folders', run: () => navigate('/collections') },
    { id: 'public-explore', label: 'Go to Public Explore', keywords: 'community shared', run: () => navigate('/explore') },
    { id: 'profile', label: 'Go to Profile', keywords: 'preferences settings account', run: () => navigate('/profile') },
    { id: 'theme', label: 'Toggle Dark / Light Theme', keywords: 'appearance dark mode light mode', run: () => dispatch(toggleTheme()) },
    {
      id: 'logout',
      label: `Log out${user?.username ? ` (${user.username})` : ''}`,
      keywords: 'signout exit',
      run: async () => {
        try {
          await logoutMutation().unwrap()
        } catch {}
        dispatch(logoutAction())
        toast.success('Logged out')
        navigate('/login')
      },
    },
  ], [dispatch, navigate, logoutMutation, user])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) => c.label.toLowerCase().includes(q) || c.keywords.includes(q))
  }, [commands, query])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    if (isOpen) {
      const id = setTimeout(() => inputRef.current?.focus(), 10)
      return () => clearTimeout(id)
    }
  }, [isOpen])

  const runCommand = (command) => {
    if (!command) return
    command.run()
    close()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      runCommand(results[activeIndex])
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-start justify-center pt-24 px-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 border-b border-slate-200 dark:border-slate-700">
              <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command or search..."
                className="w-full bg-transparent py-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
              />
              <kbd className="text-xs text-slate-400 border border-slate-200 dark:border-slate-600 rounded px-1.5 py-0.5">Esc</kbd>
            </div>
            <div className="max-h-80 overflow-y-auto py-2">
              {results.length ? (
                results.map((command, index) => (
                  <button
                    key={command.id}
                    onClick={() => runCommand(command)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`w-full flex items-center px-4 py-2.5 text-sm text-left ${
                      index === activeIndex
                        ? 'bg-primary-600 text-white'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {command.label}
                  </button>
                ))
              ) : (
                <p className="px-4 py-6 text-center text-sm text-slate-400">No matching commands</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default CommandPalette
