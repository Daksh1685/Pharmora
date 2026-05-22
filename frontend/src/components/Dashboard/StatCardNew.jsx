'use client';

export default function StatCardNew({
  title,
  value,
  percentageChange = '+2.5%',
  timeframe = 'This Month',
  gradientColor = 'from-green-400 to-emerald-600',
  backgroundColor = 'bg-green-50',
}) {
  return (
    <div className={`${backgroundColor} dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-slate-200 dark:hover:border-slate-600 transition-all duration-300 ease-out`}>
      {/* Header with title */}
      <div className="mb-4">
        <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
          {title}
        </p>
      </div>

      {/* Value and percentage */}
      <div className="mb-6">
        <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
          {value}
        </p>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
          <span className="text-green-600 dark:text-green-400 font-semibold">{percentageChange}</span>{' '}
          <span className="text-slate-400 dark:text-slate-500">{timeframe}</span>
        </p>
      </div>

      {/* Mini bar chart visualization with gradient */}
      <div className="flex items-end justify-between gap-1 h-12 group">
        {[80, 60, 75, 90, 70, 85, 95].map((height, idx) => (
          <div
            key={idx}
            className={`flex-1 rounded-t bg-gradient-to-t ${gradientColor} opacity-60 group-hover:opacity-100 transition-opacity duration-300`}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  );
}
