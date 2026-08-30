import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useExplorePublicDropsQuery } from '../store/api'
import { formatDistanceToNow } from 'date-fns'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import DropCard from '../components/drops/DropCard'
import LoadingSpinner from '../components/common/LoadingSpinner'

const TYPE_OPTIONS = ['code', 'command', 'link', 'note']
const LANGUAGE_OPTIONS = ['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'html', 'css', 'sql', 'bash', 'dockerfile']
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'most_recalled', label: 'Most Recalled' },
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'oldest', label: 'Oldest' },
]

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

const PublicExplore = () => {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [language, setLanguage] = useState('')
  const [visibility, setVisibility] = useState('')
  const [sort, setSort] = useState('newest')
  const [hasMore, setHasMore] = useState(true)

  const filters = {
    ...(search && { search }),
    ...(type && { type }),
    ...(language && { language }),
    ...(visibility && { visibility }),
    ...(sort && { sort }),
  }

  const { data, isLoading, isFetching, error, refetch } = useExplorePublicDropsQuery(
    { page, limit: 8, ...filters },
    { skip: false }
  )

  const handleSearch = useCallback((e) => {
    setSearch(e.target.value)
  }, [])

  const handleFilterChange = useCallback((filter, value) => {
    setPage(1)
    if (filter === 'type') setType(value)
    else if (filter === 'language') setLanguage(value)
    else if (filter === 'visibility') setVisibility(value)
    else if (filter === 'sort') setSort(value)
  }, [])

  const handleLoadMore = useCallback(() => {
    setPage(prev => prev + 1)
  }, [])

  const clearFilters = useCallback(() => {
    setSearch('')
    setType('')
    setLanguage('')
    setVisibility('')
    setSort('newest')
    setPage(1)
  }, [])

  const hasActiveFilters = search || type || language || visibility || sort !== 'newest'

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg)]">
        <Card padding="lg" className="max-w-md text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Failed to load</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Unable to fetch public drops. Please try again later.
          </p>
          <Button className="mt-6" onClick={() => refetch()}>Retry</Button>
        </Card>
      </div>
    )
  }

  const drops = data?.drops || []
  const pagination = data?.pagination

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <header className="h-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Explore</h1>
          </div>
        </header>
        <main className="p-4 sm:p-6 max-w-7xl mx-auto">
          <div className="space-y-4" aria-label="Loading drops">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-3" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
              </Card>
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="h-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-slate-900 dark:text-slate-100">🧠 DevDrops</Link>
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Login</Link>
        </div>
      </header>

      <main className="p-4 sm:p-6 max-w-7xl mx-auto">
        <section aria-labelledby="explore-heading">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 id="explore-heading" className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Explore Public Drops
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Discover knowledge drops shared by the community
              </p>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>

          {/* Search & Filters */}
          <Card className="mb-6" padding="lg">
            <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
              <div className="sm:col-span-2 lg:col-span-2">
                <label htmlFor="search" className="sr-only">Search drops</label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <Input
                    id="search"
                    type="search"
                    placeholder="Search by title, content, or tags..."
                    value={search}
                    onChange={handleSearch}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="type-filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                <select
                  id="type-filter"
                  value={type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="language-filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Language</label>
                <select
                  id="language-filter"
                  value={language}
                  onChange={(e) => handleFilterChange('language', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Languages</option>
                  {LANGUAGE_OPTIONS.map((l) => (
                    <option key={l} value={l}>
                      {l.charAt(0).toUpperCase() + l.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="visibility-filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Visibility</label>
                <select
                  id="visibility-filter"
                  value={visibility}
                  onChange={(e) => handleFilterChange('visibility', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div>
                <label htmlFor="sort-filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sort</label>
                <select
                  id="sort-filter"
                  value={sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {SORT_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            {drops.length === 0 ? (
              <Card className="text-center py-12">
                <div className="text-5xl mb-4">📭</div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                  No drops found
                </h3>
                <p className="mt-2 text-slate-500 dark:text-slate-400">
                  {hasActiveFilters
                    ? 'Try adjusting your filters or search terms.'
                    : 'No public drops have been shared yet.'}
                </p>
              </Card>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="list">
                  {drops.map((drop) => (
                    <DropCard
                      key={drop._id}
                      drop={{
                        ...drop,
                        isFavorite: false,
                      }}
                      isOwner={false}
                      onView={(d) => navigate(`/drops/${d._id}`)}
                    />
                  ))}
                </div>

                {/* Load More / Pagination */}
                {pagination && pagination.pages > 1 && (
                  <div className="flex justify-center">
                    {page < pagination.pages ? (
                      <Button
                        onClick={handleLoadMore}
                        disabled={isFetching}
                        className="w-full sm:w-auto"
                      >
                        {isFetching ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          `Load More (${page}/${pagination.pages})`
                        )}
                      </Button>
                    ) : (
                      <Button variant="ghost" disabled className="w-full sm:w-auto">
                        End of results
                      </Button>
                    )}
                  </div>
                )}

                {/* Results count */}
                <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                  Showing {drops.length} of {pagination?.total || drops.length} drops
                </p>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default PublicExplore
