import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import {
  useGetMeQuery,
  useUpdatePreferencesMutation,
  useGetDropStatsQuery,
  useGetDropsQuery,
  useGetCollectionsQuery,
} from '../store/api'
import { updateUser } from '../store/slices/authSlice'
import { setTheme } from '../store/slices/uiSlice'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import StatsCard from '../components/dashboard/StatsCard'
import LoadingSpinner from '../components/common/LoadingSpinner'

const Profile = () => {
  const dispatch = useDispatch()
  const { user: authUser } = useSelector((state) => state.auth)
  const { data: meData, isLoading: meLoading } = useGetMeQuery()
  const { data: statsData, isLoading: statsLoading } = useGetDropStatsQuery()
  const [updatePreferences, { isLoading: saving }] = useUpdatePreferencesMutation()
  const [exporting, setExporting] = useState(false)

  const [prefs, setPrefs] = useState({ theme: 'light', defaultVisibility: 'private', recallInterval: 24 })

  const user = meData?.user || authUser
  const stats = statsData?.stats

  useEffect(() => {
    if (user?.preferences) {
      setPrefs({
        theme: user.preferences.theme || 'light',
        defaultVisibility: user.preferences.defaultVisibility || 'private',
        recallInterval: user.preferences.recallInterval ?? 24,
      })
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setPrefs((prev) => ({ ...prev, [name]: name === 'recallInterval' ? Number(value) : value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      const result = await updatePreferences(prefs).unwrap()
      dispatch(updateUser({ preferences: result.preferences }))
      if (result.preferences.theme) {
        dispatch(setTheme(result.preferences.theme))
      }
      toast.success('Preferences saved')
    } catch (err) {
      const details = err?.data?.details
      const message = Array.isArray(details) ? details.join(', ') : err?.data?.error
      toast.error(message || 'Failed to save preferences')
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const [dropsRes, collectionsRes] = await Promise.all([
        fetch('/api/drops?limit=1000', {
          headers: { Authorization: `Bearer ${localStorage.getItem('devdrops_token') || sessionStorage.getItem('devdrops_token')}` },
        }).then((r) => r.json()),
        fetch('/api/collections', {
          headers: { Authorization: `Bearer ${localStorage.getItem('devdrops_token') || sessionStorage.getItem('devdrops_token')}` },
        }).then((r) => r.json()),
      ])

      const exportData = {
        exportedAt: new Date().toISOString(),
        user: { username: user?.username, email: user?.email, preferences: user?.preferences },
        stats,
        drops: dropsRes.drops || [],
        collections: collectionsRes.collections || [],
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `devdrops-export-${format(new Date(), 'yyyy-MM-dd')}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('Data exported')
    } catch {
      toast.error('Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  if (meLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card padding="lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center font-semibold text-2xl shrink-0">
            {(user?.username || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate">{user?.username}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
            {user?.lastLogin && (
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Last login {format(new Date(user.lastLogin), 'MMM d, yyyy h:mm a')}
                {user?.lastLoginIP ? ` from ${user.lastLoginIP}` : ''}
              </p>
            )}
          </div>
        </div>
      </Card>

      <div>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Statistics</h2>
        {statsLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatsCard title="Total Drops" value={stats?.totalDrops ?? 0} color="primary" icon={<span>📦</span>} />
            <StatsCard title="Collections" value={stats?.totalCollections ?? 0} color="purple" icon={<span>🗂️</span>} />
            <StatsCard title="Mastered" value={stats?.mastered ?? 0} color="green" icon={<span>🏆</span>} />
            <StatsCard title="Streak" value={`${stats?.currentStreak ?? 0} days`} color="yellow" icon={<span>🔥</span>} />
          </div>
        )}
      </div>

      <Card padding="lg">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Preferences</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Theme</label>
            <div className="flex gap-2">
              {['light', 'dark'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPrefs((prev) => ({ ...prev, theme: t }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                    prefs.theme === t
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Default visibility for new drops
            </label>
            <div className="flex gap-2">
              {['private', 'public'].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setPrefs((prev) => ({ ...prev, defaultVisibility: v }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                    prefs.defaultVisibility === v
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="recallInterval" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Base recall interval (hours)
            </label>
            <input
              id="recallInterval"
              name="recallInterval"
              type="number"
              min={1}
              max={168}
              value={prefs.recallInterval}
              onChange={handleChange}
              className="w-32 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
              Used as the starting point for the spaced-repetition schedule (1–168 hours).
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" loading={saving}>Save Preferences</Button>
          </div>
        </form>
      </Card>

      <Card padding="lg">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Export your data</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Download all your drops and collections as a single JSON file.
        </p>
        <Button variant="outline" onClick={handleExport} loading={exporting}>
          Export all data (JSON)
        </Button>
      </Card>
    </div>
  )
}

export default Profile
