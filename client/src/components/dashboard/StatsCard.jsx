const StatsCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  color = 'primary',
  className = '',
}) => {
  const colors = {
    primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  }

  return (
    <div className={`rounded-xl p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
          {trend && (
            <p className="mt-1 text-sm font-medium text-green-600 dark:text-green-400">{trend}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export default StatsCard