import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useGetRecallDropsQuery, useMarkRecalledMutation } from '../store/api'
import { useRecallQueue } from '../hooks/useRecallQueue'
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { parseMarkdown } from '../utils/markdownParser'
import { highlightCode } from '../utils/syntaxHighlight'

const CONFIDENCE_LEVELS = [
  { value: 1, label: 'Forgot', color: 'danger' },
  { value: 2, label: 'Hard', color: 'outline' },
  { value: 3, label: 'Good', color: 'secondary' },
  { value: 4, label: 'Easy', color: 'success' },
  { value: 5, label: 'Perfect', color: 'primary' },
]

const RecallMode = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading } = useGetRecallDropsQuery({ limit: 20 })
  const [markRecalled] = useMarkRecalledMutation()

  const drops = data?.drops || []
  const queue = useRecallQueue(drops)
  const { currentDrop, isRevealed, progress, isComplete, reveal, recall, skip, completed } = queue

  useEffect(() => {
    if (drops.length) queue.setQueue(drops)
  }, [data])

  const handleConfidence = async (confidence) => {
    if (!currentDrop) return
    try {
      await markRecalled({ id: currentDrop._id, recallType: 'active', confidence }).unwrap()
    } catch {
      toast.error('Failed to save recall result')
    }
    recall(confidence)
  }

  useKeyboardShortcut(' ', () => {
    if (currentDrop && !isRevealed) reveal()
  }, { preventDefault: true })

  useKeyboardShortcut('r', () => {
    if (currentDrop && isRevealed) handleConfidence(4)
  })

  useKeyboardShortcut('n', () => {
    if (currentDrop && isRevealed) handleConfidence(1)
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" text="Loading recall queue..." />
      </div>
    )
  }

  if (!drops.length) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Nothing due for recall</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">You're all caught up. Check back later.</p>
        <Button className="mt-6" onClick={() => navigate('/')}>Back to Dashboard</Button>
      </div>
    )
  }

  if (isComplete) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Session complete!</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          You reviewed {completed.length} drop{completed.length !== 1 ? 's' : ''}.
        </p>
        <Button className="mt-6" onClick={() => navigate('/')}>Back to Dashboard</Button>
      </div>
    )
  }

  const isCode = currentDrop.type === 'code'

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400 mb-1.5">
          <span>Recall Session</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div className="h-full bg-primary-600 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <Card padding="lg" className="min-h-[320px] flex flex-col">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{currentDrop.type}</span>
        <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{currentDrop.title}</h3>

        {isRevealed ? (
          isCode ? (
            <pre className="mt-4 flex-1 font-mono text-sm bg-slate-50 dark:bg-slate-900 rounded-lg p-4 overflow-auto">
              <code
                className={`language-${currentDrop.language || 'plaintext'}`}
                dangerouslySetInnerHTML={{ __html: highlightCode(currentDrop.content, currentDrop.language) }}
              />
            </pre>
          ) : (
            <div
              className="mt-4 flex-1 markdown-content overflow-auto"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(currentDrop.content) }}
            />
          )
        ) : (
          <div className="mt-4 flex-1 flex items-center justify-center">
            <Button onClick={reveal}>Reveal Answer</Button>
          </div>
        )}

        {isRevealed && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-2">
            {CONFIDENCE_LEVELS.map((level) => (
              <Button key={level.value} variant={level.color} onClick={() => handleConfidence(level.value)}>
                {level.label}
              </Button>
            ))}
          </div>
        )}
      </Card>

      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-400">
        <Button variant="ghost" size="sm" onClick={skip}>Skip this one</Button>
        <span>Space reveal &middot; R remembered &middot; N need review</span>
      </div>
    </div>
  )
}

export default RecallMode
