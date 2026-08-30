import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useGetDropStatsQuery, useGetRecallDropsQuery, useGetDropsQuery, useMarkRecalledMutation } from '../store/api'
import StatsCard from '../components/dashboard/StatsCard'
import RecallQueue from '../components/dashboard/RecallQueue'
import DropCard from '../components/drops/DropCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Button from '../components/common/Button'

const Dashboard = () => {
  const navigate = useNavigate()
  const { data: statsData, isLoading: statsLoading } = useGetDropStatsQuery()
  const { data: recallData, isLoading: recallLoading } = useGetRecallDropsQuery({ limit: 5 })
  const { data: dropsData, isLoading: dropsLoading } = useGetDropsQuery({ limit: 6, sort: 'newest' })
  const [markRecalled, { isLoading: recalling }] = useMarkRecalledMutation()

  const stats = statsData?.stats

  const handleQuickRecall = async (id) => {
    try {
      await markRecalled({ id, recallType: 'quick', confidence: 3 }).unwrap()
      toast.success('Marked as recalled')
    } catch {
      toast.error('Could not mark as recalled')
    }
  }

  if (statsLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
        <Button onClick={() => navigate('/my-drops')}>+ New Drop</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Drops"
          value={stats?.totalDrops ?? 0}
          color="primary"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4" /></svg>}
        />
        <StatsCard
          title="Due for Recall"
          value={stats?.dueForRecall ?? recallData?.pagination?.total ?? 0}
          color="yellow"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatsCard
          title="Current Streak"
          value={stats?.currentStreak ? `${stats.currentStreak} days` : '0 days'}
          color="green"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
        />
        <StatsCard
          title="Favorites"
          value={stats?.favoriteCount ?? 0}
          color="purple"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.446a1 1 0 00-.363 1.118l1.287 3.957c.3.922-.755 1.688-1.539 1.118l-3.367-2.446a1 1 0 00-1.176 0l-3.367 2.446c-.784.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 00-.363-1.118L2.98 9.385c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.286-3.958z" /></svg>}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Due for Recall</h2>
          {recallData?.drops?.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => navigate('/recall')}>
              Start Recall Session →
            </Button>
          )}
        </div>
        {recallLoading ? (
          <LoadingSpinner />
        ) : (
          <RecallQueue drops={recallData?.drops || []} onRecall={handleQuickRecall} loading={recalling} />
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Drops</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/my-drops')}>
            View All →
          </Button>
        </div>
        {dropsLoading ? (
          <LoadingSpinner />
        ) : dropsData?.drops?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dropsData.drops.map((drop) => (
              <DropCard key={drop._id} drop={drop} onView={(d) => navigate(`/drops/${d._id}`)} />
            ))}
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400 text-sm py-8 text-center">
            No drops yet. Create your first one from "My Drops".
          </p>
        )}
      </div>
    </div>
  )
}

export default Dashboard
