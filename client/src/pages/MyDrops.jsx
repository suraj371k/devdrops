import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import {
  useGetDropsQuery,
  useGetRecallDropsQuery,
  useGetCollectionsQuery,
  useGetCollectionQuery,
  useDeleteDropMutation,
  useToggleFavoriteMutation,
  useMarkRecalledMutation,
  useBulkDropActionMutation,
} from '../store/api'
import { setViewMode, toggleDropSelection, clearSelection } from '../store/slices/uiSlice'
import { useDebounce } from '../hooks/useDebounce'
import DropCard from '../components/drops/DropCard'
import DropFormModal from '../components/drops/DropFormModal'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'

const TYPE_FILTERS = ['', 'code', 'command', 'link', 'note']
const TABS = [
  { id: 'all', label: 'All' },
  { id: 'favorite', label: 'Favorite' },
  { id: 'due', label: 'Due for Recall' },
  { id: 'type', label: 'By Type' },
]

const MyDrops = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { viewMode, selectedDrops } = useSelector((state) => state.ui)

  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [collectionId, setCollectionId] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDrop, setEditingDrop] = useState(null)
  const [bulkCollectionMenuOpen, setBulkCollectionMenuOpen] = useState(false)
  const debouncedSearch = useDebounce(search, 400)

  const { data: collectionsData } = useGetCollectionsQuery()
  const collections = collectionsData?.collections || []

  const isFilteringByCollection = Boolean(collectionId)

  const { data: collectionData, isLoading: collectionLoading } = useGetCollectionQuery(collectionId, {
    skip: !isFilteringByCollection,
  })

  const { data: dueData, isLoading: dueLoading, isFetching: dueFetching } = useGetRecallDropsQuery(
    { limit: 50 },
    { skip: isFilteringByCollection || tab !== 'due' }
  )

  const { data: normalData, isLoading: normalLoading, isFetching: normalFetching } = useGetDropsQuery(
    {
      search: debouncedSearch,
      type: tab === 'type' ? (type || undefined) : undefined,
      isFavorite: tab === 'favorite' ? 'true' : undefined,
      limit: 24,
    },
    { skip: isFilteringByCollection || tab === 'due' }
  )

  const [deleteDrop] = useDeleteDropMutation()
  const [toggleFavorite] = useToggleFavoriteMutation()
  const [markRecalled] = useMarkRecalledMutation()
  const [bulkDropAction, { isLoading: bulkLoading }] = useBulkDropActionMutation()

  const isLoading = isFilteringByCollection ? collectionLoading : tab === 'due' ? dueLoading : normalLoading
  const isFetching = isFilteringByCollection ? false : tab === 'due' ? dueFetching : normalFetching

  const drops = useMemo(() => {
    if (isFilteringByCollection) {
      const collectionDrops = collectionData?.collection?.drops || []
      const q = debouncedSearch.trim().toLowerCase()
      return q ? collectionDrops.filter((d) => d.title.toLowerCase().includes(q)) : collectionDrops
    }
    if (tab === 'due') return dueData?.drops || []
    return normalData?.drops || []
  }, [isFilteringByCollection, collectionData, tab, dueData, normalData, debouncedSearch])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this drop? This cannot be undone.')) return
    try {
      await deleteDrop(id).unwrap()
      toast.success('Drop deleted')
    } catch {
      toast.error('Failed to delete drop')
    }
  }

  const handleFavorite = async (id) => {
    try {
      await toggleFavorite(id).unwrap()
    } catch {
      toast.error('Failed to update favorite')
    }
  }

  const handleRecall = async (id) => {
    try {
      await markRecalled({ id, recallType: 'quick', confidence: 3 }).unwrap()
      toast.success('Marked as recalled')
    } catch {
      toast.error('Failed to mark recalled')
    }
  }

  const openCreate = () => { setEditingDrop(null); setModalOpen(true) }
  const openEdit = (drop) => { setEditingDrop(drop); setModalOpen(true) }

  const handleTabChange = (nextTab) => {
    setTab(nextTab)
    setCollectionId('')
    dispatch(clearSelection())
  }

  const handleToggleSelect = (id) => dispatch(toggleDropSelection(id))

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedDrops.length} drop(s)? This cannot be undone.`)) return
    try {
      await bulkDropAction({ ids: selectedDrops, action: 'delete' }).unwrap()
      toast.success(`${selectedDrops.length} drop(s) deleted`)
      dispatch(clearSelection())
    } catch {
      toast.error('Bulk delete failed')
    }
  }

  const handleBulkVisibility = async (visibility) => {
    try {
      await bulkDropAction({ ids: selectedDrops, action: 'visibility', visibility }).unwrap()
      toast.success(`Visibility updated for ${selectedDrops.length} drop(s)`)
      dispatch(clearSelection())
    } catch {
      toast.error('Bulk visibility update failed')
    }
  }

  const handleBulkAddToCollection = async (targetCollectionId) => {
    setBulkCollectionMenuOpen(false)
    try {
      await bulkDropAction({ ids: selectedDrops, action: 'addToCollection', collectionId: targetCollectionId }).unwrap()
      toast.success(`Added ${selectedDrops.length} drop(s) to collection`)
      dispatch(clearSelection())
    } catch {
      toast.error('Bulk add to collection failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Drops</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch(setViewMode(viewMode === 'grid' ? 'list' : 'grid'))}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Toggle view mode"
            title={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
          >
            {viewMode === 'grid' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h4v4H4V6zm6 0h4v4h-4V6zm6 0h4v4h-4V6zM4 14h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z" /></svg>
            )}
          </button>
          <Button onClick={openCreate}>+ New Drop</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search drops..."
          className="sm:max-w-xs"
        />

        {tab === 'type' && (
          <div className="flex gap-2 flex-wrap">
            {TYPE_FILTERS.map((t) => (
              <button
                key={t || 'all'}
                onClick={() => setType(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                  type === t
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {t || 'All'}
              </button>
            ))}
          </div>
        )}

        <select
          value={collectionId}
          onChange={(e) => { setCollectionId(e.target.value); dispatch(clearSelection()) }}
          className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:max-w-xs"
        >
          <option value="">Filter by collection...</option>
          {collections.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      </div>

      {selectedDrops.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
          <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
            {selectedDrops.length} selected
          </span>
          <div className="flex-1" />
          <Button size="sm" variant="outline" onClick={() => handleBulkVisibility('private')} loading={bulkLoading}>
            Make Private
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkVisibility('public')} loading={bulkLoading}>
            Make Public
          </Button>
          <div className="relative">
            <Button size="sm" variant="outline" onClick={() => setBulkCollectionMenuOpen((o) => !o)}>
              Add to Collection
            </Button>
            {bulkCollectionMenuOpen && (
              <div className="absolute right-0 top-full mt-2 z-10 w-48 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg max-h-56 overflow-y-auto">
                {collections.length ? (
                  collections.map((c) => (
                    <button
                      key={c._id}
                      onClick={() => handleBulkAddToCollection(c._id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="truncate">{c.name}</span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-3 text-sm text-slate-400 text-center">No collections yet.</p>
                )}
              </div>
            )}
          </div>
          <Button size="sm" variant="danger" onClick={handleBulkDelete} loading={bulkLoading}>
            Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={() => dispatch(clearSelection())}>
            Clear
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : drops.length ? (
        <div className={
          viewMode === 'grid'
            ? `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${isFetching ? 'opacity-60' : ''}`
            : `flex flex-col gap-3 ${isFetching ? 'opacity-60' : ''}`
        }>
          {drops.map((drop) => (
            <DropCard
              key={drop._id}
              drop={drop}
              onView={(d) => navigate(`/drops/${d._id}`)}
              onEdit={openEdit}
              onDelete={handleDelete}
              onToggleFavorite={handleFavorite}
              onRecall={handleRecall}
              selectable
              selected={selectedDrops.includes(drop._id)}
              onToggleSelect={handleToggleSelect}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-slate-500 dark:text-slate-400">No drops match your search.</p>
          <Button className="mt-4" onClick={openCreate}>Create your first drop</Button>
        </div>
      )}

      <DropFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} drop={editingDrop} />
    </div>
  )
}

export default MyDrops
