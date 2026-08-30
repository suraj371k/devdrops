import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  useGetCollectionQuery,
  useGetDropsQuery,
  useAddDropToCollectionMutation,
  useRemoveDropFromCollectionMutation,
  useDeleteCollectionMutation,
  useGenerateShareTokenMutation,
} from '../store/api'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import Input from '../components/common/Input'
import LoadingSpinner from '../components/common/LoadingSpinner'
import DropCard from '../components/drops/DropCard'
import CollectionFormModal from '../components/collections/CollectionFormModal'
import { useDebounce } from '../hooks/useDebounce'

const CollectionView = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, isError } = useGetCollectionQuery(id)
  const [addDropModalOpen, setAddDropModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)

  const [addDropToCollection, { isLoading: adding }] = useAddDropToCollectionMutation()
  const [removeDropFromCollection] = useRemoveDropFromCollectionMutation()
  const [deleteCollection, { isLoading: deleting }] = useDeleteCollectionMutation()
  const [generateShareToken, { isLoading: sharing }] = useGenerateShareTokenMutation()

  const { data: allDropsData, isLoading: loadingAllDrops } = useGetDropsQuery(
    { search: debouncedSearch, limit: 20 },
    { skip: !addDropModalOpen }
  )

  const collection = data?.collection

  const handleRemoveDrop = async (dropId) => {
    try {
      await removeDropFromCollection({ collectionId: id, dropId }).unwrap()
      toast.success('Drop removed from collection')
    } catch {
      toast.error('Failed to remove drop')
    }
  }

  const handleAddDrop = async (dropId) => {
    try {
      await addDropToCollection({ collectionId: id, dropId }).unwrap()
      toast.success('Drop added to collection')
    } catch (err) {
      toast.error(err?.data?.error || 'Failed to add drop')
    }
  }

  const handleDeleteCollection = async () => {
    if (!window.confirm(`Delete "${collection.name}"? The drops inside will not be deleted.`)) return
    try {
      await deleteCollection(id).unwrap()
      toast.success('Collection deleted')
      navigate('/collections')
    } catch {
      toast.error('Failed to delete collection')
    }
  }

  const handleShare = async () => {
    try {
      const result = await generateShareToken(id).unwrap()
      await navigator.clipboard.writeText(result.shareUrl)
      toast.success('Share link copied to clipboard')
    } catch {
      toast.error('Failed to generate share link')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" text="Loading collection..." />
      </div>
    )
  }

  if (isError || !collection) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="text-5xl mb-4">🤔</div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Collection not found</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          It may have been deleted, or you don't have access to it.
        </p>
        <Button className="mt-6" onClick={() => navigate('/collections')}>Back to Collections</Button>
      </div>
    )
  }

  const existingDropIds = new Set((collection.drops || []).map((d) => d._id))
  const addableDrops = (allDropsData?.drops || []).filter((d) => !existingDropIds.has(d._id))

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/collections')}
        className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1"
      >
        ← Back to Collections
      </button>

      <Card padding="lg">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: collection.color }} />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{collection.name}</h1>
              {collection.description && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{collection.description}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setAddDropModalOpen(true)}>+ Add Drop</Button>
            <Button variant="outline" onClick={handleShare} loading={sharing}>
              {collection.isShared ? 'Copy Share Link' : 'Share'}
            </Button>
            <Button variant="outline" onClick={() => setEditModalOpen(true)}>Edit</Button>
            <Button variant="danger" onClick={handleDeleteCollection} loading={deleting}>Delete</Button>
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
          📦 {collection.dropCount ?? collection.drops?.length ?? 0} drop{(collection.dropCount ?? 0) === 1 ? '' : 's'}
          {collection.isShared && <span className="ml-3 text-primary-600 dark:text-primary-400">🔗 Publicly shared</span>}
        </p>
      </Card>

      {collection.drops?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collection.drops.map((drop) => (
            <div key={drop._id} className="relative">
              <DropCard drop={drop} onView={(d) => navigate(`/drops/${d._id}`)} isOwner={false} />
              <button
                onClick={() => handleRemoveDrop(drop._id)}
                className="absolute top-3 right-3 z-10 px-2 py-1 rounded-lg text-xs font-medium bg-white/90 dark:bg-slate-800/90 text-red-600 dark:text-red-400 border border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 shadow-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-slate-500 dark:text-slate-400">No drops in this collection yet.</p>
          <Button className="mt-4" onClick={() => setAddDropModalOpen(true)}>+ Add a Drop</Button>
        </div>
      )}

      <Modal
        isOpen={addDropModalOpen}
        onClose={() => { setAddDropModalOpen(false); setSearch('') }}
        title="Add Drop to Collection"
        size="lg"
      >
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your drops..."
          className="mb-4"
        />
        {loadingAllDrops ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : addableDrops.length ? (
          <div className="max-h-96 overflow-y-auto space-y-2">
            {addableDrops.map((drop) => (
              <div
                key={drop._id}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{drop.title}</p>
                  <p className="text-xs text-slate-400 uppercase">{drop.type}</p>
                </div>
                <Button size="sm" onClick={() => handleAddDrop(drop._id)} loading={adding}>Add</Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
            No matching drops to add. All your drops may already be in this collection.
          </p>
        )}
      </Modal>

      <CollectionFormModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        collection={collection}
      />
    </div>
  )
}

export default CollectionView
