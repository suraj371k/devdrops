import { useParams, Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { useGetSharedCollectionQuery } from '../store/api'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'

const TYPE_COLORS = {
  code: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  command: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  link: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  note: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
}

const SharedCollection = () => {
  const { token } = useParams()
  const { data, isLoading, isError } = useGetSharedCollectionQuery(token)
  const collection = data?.collection

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <LoadingSpinner size="lg" text="Loading shared collection..." />
      </div>
    )
  }

  if (isError || !collection) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg)]">
        <Card padding="lg" className="max-w-md text-center">
          <div className="text-5xl mb-4">🔗</div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Link not found</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            This share link is invalid, has been revoked, or the collection no longer exists.
          </p>
          <Link to="/login">
            <Button className="mt-6">Go to Login</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/login" className="text-lg font-bold text-slate-900 dark:text-slate-100">🧠 DevDrops</Link>
          <Link to="/register"><Button size="sm">Sign up</Button></Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: collection.color }} />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{collection.name}</h1>
            {collection.description && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{collection.description}</p>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          📦 {collection.dropCount ?? collection.drops?.length ?? 0} drop{(collection.dropCount ?? 0) === 1 ? '' : 's'} · read-only shared view
        </p>

        {collection.drops?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {collection.drops.map((drop) => (
              <Card key={drop._id} padding="md">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[drop.type] || TYPE_COLORS.note}`}>
                    {drop.type}
                  </span>
                  {drop.language && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {drop.language}
                    </span>
                  )}
                </div>
                <h3 className="mt-3 font-medium text-slate-900 dark:text-slate-100">{drop.title}</h3>
                <pre className="mt-2 whitespace-pre-wrap font-mono text-xs text-slate-500 dark:text-slate-400 line-clamp-4">
                  {drop.content}
                </pre>
                {drop.tags?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {drop.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 text-xs rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {drop.nextRecallDate && (
                  <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                    📅 Next recall {formatDistanceToNow(new Date(drop.nextRecallDate), { addSuffix: true })}
                  </p>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400 text-sm py-8 text-center">
            This collection doesn't have any drops yet.
          </p>
        )}
      </main>
    </div>
  )
}

export default SharedCollection
