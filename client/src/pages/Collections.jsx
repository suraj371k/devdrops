import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  useGetCollectionsQuery,
  useDeleteCollectionMutation,
  useGenerateShareTokenMutation,
} from '../store/api'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'
import CollectionFormModal from '../components/collections/CollectionFormModal'

const Collections = () => {
  const navigate = useNavigate()
  const { data, isLoading } = useGetCollectionsQuery()
  const [deleteCollection] = useDeleteCollectionMutation()
  const [generateShareToken, { isLoading: sharing }] = useGenerateShareTokenMutation()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCollection, setEditingCollection] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)

  const collections = data?.collections || []

  const openCreate = () => {
    setEditingCollection(null)
    setModalOpen(true)
  }

  const openEdit = (collection) => {
    setEditingCollection(collection)
    setOpenMenuId(null)
    setModalOpen(true)
  }

  const handleDelete = async (collection) => {
    setOpenMenuId(null)
    if (!window.confirm(`Delete "${collection.name}"? The drops inside will not be deleted.`)) return
    try {
      await deleteCollection(collection._id).unwrap()
      toast.success('Collection deleted')
    } catch {
      toast.error('Failed to delete collection')
    }
  }

  const handleShare = async (collection) => {
    setOpenMenuId(null)
    try {
      const result = await generateShareToken(collection._id).unwrap()
      await navigator.clipboard.writeText(result.shareUrl)
      toast.success('Share link copied to clipboard')
    } catch {
      toast.error('Failed to generate share link')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Collections</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Group related drops together and share them with a link.
          </p>
        </div>
        <Button onClick={openCreate}>+ New Collection</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : collections.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <Card
              key={collection._id}
              hover
              padding="md"
              onClick={() => navigate(`/collections/${collection._id}`)}
              className="relative"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: collection.color }}
                  />
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {collection.name}
                  </h3>
                </div>
                <div className="relative shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenMenuId(openMenuId === collection._id ? null : collection._id)
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    aria-label="Collection options"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                  {openMenuId === collection._id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-9 z-10 w-40 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg"
                    >
                      <button
                        onClick={() => openEdit(collection)}
                        className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        Rename / Edit
                      </button>
                      <button
                        onClick={() => handleShare(collection)}
                        disabled={sharing}
                        className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        {collection.isShared ? 'Copy share link' : 'Share'}
                      </button>
                      <button
                        onClick={() => handleDelete(collection)}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {collection.description && (
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                  {collection.description}
                </p>
              )}

              <div className="mt-4 flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                <span>📦 {collection.dropCount ?? 0} drop{collection.dropCount === 1 ? '' : 's'}</span>
                {collection.isShared && (
                  <span className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400">
                    🔗 Shared
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🗂️</div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">No collections yet</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Create one to start grouping related drops together.
          </p>
          <Button className="mt-6" onClick={openCreate}>Create your first collection</Button>
        </div>
      )}

      <CollectionFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        collection={editingCollection}
      />
    </div>
  )
}

export default Collections
