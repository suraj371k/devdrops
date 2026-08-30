import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import Card from '../common/Card'
import Button from '../common/Button'

const TYPE_COLORS = {
  code: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  command: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  link: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  note: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
}

const RecallQueue = ({ drops, onRecall, loading }) => {
  const navigate = useNavigate()

  if (!drops.length) {
    return (
      <Card className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">All caught up!</h3>
        <p className="text-slate-500 dark:text-slate-400">No drops due for recall right now. Great job!</p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {drops.map((drop) => (
        <Card 
          key={drop._id} 
          hover 
          onClick={() => navigate(`/recall/${drop._id}`)}
          padding="md"
          className="cursor-pointer"
        >
          <div className="flex items-start gap-3">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[drop.type]}`}>
              {drop.type}
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-slate-900 dark:text-slate-100 truncate">{drop.title}</h4>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{drop.content}</p>
              <div className="mt-2 flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                <span>Recalled {drop.recallCount} times</span>
                <span>•</span>
                <span>Due {formatDistanceToNow(new Date(drop.nextRecallDate), { addSuffix: true })}</span>
              </div>
            </div>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={(e) => { e.stopPropagation(); onRecall(drop._id); }}
              disabled={loading}
            >
              Recall
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}

export default RecallQueue