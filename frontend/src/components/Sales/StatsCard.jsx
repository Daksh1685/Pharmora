'use client';

export default function StatsCard({
  title,
  value,
  unit = '',
  icon: Icon,
  color = 'blue',
  description = ''
}) {
  const colorVariants = {
    blue: {
      gradient: 'from-blue-50 via-blue-25 to-white',
      wave: 'from-blue-200 via-blue-100 to-blue-50',
      accent: 'text-slate-700 dark:text-slate-300',
      accentLight: 'text-slate-700 dark:text-slate-400'
    },
    emerald: {
      gradient: 'from-emerald-50 via-emerald-25 to-white',
      wave: 'from-emerald-200 via-emerald-100 to-emerald-50',
      accent: 'text-emerald-600',
      accentLight: 'text-emerald-500'
    },
    purple: {
      gradient: 'from-purple-50 via-purple-25 to-white',
      wave: 'from-purple-200 via-purple-100 to-purple-50',
      accent: 'text-purple-600',
      accentLight: 'text-purple-500'
    }
  };

  const colorClass = colorVariants[color] || colorVariants.blue;

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${colorClass.gradient} border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group`}>
      {/* Wave Top Design */}
      <svg
        className={`absolute top-0 left-0 w-full h-20 opacity-40 group-hover:opacity-50 transition-opacity duration-300`}
        viewBox="0 0 1000 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`wave-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={
              color === 'blue' ? '#bfdbfe' :
              color === 'emerald' ? '#a7f3d0' :
              color === 'purple' ? '#e9d5ff' : '#bfdbfe'
            } />
            <stop offset="100%" stopColor={
              color === 'blue' ? '#dbeafe' :
              color === 'emerald' ? '#d1fae5' :
              color === 'purple' ? '#f3e8ff' : '#dbeafe'
            } />
          </linearGradient>
        </defs>
        <path
          d="M0,30 Q250,10 500,30 T1000,30 L1000,0 L0,0 Z"
          fill={`url(#wave-${color})`}
        />
        <path
          d="M0,50 Q250,30 500,50 T1000,50 L1000,20 Q250,40 500,20 T0,20 Z"
          fill={
            color === 'blue' ? '#dbeafe' :
            color === 'emerald' ? '#d1fae5' :
            color === 'purple' ? '#f3e8ff' : '#dbeafe'
          }
          opacity="0.4"
        />
      </svg>

      {/* Floating circles as decoration */}
      <div className="absolute top-8 right-10 w-20 h-20 rounded-full opacity-5 bg-gradient-to-br from-slate-300 to-slate-100 blur-xl group-hover:opacity-10 transition-opacity duration-300"></div>
      <div className="absolute bottom-4 left-8 w-24 h-24 rounded-full opacity-5 bg-gradient-to-br from-slate-300 to-slate-100 blur-2xl group-hover:opacity-10 transition-opacity duration-300"></div>

      {/* Content */}
      <div className="relative z-10 p-6 pt-10">
        {/* Header with Icon */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-1">
              {title}
            </p>
            {description && (
              <p className="text-xs text-slate-500">{description}</p>
            )}
          </div>
          {Icon && (
            <div className={`p-2.5 rounded-xl bg-slate-100 group-hover:bg-slate-200 transition-colors duration-300 flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${colorClass.accent}`} />
            </div>
          )}
        </div>

        {/* Value Section */}
        <div className="space-y-1">
          <p className={`text-5xl font-bold text-slate-900 ${colorClass.accentLight}`}>
            {value}
          </p>
          {unit && (
            <p className="text-sm font-medium text-slate-600">
              {unit}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

