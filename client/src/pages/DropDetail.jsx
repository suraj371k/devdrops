import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { format, formatDistanceToNow } from 'date-fns'
import {
  useGetDropQuery,
  useGetRelatedDropsQuery,
  useDeleteDropMutation,
  useToggleFavoriteMutation,
  useMarkRecalledMutation,
  useGetCollectionsQuery,
  useAddDropToCollectionMutation,
} from '../store/api'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'
import DropFormModal from '../components/drops/DropFormModal'
import DropCard from '../components/drops/DropCard'
import { parseMarkdown } from '../utils/markdownParser'
import { highlightCode } from '../utils/syntaxHighlight'

const CONFIDENCE_LEVELS = [
  { value: 1, label: 'Forgot', variant: 'danger' },
  { value: 2, label: 'Hard', variant: 'outline' },
  { value: 3, label: 'Good', variant: 'secondary' },
  { value: 4, label: 'Easy', variant: 'success' },
  { value: 5, label: 'Perfect', variant: 'primary' },
]

const DropDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)
  const [collectionMenuOpen, setCollectionMenuOpen] = useState(false)

  const { data, isLoading, isError } = useGetDropQuery(id)
  const drop = data?.drop

  const { data: relatedData } = useGetRelatedDropsQuery(id)
  const relatedDrops = relatedData?.relatedDrops || []

  const { data: collectionsData } = useGetCollectionsQuery(undefined, { skip: !collectionMenuOpen })
  const [addDropToCollection, { isLoading: addingToCollection }] = useAddDropToCollectionMutation()

  const [deleteDrop, { isLoading: deleting }] = useDeleteDropMutation()
  const [toggleFavorite] = useToggleFavoriteMutation()
  const [markRecalled, { isLoading: recalling }] = useMarkRecalledMutation()

  const handleDelete = async () => {
    if (!window.confirm('Delete this drop? This cannot be undone.')) return
    try {
      await deleteDrop(id).unwrap()
      toast.success('Drop deleted')
      navigate('/my-drops')
    } catch {
      toast.error('Failed to delete drop')
    }
  }

  const handleFavorite = async () => {
    try {
      await toggleFavorite(id).unwrap()
    } catch {
      toast.error('Failed to update favorite')
    }
  }

  const handleConfidence = async (confidence) => {
    try {
      await markRecalled({ id, recallType: 'manual', confidence }).unwrap()
      toast.success('Marked as recalled')
    } catch {
      toast.error('Failed to save recall result')
    }
  }

  const handleAddToCollection = async (collectionId) => {
    try {
      await addDropToCollection({ collectionId, dropId: id }).unwrap()
      toast.success('Added to collection')
    } catch (err) {
      toast.error(err?.data?.error || 'Failed to add to collection')
    } finally {
      setCollectionMenuOpen(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" text="Loading drop..." />
      </div>
    )
  }

  if (isError || !drop) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="text-5xl mb-4">🤔</div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Drop not found</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          It may have been deleted, or you don't have access to it.
        </p>
        <Button className="mt-6" onClick={() => navigate('/my-drops')}>Back to My Drops</Button>
      </div>
    )
  }

  const isLink = drop.type === 'link'
  const isCode = drop.type === 'code'
  const isSafeUrl = isLink && /^https?:\/\//i.test(drop.content)
  const collections = collectionsData?.collections || []

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/my-drops')}
        className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1"
      >
        ← Back to My Drops
      </button>

      <Card padding="lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{drop.type}</span>
              {drop.language && (
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {drop.language}
                </span>
              )}
            </div>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{drop.title}</h1>
          </div>
          <button
            onClick={handleFavorite}
            className={`p-2 rounded-lg shrink-0 transition-colors ${drop.isFavorite ? 'text-yellow-500' : 'text-slate-400 hover:text-yellow-500'}`}
            aria-label={drop.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <svg className={`w-6 h-6 ${drop.isFavorite ? 'fill-current' : ''}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        </div>

        <div className="mt-5">
          {isLink ? (
            isSafeUrl ? (
              <a
                href={drop.content}
                target="_blank"
                rel="noopener noreferrer"
                className="block break-all text-primary-600 dark:text-primary-400 hover:underline font-mono text-sm bg-slate-50 dark:bg-slate-900 rounded-lg p-4"
              >
                {drop.content}
              </a>
            ) : (
              <p className="break-all font-mono text-sm bg-slate-50 dark:bg-slate-900 rounded-lg p-4 text-slate-700 dark:text-slate-300">
                {drop.content}
              </p>
            )
          ) : isCode ? (
            <pre className="font-mono text-sm bg-slate-50 dark:bg-slate-900 rounded-lg p-4 overflow-auto">
              <code
                className={`language-${drop.language || 'plaintext'}`}
                dangerouslySetInnerHTML={{ __html: highlightCode(drop.content, drop.language) }}
              />
            </pre>
          ) : (
            <div
              className="markdown-content"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(drop.content) }}
            />
          )}
        </div>

        {drop.tags?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {drop.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 text-xs rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 dark:text-slate-500">
          <span>🔁 Recalled {drop.recallCount} time{drop.recallCount === 1 ? '' : 's'}</span>
          <span>📅 Next recall {formatDistanceToNow(new Date(drop.nextRecallDate), { addSuffix: true })}</span>
          {drop.createdAt && <span>🕒 Created {format(new Date(drop.createdAt), 'MMM d, yyyy')}</span>}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>Edit</Button>
          <div className="relative">
            <Button variant="outline" onClick={() => setCollectionMenuOpen((open) => !open)}>
              + Add to Collection
            </Button>
            {collectionMenuOpen && (
              <div className="absolute left-0 top-full mt-2 z-10 w-56 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg max-h-64 overflow-y-auto">
                {collections.length ? (
                  collections.map((c) => (
                    <button
                      key={c._id}
                      onClick={() => handleAddToCollection(c._id)}
                      disabled={addingToCollection}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="truncate">{c.name}</span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-4 text-sm text-slate-400 text-center">
                    No collections yet.{' '}
                    <button onClick={() => navigate('/collections')} className="text-primary-600 dark:text-primary-400 hover:underline">
                      Create one
                    </button>
                  </p>
                )}
              </div>
            )}
          </div>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>Delete</Button>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Mark recall confidence</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {CONFIDENCE_LEVELS.map((level) => (
            <Button
              key={level.value}
              variant={level.variant}
              onClick={() => handleConfidence(level.value)}
              disabled={recalling}
            >
              {level.label}
            </Button>
          ))}
        </div>
      </Card>

      {relatedDrops.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">Related Drops</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {relatedDrops.map((rd) => (
              <DropCard
                key={rd._id}
                drop={rd}
                isOwner={false}
                onView={(d) => navigate(`/drops/${d._id}`)}
              />
            ))}
          </div>
        </div>
      )}

      <DropFormModal isOpen={editOpen} onClose={() => setEditOpen(false)} drop={drop} />
    </div>
  )
}

export default DropDetail
