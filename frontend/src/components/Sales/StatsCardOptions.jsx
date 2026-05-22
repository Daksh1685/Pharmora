'use client';

// DESIGN OPTION 1: Wave Design (Current)
export function StatsCard_Wave({ title, value, unit, icon: Icon, color, description }) {
  const colorVariants = {
    blue: { gradient: 'from-blue-50 via-blue-25 to-white', wave: '#bfdbfe' },
    emerald: { gradient: 'from-emerald-50 via-emerald-25 to-white', wave: '#a7f3d0' },
    purple: { gradient: 'from-purple-50 via-purple-25 to-white', wave: '#e9d5ff' }
  };
  const colors = colorVariants[color] || colorVariants.blue;

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${colors.gradient} border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group`}>
      <svg className="absolute top-0 left-0 w-full h-20 opacity-40 group-hover:opacity-50 transition-opacity duration-300" viewBox="0 0 1000 100" preserveAspectRatio="none">
        <path d="M0,30 Q250,10 500,30 T1000,30 L1000,0 L0,0 Z" fill={colors.wave} />
      </svg>
      <div className="relative z-10 p-6 pt-10">
        <div className="flex items-start justify-between mb-6">
          <div><p className="text-sm font-semibold text-slate-600 uppercase">{title}</p></div>
          {Icon && <div className="p-2.5 rounded-xl bg-slate-100"><Icon className="w-5 h-5" /></div>}
        </div>
        <p className="text-5xl font-bold text-slate-900">{value}</p>
        {unit && <p className="text-sm text-slate-600">{unit}</p>}
      </div>
    </div>
  );
}

// DESIGN OPTION 2: Minimalist Clean Design
export function StatsCard_Minimalist({ title, value, unit, icon: Icon, color, description }) {
  const colors = {
    blue: 'bg-slate-50 dark:bg-slate-800 border-blue-200 text-slate-700 dark:text-slate-300',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600'
  };

  return (
    <div className={`rounded-2xl border p-6 shadow-sm hover:shadow-md transition-all duration-300 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-4">
        {Icon && <Icon className="w-6 h-6 opacity-70" />}
        <p className="text-xs font-bold uppercase">{title}</p>
      </div>
      <p className="text-4xl font-bold text-slate-900 mb-1">{value}</p>
      {unit && <p className="text-xs text-slate-600">{unit}</p>}
    </div>
  );
}

// DESIGN OPTION 3: Glassmorphism Design
export function StatsCard_Glass({ title, value, unit, icon: Icon, color, description }) {
  const colors = {
    blue: 'from-blue-400 to-blue-600',
    emerald: 'from-emerald-400 to-emerald-600',
    purple: 'from-purple-400 to-purple-600'
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${colors[color]} p-6 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all duration-300 group border border-white border-opacity-20`}>
      <div className="absolute inset-0 bg-white opacity-5"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          {Icon && <Icon className="w-6 h-6 text-white opacity-80" />}
          <p className="text-xs font-bold uppercase text-white opacity-70">{title}</p>
        </div>
        <p className="text-4xl font-bold text-white mb-2">{value}</p>
        {unit && <p className="text-sm text-white opacity-80">{unit}</p>}
      </div>
    </div>
  );
}

// DESIGN OPTION 4: Bold Gradient Design
export function StatsCard_Bold({ title, value, unit, icon: Icon, color, description }) {
  const colors = {
    blue: 'from-blue-500 to-blue-700',
    emerald: 'from-emerald-500 to-emerald-700',
    purple: 'from-purple-500 to-purple-700'
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colors[color]} shadow-lg hover:shadow-xl transition-all duration-300 p-6 group`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-300"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12 group-hover:scale-125 transition-transform duration-300"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          {Icon && <Icon className="w-6 h-6 text-white opacity-90" />}
          <p className="text-xs font-bold uppercase text-white opacity-70">{title}</p>
        </div>
        <p className="text-4xl font-bold text-white mb-1">{value}</p>
        {unit && <p className="text-sm text-white opacity-80">{unit}</p>}
      </div>
    </div>
  );
}

// DESIGN OPTION 5: Neumorphic Design
export function StatsCard_Neumorphic({ title, value, unit, icon: Icon, color, description }) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 p-8 shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] hover:shadow-[5px_5px_12px_#bebebe,-5px_-5px_12px_#ffffff] transition-all duration-300">
      <p className="text-xs font-bold uppercase text-slate-600 mb-6">{title}</p>
      <p className="text-4xl font-bold text-slate-800 mb-2">{value}</p>
      {unit && <p className="text-sm text-slate-600">{unit}</p>}
    </div>
  );
}

// DESIGN OPTION 5B: Simple Real-Time Stats Card (Neumorphic)
export function StatsCard_NeuomorphicGraph({ title, value, unit, icon: Icon, color, description, data, salesData, isLoading }) {
  // Color configuration for background and chart
  const colorConfig = {
    blue: {
      bg: 'bg-slate-50 dark:bg-slate-800 dark:bg-blue-900/20',
      gradient: 'url(#blueGradient)',
      line: 'rgb(59, 130, 246)',
      gradientStart: 'rgb(96, 165, 250)'
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      gradient: 'url(#emeraldGradient)',
      line: 'rgb(16, 185, 129)',
      gradientStart: 'rgb(52, 211, 153)'
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      gradient: 'url(#orangeGradient)',
      line: 'rgb(249, 115, 22)',
      gradientStart: 'rgb(253, 164, 92)'
    }
  };

  const config = colorConfig[color] || colorConfig.blue;

  // Generate smooth area chart path from sales data
  const generateSvgPath = () => {
    if (!salesData || salesData.length === 0) {
      // Default demo pattern matching your reference image
      return 'M10,35 L40,20 L70,28 L100,15 L130,22 L160,8 L190,18 L200,12';
    }

    // Take last 8-12 data points for the chart
    let dataPoints = salesData.slice(-12);
    if (dataPoints.length === 0) {
      return 'M10,35 L40,20 L70,28 L100,15 L130,22 L160,8 L190,18 L200,12';
    }

    // Extract amounts - check for totalAmount first (from MongoDB), then fallback to other properties
    const amounts = dataPoints.map(item => {
      let val = item?.totalAmount || item?.amount || item?.total || item?.value || 0;
      // Handle case where it might be a string
      val = typeof val === 'string' ? parseFloat(val) : val;
      return Number(val) || 0;
    });

    // Filter out zero values for better scaling
    const nonZeroAmounts = amounts.filter(a => a > 0);
    const validAmounts = nonZeroAmounts.length > 0 ? nonZeroAmounts : amounts;
    
    const maxValue = Math.max(...validAmounts, 1);
    const minValue = Math.min(...validAmounts, 0);
    const range = Math.max(maxValue - minValue, maxValue * 0.1); // At least 10% of max for range
    
    // Start building the line path with variation
    let pathData = '';
    
    amounts.forEach((amount, index) => {
      const x = (index / (dataPoints.length - 1 || 1)) * 190 + 10;
      const normalized = range > 0 ? (amount - minValue) / range : 0.5;
      const y = 42 - (Math.max(0, Math.min(1, normalized)) * 28); // More variation in Y
      
      if (index === 0) {
        pathData += `M${x},${y}`;
      } else {
        pathData += ` L${x},${y}`;
      }
    });

    // Ensure we always return a valid path
    return pathData || 'M10,35 L40,20 L70,28 L100,15 L130,22 L160,8 L190,18 L200,12';
  };

  return (
    <div className={`${config.bg} rounded-2xl p-5 sm:p-6 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-slate-200 dark:hover:border-slate-600 transition-all duration-300 ease-out ${isLoading ? 'opacity-60 animate-pulse' : 'opacity-100'}`}>
      {/* Header with title */}
      <div className="mb-4">
        <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </p>
      </div>

      {/* Value and unit */}
      <div className="mb-6">
        <p className={`text-3xl sm:text-4xl font-bold ${isLoading ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
          {value}
        </p>
        {unit && <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">{unit}</p>}
      </div>

      {/* Smooth area chart */}
      <svg className={`w-full h-12 group ${isLoading ? 'opacity-50' : 'opacity-100'}`} viewBox="0 0 200 50" preserveAspectRatio="none">
        <defs>
          <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(249, 115, 22)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(249, 115, 22)" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Area fill */}
        <path 
          d={`${generateSvgPath()} L200,50 L0,50 Z`}
          fill={config.gradient}
          className="opacity-80 group-hover:opacity-100 transition-opacity duration-300"
        />
        
        {/* Line stroke */}
        <path 
          d={generateSvgPath()}
          fill="none"
          stroke={config.line}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-100 transition-opacity duration-300"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

// DESIGN OPTION 6: Outlined Card Design
export function StatsCard_Outlined({ title, value, unit, icon: Icon, color, description }) {
  const colors = {
    blue: 'border-blue-300 text-slate-700 dark:text-slate-300',
    emerald: 'border-emerald-300 text-emerald-600',
    purple: 'border-purple-300 text-purple-600'
  };

  return (
    <div className={`rounded-2xl border-2 ${colors[color]} bg-white p-7 hover:shadow-lg transition-all duration-300`}>
      <div className="flex items-center justify-between mb-4">
        {Icon && <Icon className={`w-6 h-6 ${colors[color].split(' ')[1]}`} />}
        <p className={`text-xs font-bold uppercase ${colors[color].split(' ')[1]}`}>{title}</p>
      </div>
      <p className="text-4xl font-bold text-slate-900 mb-1">{value}</p>
      {unit && <p className="text-sm text-slate-600">{unit}</p>}
    </div>
  );
}

// DESIGN OPTION 7: Soft Shadow Design
export function StatsCard_SoftShadow({ title, value, unit, icon: Icon, color, description }) {
  const colors = {
    blue: { bg: 'bg-slate-50 dark:bg-slate-800', shadow: 'shadow-blue-200/50' },
    emerald: { bg: 'bg-emerald-50', shadow: 'shadow-emerald-200/50' },
    purple: { bg: 'bg-purple-50', shadow: 'shadow-purple-200/50' }
  };

  return (
    <div className={`${colors[color].bg} rounded-3xl p-7 shadow-2xl ${colors[color].shadow} hover:shadow-lg transition-all duration-300`}>
      <div className="flex items-center justify-between mb-4">
        {Icon && <Icon className="w-6 h-6 text-slate-700" />}
        <p className="text-xs font-bold uppercase text-slate-700">{title}</p>
      </div>
      <p className="text-4xl font-bold text-slate-900 mb-1">{value}</p>
      {unit && <p className="text-sm text-slate-600">{unit}</p>}
    </div>
  );
}

// DESIGN OPTION 8: Accent Bar Design
export function StatsCard_AccentBar({ title, value, unit, icon: Icon, color, description }) {
  const colors = {
    blue: 'border-l-blue-500 bg-slate-50 dark:bg-slate-800',
    emerald: 'border-l-emerald-500 bg-emerald-50',
    purple: 'border-l-purple-500 bg-purple-50'
  };

  return (
    <div className={`rounded-2xl border-l-4 p-6 shadow-sm hover:shadow-md transition-all duration-300 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-4">
        {Icon && <Icon className="w-6 h-6 text-slate-600" />}
        <p className="text-xs font-bold uppercase text-slate-600">{title}</p>
      </div>
      <p className="text-4xl font-bold text-slate-900 mb-1">{value}</p>
      {unit && <p className="text-sm text-slate-600">{unit}</p>}
    </div>
  );
}

// DESIGN OPTION 9: Gradient Text Design
export function StatsCard_GradientText({ title, value, unit, icon: Icon, color, description }) {
  const colors = {
    blue: { from: 'from-blue-600', to: 'to-blue-400' },
    emerald: { from: 'from-emerald-600', to: 'to-emerald-400' },
    purple: { from: 'from-purple-600', to: 'to-purple-400' }
  };

  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-7 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        {Icon && <Icon className="w-6 h-6 text-slate-600" />}
        <p className="text-xs font-bold uppercase text-slate-600">{title}</p>
      </div>
      <p className={`text-5xl font-bold bg-gradient-to-r ${colors[color].from} ${colors[color].to} bg-clip-text text-transparent mb-1`}>{value}</p>
      {unit && <p className="text-sm text-slate-600">{unit}</p>}
    </div>
  );
}

// DESIGN OPTION 10: Large Icon Background
export function StatsCard_LargeIconBg({ title, value, unit, icon: Icon, color, description }) {
  const colors = {
    blue: { bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', icon: 'text-blue-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'text-emerald-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'text-purple-100' }
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl ${colors[color].bg} p-7 hover:shadow-lg transition-all duration-300`}>
      <div className="absolute -right-8 -top-8 opacity-20">
        {Icon && <Icon className={`w-32 h-32 ${colors[color].icon}`} />}
      </div>
      <div className="relative z-10">
        <p className={`text-xs font-bold uppercase ${colors[color].text}`}>{title}</p>
        <p className="text-4xl font-bold text-slate-900 mt-3 mb-1">{value}</p>
        {unit && <p className="text-sm text-slate-600">{unit}</p>}
      </div>
    </div>
  );
}

// DESIGN OPTION 11: Top Gradient Bar
export function StatsCard_TopBar({ title, value, unit, icon: Icon, color, description }) {
  const colors = {
    blue: 'bg-gradient-to-r from-blue-500 to-blue-600',
    emerald: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
    purple: 'bg-gradient-to-r from-purple-500 to-purple-600'
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className={`${colors[color]} h-2`}></div>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          {Icon && <Icon className="w-6 h-6 text-slate-600" />}
          <p className="text-xs font-bold uppercase text-slate-600">{title}</p>
        </div>
        <p className="text-4xl font-bold text-slate-900 mb-1">{value}</p>
        {unit && <p className="text-sm text-slate-600">{unit}</p>}
      </div>
    </div>
  );
}

// DESIGN OPTION 12: Icon Circle Background
export function StatsCard_IconCircle({ title, value, unit, icon: Icon, color, description }) {
  const colors = {
    blue: { circle: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-300' },
    emerald: { circle: 'bg-emerald-100', text: 'text-emerald-600' },
    purple: { circle: 'bg-purple-100', text: 'text-purple-600' }
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-bold uppercase text-slate-600">{title}</p>
        </div>
        {Icon && (
          <div className={`${colors[color].circle} p-3 rounded-full`}>
            <Icon className={`w-6 h-6 ${colors[color].text}`} />
          </div>
        )}
      </div>
      <p className="text-4xl font-bold text-slate-900 mb-1">{value}</p>
      {unit && <p className="text-sm text-slate-600">{unit}</p>}
    </div>
  );
}

// DESIGN OPTION 13: Floating Card
export function StatsCard_Floating({ title, value, unit, icon: Icon, color, description }) {
  const colors = {
    blue: { from: 'from-blue-500', to: 'to-blue-600', light: 'from-blue-50', light2: 'to-blue-50' },
    emerald: { from: 'from-emerald-500', to: 'to-emerald-600', light: 'from-emerald-50', light2: 'to-emerald-50' },
    purple: { from: 'from-purple-500', to: 'to-purple-600', light: 'from-purple-50', light2: 'to-purple-50' }
  };

  return (
    <div className={`relative rounded-3xl bg-gradient-to-br ${colors[color].light} ${colors[color].light2} p-7 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300`}>
      <div className="flex items-center justify-between mb-4">
        {Icon && <Icon className="w-6 h-6 text-slate-600" />}
        <p className="text-xs font-bold uppercase text-slate-600">{title}</p>
      </div>
      <p className="text-4xl font-bold text-slate-900 mb-1">{value}</p>
      {unit && <p className="text-sm text-slate-600">{unit}</p>}
    </div>
  );
}

// DESIGN OPTION 14: Gradient Border
export function StatsCard_GradientBorder({ title, value, unit, icon: Icon, color, description }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    emerald: 'from-emerald-500 to-emerald-600',
    purple: 'from-purple-500 to-purple-600'
  };

  return (
    <div className={`relative rounded-2xl p-[2px] bg-gradient-to-r ${colors[color]} hover:shadow-lg transition-all duration-300`}>
      <div className="bg-white rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          {Icon && <Icon className="w-6 h-6 text-slate-600" />}
          <p className="text-xs font-bold uppercase text-slate-600">{title}</p>
        </div>
        <p className="text-4xl font-bold text-slate-900 mb-1">{value}</p>
        {unit && <p className="text-sm text-slate-600">{unit}</p>}
      </div>
    </div>
  );
}

// DESIGN OPTION 15: Side Icon Design
export function StatsCard_SideIcon({ title, value, unit, icon: Icon, color, description }) {
  const colors = {
    blue: { bg: 'bg-slate-700 dark:bg-slate-600' },
    emerald: { bg: 'bg-emerald-600' },
    purple: { bg: 'bg-purple-600' }
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="flex items-stretch">
        <div className={`${colors[color].bg} w-1/5 flex items-center justify-center`}>
          {Icon && <Icon className="w-8 h-8 text-white" />}
        </div>
        <div className="flex-1 p-6">
          <p className="text-xs font-bold uppercase text-slate-600">{title}</p>
          <p className="text-4xl font-bold text-slate-900 mt-2 mb-1">{value}</p>
          {unit && <p className="text-sm text-slate-600">{unit}</p>}
        </div>
      </div>
    </div>
  );
}

// DESIGN OPTION 16: Curved Top Design
export function StatsCard_CurvedTop({ title, value, unit, icon: Icon, color, description }) {
  const colors = {
    blue: { from: 'from-blue-500', to: 'to-blue-600' },
    emerald: { from: 'from-emerald-500', to: 'to-emerald-600' },
    purple: { from: 'from-purple-500', to: 'to-purple-600' }
  };

  return (
    <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className={`bg-gradient-to-r ${colors[color].from} ${colors[color].to} py-8 px-6 relative`}>
        <svg className="absolute bottom-0 left-0 w-full" height="40" viewBox="0 0 1000 100" preserveAspectRatio="none">
          <path d="M0,50 Q250,0 500,50 T1000,50 L1000,100 L0,100 Z" fill="white" />
        </svg>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            {Icon && <Icon className="w-7 h-7 text-white" />}
            <p className="text-xs font-bold uppercase text-white opacity-80">{title}</p>
          </div>
        </div>
      </div>
      <div className="p-6 pt-8">
        <p className="text-4xl font-bold text-slate-900 mb-1">{value}</p>
        {unit && <p className="text-sm text-slate-600">{unit}</p>}
      </div>
    </div>
  );
}

// DESIGN OPTION 17: Solid Gradient
export function StatsCard_SolidGradient({ title, value, unit, icon: Icon, color, description }) {
  const colors = {
    blue: 'bg-gradient-to-br from-blue-400 to-blue-700',
    emerald: 'bg-gradient-to-br from-emerald-400 to-emerald-700',
    purple: 'bg-gradient-to-br from-purple-400 to-purple-700'
  };

  return (
    <div className={`${colors[color]} rounded-2xl p-7 text-white hover:shadow-xl transition-all duration-300 hover:scale-105`}>
      <div className="flex items-center justify-between mb-4">
        {Icon && <Icon className="w-6 h-6 opacity-90" />}
        <p className="text-xs font-bold uppercase opacity-80">{title}</p>
      </div>
      <p className="text-4xl font-bold mb-1">{value}</p>
      {unit && <p className="text-sm opacity-90">{unit}</p>}
    </div>
  );
}

// DESIGN OPTION 18: Dot Pattern Design
export function StatsCard_DotPattern({ title, value, unit, icon: Icon, color, description }) {
  const colors = {
    blue: { bg: 'bg-slate-50 dark:bg-slate-800', dot: 'bg-blue-400' },
    emerald: { bg: 'bg-emerald-50', dot: 'bg-emerald-400' },
    purple: { bg: 'bg-purple-50', dot: 'bg-purple-400' }
  };

  return (
    <div className={`${colors[color].bg} rounded-3xl p-7 hover:shadow-lg transition-all duration-300 relative overflow-hidden`}>
      <div className="absolute top-0 right-0">
        <div className="flex gap-2 p-4 opacity-20">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`${colors[color].dot} w-3 h-3 rounded-full`}></div>
          ))}
        </div>
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          {Icon && <Icon className="w-6 h-6 text-slate-600" />}
          <p className="text-xs font-bold uppercase text-slate-600">{title}</p>
        </div>
        <p className="text-4xl font-bold text-slate-900 mb-1">{value}</p>
        {unit && <p className="text-sm text-slate-600">{unit}</p>}
      </div>
    </div>
  );
}
