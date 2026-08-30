import { useState, useCallback, useEffect } from 'react'

export function useRecallQueue(initialDrops = []) {
  const [queue, setQueue] = useState(initialDrops)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isRevealed, setIsRevealed] = useState(false)
  const [confidence, setConfidence] = useState(null)
  const [completed, setCompleted] = useState([])

  const currentDrop = queue[currentIndex] || null
  const progress = queue.length > 0 ? ((currentIndex + 1) / queue.length) * 100 : 0
  const isComplete = currentIndex >= queue.length

  const reveal = useCallback(() => {
    setIsRevealed(true)
  }, [])

  const recall = useCallback((confidenceValue) => {
    if (!currentDrop) return
    
    setConfidence(confidenceValue)
    setCompleted(prev => [...prev, { ...currentDrop, confidence: confidenceValue }])
    
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
      setIsRevealed(false)
      setConfidence(null)
    }, 300)
  }, [currentDrop])

  const skip = useCallback(() => {
    if (!currentDrop) return
    setCompleted(prev => [...prev, { ...currentDrop, confidence: 0, skipped: true }])
    setCurrentIndex(prev => prev + 1)
    setIsRevealed(false)
  }, [currentDrop])

  const reset = useCallback(() => {
    setQueue(initialDrops)
    setCurrentIndex(0)
    setIsRevealed(false)
    setConfidence(null)
    setCompleted([])
  }, [initialDrops])

  const addDrops = useCallback((newDrops) => {
    setQueue(prev => [...prev, ...newDrops])
  }, [])

  return {
    queue,
    currentDrop,
    currentIndex,
    isRevealed,
    confidence,
    completed,
    progress,
    isComplete,
    reveal,
    recall,
    skip,
    reset,
    addDrops,
    setQueue,
  }
}