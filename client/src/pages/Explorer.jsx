import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { useGetDropsQuery, useToggleFavoriteMutation } from '../store/api'
import { useDebounce } from '../hooks/useDebounce'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import LoadingSpinner from '../components/common/LoadingSpinner'

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'code', label: 'Code' },
  { value: 'command', label: 'Command' },
  { value: 'link', label: 'Link' },
  { value: 'note', label: 'Note' },
]

const LANGUAGE_OPTIONS = [
  { value: '', label: 'All Languages' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
]

const VISIBILITY_OPTIONS = [
  { value: '', label: 'All Visibility' },
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'most_recalled', label: 'Most Recalled' },
  { value: 'alphabetical', label: 'Alphabetical' },
]

const TYPE_COLORS = {
  code: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  command: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  link: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  note: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
}

const TAG_COLORS = [
  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400',
]

// Deterministic color per tag string, so the same tag always renders the same color.
function tagColor(tag) {
  let hash = 0
  for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) >>> 0
  return TAG_COLORS[hash % TAG_COLORS.length]
}

const PAGE_SIZE = 8

const Select = ({ value, onChange, options, label }) => (
  <div>
    {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>}
    <select
      value={value}
      onChange={onChange}
      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
)

const Explorer = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [language, setLanguage] = useState('')
  const [visibility, setVisibility] = useState('')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [items, setItems] = useState([])

  const debouncedSearch = useDebounce(search, 400)

  const filters = { search: debouncedSearch || undefined, type: type || undefined, language: language || undefined, visibility: visibility || undefined, sort }

  const { data, isLoading, isFetching } = useGetDropsQuery({ ...filters, page, limit: PAGE_SIZE })
  const [toggleFavorite] = useToggleFavoriteMutation()

  // Reset to page 1 whenever a filter changes.
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, type, language, visibility, sort])

  // Accumulate results across pages for the "Load more" pattern.
  useEffect(() => {
    if (!data) return
    setItems((prev) => (page === 1 ? data.drops : [...prev, ...data.drops]))
  }, [data, page])

  const pagination = data?.pagination
  const hasMore = pagination ? page < pagination.pages : false

  const handleFavorite = async (id) => {
    await toggleFavorite(id).unwrap().catch(() => {})
    setItems((prev) => prev.map((d) => (d._id === id ? { ...d, isFavorite: !d.isFavorite } : d)))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Explore Drops</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Search, filter and sort across all of your knowledge drops.
        </p>
      </div>

      <div className="space-y-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, content, or tags..."
          leftIcon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Select value={type} onChange={(e) => setType(e.target.value)} options={TYPE_OPTIONS} />
          <Select value={language} onChange={(e) => setLanguage(e.target.value)} options={LANGUAGE_OPTIONS} />
          <Select value={visibility} onChange={(e) => setVisibility(e.target.value)} options={VISIBILITY_OPTIONS} />
          <Select value={sort} onChange={(e) => setSort(e.target.value)} options={SORT_OPTIONS} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : items.length ? (
        <>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {pagination?.total ?? items.length} drop{pagination?.total === 1 ? '' : 's'} found
          </p>
          <div className="space-y-3">
            {items.map((drop) => {
              const preview = drop.content.length > 50 ? drop.content.slice(0, 50) + '...' : drop.content
              return (
                <Card
                  key={drop._id}
                  hover
                  padding="md"
                  onClick={() => navigate(`/drops/${drop._id}`)}
                  className="flex items-start gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[drop.type]}`}>
                        {drop.type}
                      </span>
                      {drop.language && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">{drop.language}</span>
                      )}
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {drop.visibility === 'public' ? '🌐 Public' : '🔒 Private'}
                      </span>
                    </div>
                    <h3 className="mt-1.5 font-medium text-slate-900 dark:text-slate-100 truncate">{drop.title}</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-mono truncate">{preview}</p>
                    {drop.tags?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {drop.tags.map((tag) => (
                          <span key={tag} className={`px-2 py-0.5 text-xs rounded ${tagColor(tag)}`}>{tag}</span>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                      <span>🔁 {drop.recallCount} recalls</span>
                      <span>
                        {drop.lastRecalled
                          ? `Last recalled ${formatDistanceToNow(new Date(drop.lastRecalled), { addSuffix: true })}`
                          : 'Never recalled'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleFavorite(drop._id) }}
                    className={`shrink-0 p-1.5 rounded-lg transition-colors ${drop.isFavorite ? 'text-yellow-500' : 'text-slate-300 hover:text-yellow-500'}`}
                    aria-label={drop.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <svg className={`w-5 h-5 ${drop.isFavorite ? 'fill-current' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                </Card>
              )
            })}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" loading={isFetching} onClick={() => setPage((p) => p + 1)}>
                Load more
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-slate-500 dark:text-slate-400">No drops match your filters.</p>
        </div>
      )}
    </div>
  )
}

export default Explorer
