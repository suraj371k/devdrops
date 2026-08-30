import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import Card from '../common/Card'
import Button from '../common/Button'
import Modal from '../common/Modal'

const TYPE_ICONS = {
  code: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  command: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  link: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  note: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
}

const TYPE_COLORS = {
  code: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  command: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  link: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  note: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
}

const LANGUAGE_COLORS = {
  javascript: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  typescript: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  python: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  java: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  go: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  rust: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  html: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  css: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  sql: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  bash: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  dockerfile: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
}

const DropCard = ({ 
  drop, 
  onRecall, 
  onToggleFavorite, 
  onEdit, 
  onDelete, 
  onView,
  isOwner = true,
  selectable = false,
  selected = false,
  onToggleSelect,
}) => {
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()

  const handleCardClick = () => {
    if (selectable) {
      onToggleSelect?.(drop._id)
    } else {
      onView?.(drop)
    }
  }

  const handleRecall = (e) => {
    e.stopPropagation()
    onRecall?.(drop._id)
  }

  const handleFavorite = (e) => {
    e.stopPropagation()
    onToggleFavorite?.(drop._id)
  }

  const handleEdit = (e) => {
    e.stopPropagation()
    onEdit?.(drop)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    onDelete?.(drop._id)
  }

  const preview = drop.content.length > 120 ? drop.content.slice(0, 120) + '...' : drop.content

  return (
    <Card hover padding="md" className={`group relative ${selectable && selected ? "ring-2 ring-primary-500" : ""}`} onClick={handleCardClick}>
      {selectable && (
        <div className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect?.(drop._id)}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            aria-label={`Select ${drop.title}`}
          />
        </div>
      )}
      <div className="flex items-start gap-3">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[drop.type]}`}>
          {TYPE_ICONS[drop.type]}
          {drop.type.charAt(0).toUpperCase() + drop.type.slice(1)}
        </span>
        {drop.language && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${LANGUAGE_COLORS[drop.language] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
            {drop.language}
          </span>
        )}
        <span className="ml-auto flex items-center gap-1.5">
          {isOwner && (
            <button
              onClick={handleFavorite}
              className={`p-1.5 rounded-lg transition-colors ${drop.isFavorite ? 'text-yellow-500' : 'text-slate-400 hover:text-yellow-500'}`}
              aria-label={drop.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg className={`w-5 h-5 ${drop.isFavorite ? 'fill-current' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          )}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="More options"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            {showModal && (
              <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="sm" showClose={false}>
                <div className="space-y-1">
                  {isOwner && (
                    <>
                      <button onClick={() => { handleEdit(); setShowModal(false); }} className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                        Edit
                      </button>
                      <button onClick={() => { handleDelete(); setShowModal(false); }} className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                        Delete
                      </button>
                    </>
                  )}
                  <button onClick={() => { setShowModal(false); navigate(`/drops/${drop._id}`); }} className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                    View Details
                  </button>
                </div>
              </Modal>
            )}
          </div>
        </span>
      </div>
      <h3 className="mt-3 font-medium text-slate-900 dark:text-slate-100 line-clamp-1">{drop.title}</h3>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 line-clamp-2 font-mono text-xs">
        {preview}
      </p>
      {drop.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {drop.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="px-2 py-0.5 text-xs rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              {tag}
            </span>
          ))}
          {drop.tags.length > 4 && (
            <span className="px-2 py-0.5 text-xs rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
              +{drop.tags.length - 4}
            </span>
          )}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
        <span>🔁 {drop.recallCount}</span>
        <span>📅 {formatDistanceToNow(new Date(drop.nextRecallDate), { addSuffix: true })}</span>
        {isOwner && (
          <Button variant="ghost" size="sm" onClick={handleRecall}>
            Recall
          </Button>
        )}
      </div>
    </Card>
  )
}

export default DropCard