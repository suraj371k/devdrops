import { useEffect } from 'react'

export function useKeyboardShortcut(key, callback, options = {}) {
  const { ctrl = false, meta = false, shift = false, alt = false, target = window, preventDefault = true } = options

  useEffect(() => {
    const handler = (event) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modifierKey = isMac ? meta : ctrl

      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        event.ctrlKey === (modifierKey && !isMac) &&
        event.metaKey === (modifierKey && isMac) &&
        event.shiftKey === shift &&
        event.altKey === alt
      ) {
        if (preventDefault) event.preventDefault()
        callback(event)
      }
    }

    target.addEventListener('keydown', handler)
    return () => target.removeEventListener('keydown', handler)
  }, [key, callback, ctrl, meta, shift, alt, target, preventDefault])
}

export function useGlobalKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    const handler = (event) => {
      const isInput = event.target.tagName === 'INPUT' || 
                      event.target.tagName === 'TEXTAREA' || 
                      event.target.isContentEditable
      
      for (const { key, callback, ctrl, meta, shift, alt, preventDefault = true, allowInInput = false } of shortcuts) {
        if (isInput && !allowInInput) continue
        
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
        const modifierKey = isMac ? meta : ctrl
        
        if (
          event.key.toLowerCase() === key.toLowerCase() &&
          event.ctrlKey === (modifierKey && !isMac) &&
          event.metaKey === (modifierKey && isMac) &&
          event.shiftKey === shift &&
          event.altKey === alt
        ) {
          if (preventDefault) event.preventDefault()
          callback(event)
          break
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [shortcuts])
}