'use client';

import { useState, useEffect } from 'react';

export default function BarChart({ data = {}, showHeader = true }) {
  const [selectedDay, setSelectedDay] = useState(null);

  const { days = [
    { day: 'Mon', value: 0, amount: '₹0' },
    { day: 'Tue', value: 0, amount: '₹0' },
    { day: 'Wed', value: 0, amount: '₹0' },
    { day: 'Thu', value: 0, amount: '₹0' },
    { day: 'Fri', value: 0, amount: '₹0' },
    { day: 'Sat', value: 0, amount: '₹0' },
    { day: 'Sun', value: 0, amount: '₹0' },
  ] } = data;

  // Use all 7 days of data (Monday-Sunday)
  const chartDays = (Array.isArray(days) && days.length > 0) ? days : [
    { day: 'Mon', value: 0, amount: '₹0' },
    { day: 'Tue', value: 0, amount: '₹0' },
    { day: 'Wed', value: 0, amount: '₹0' },
    { day: 'Thu', value: 0, amount: '₹0' },
    { day: 'Fri', value: 0, amount: '₹0' },
    { day: 'Sat', value: 0, amount: '₹0' },
    { day: 'Sun', value: 0, amount: '₹0' },
  ];

  // Set initial selected day to first day with data
  useEffect(() => {
    if (chartDays.length > 0 && !selectedDay) {
      setSelectedDay(chartDays[chartDays.length - 1].day); // Select last day (most recent)
    }
  }, [chartDays, selectedDay]);

  const maxValue = Math.max(...chartDays.map(d => d.value || 0), 1);
  
  // Calculate dynamic Y-axis labels based on max value
  const generateYAxisLabels = (maxVal) => {
    if (maxVal === 0) return [0, 5, 10, 15, 30, 45];
    
    // Find the appropriate scale - ensure axisMax is GREATER than max value
    let axisMax;
    if (maxVal <= 50) {
      axisMax = 50;
    } else if (maxVal <= 100) {
      axisMax = 100;
    } else if (maxVal <= 200) {
      axisMax = 200;
    } else if (maxVal <= 300) {
      axisMax = 300;
    } else {
      axisMax = Math.ceil(maxVal / 50) * 50; // Round up to nearest 50
    }
    
    // Generate labels from 0 to axisMax
    const labels = [];
    const step = axisMax / 5; // 5 intervals
    for (let i = 0; i <= 5; i++) {
      labels.push(Math.round(i * step));
    }
    return labels;
  };

  const yAxisLabels = generateYAxisLabels(maxValue);
  const selectedData = chartDays.find(d => d.day === selectedDay) || chartDays[0];
  
  // Reverse labels for correct top-to-bottom display (highest at top)
  const reversedLabels = [...yAxisLabels].reverse();

  return (
    <div className={`rounded-2xl transition-all duration-300 flex flex-col w-full ${
      showHeader 
        ? 'bg-slate-50 dark:bg-slate-800 dark:bg-blue-900/20 border border-slate-100 dark:border-blue-900/40 shadow-sm hover:shadow-lg p-3 sm:p-4 md:p-5 h-full'
        : 'bg-transparent border-transparent p-0 h-auto'
    }`}>
      {/* Header - only show if showHeader is true */}
      {showHeader && (
        <div className="mb-2 sm:mb-3 md:mb-4">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-900 dark:text-white">Total Sales Overview</h3>
        </div>
      )}

      {/* Chart with Y-axis - Fixed height container */}
      <div className="flex gap-0 w-full" style={{ height: '420px' }}>
        {/* Y-axis labels section */}
        <div className="w-8 sm:w-10 md:w-12 flex flex-col justify-between text-xs text-slate-500 dark:text-slate-400 font-medium pb-6 relative flex-shrink-0">
          {reversedLabels.map((label, idx) => (
            <div key={idx} className="text-right pr-1 sm:pr-2 h-0 flex items-end leading-none">
              <span className="text-xs">{label}K</span>
            </div>
          ))}
        </div>

        {/* Chart Container */}
        <div className="flex-1 flex items-end justify-between gap-1 sm:gap-2 md:gap-3 px-1 relative overflow-hidden pb-6">
        {/* Bars container */}
          <div className="flex-1 flex items-end justify-between gap-1 sm:gap-2 md:gap-3 relative z-10 h-full overflow-hidden">
          {chartDays.map((item, idx) => {
            const hasValue = item.value && item.value > 0;
            const heightPercent = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            const displayHeight = hasValue ? Math.max(heightPercent, 8) : 12; // Show 12% minimum for zero days
            const isSelected = item.day === selectedDay;

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end relative cursor-pointer group"
                onClick={() => setSelectedDay(item.day)}
              >
                {/* Tooltip on hover - shows when hovering */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-slate-900 text-white text-xs font-semibold px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg shadow-lg whitespace-nowrap z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div className="font-medium text-xs">{item.day}</div>
                  <div className="font-bold text-xs sm:text-sm mt-0.5">{item.amount}</div>
                </div>

                {/* Bar */}
                <div className="w-full flex flex-col items-center justify-end flex-1">
                  <div
                    className={`w-full transition-all duration-200 relative group/bar flex flex-col items-center justify-end ${
                      isSelected
                        ? 'rounded-t-2xl shadow-lg ring-2 ring-orange-500 ring-offset-1 sm:ring-offset-2'
                        : 'rounded-t-xl hover:shadow-md'
                    }`}
                    style={{
                      height: `${displayHeight}%`,
                      background: isSelected
                        ? 'linear-gradient(180deg, #f97316 0%, #ea580c 100%)'
                        : hasValue ? 'linear-gradient(180deg, #fed7aa 0%, #fdba74 100%)' : 'linear-gradient(180deg, #f3f4f6 0%, #e5e7eb 100%)',
                      minHeight: hasValue ? '8px' : '4px',
                      opacity: hasValue ? 1 : 0.4
                    }}
                  >
                    {/* Amount label on bar for values > 0 */}
                    {hasValue && displayHeight > 20 && (
                      <div className="text-xs font-bold text-white drop-shadow-md mb-1">
                        {item.value}K
                      </div>
                    )}
                    
                    {/* Diagonal stripes only for selected */}
                    {isSelected && (
                      <div
                        className="absolute inset-0 rounded-t-2xl opacity-25"
                        style={{
                          background: 'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.6) 6px, rgba(255,255,255,0.6) 10px)',
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Day label - bold when selected */}
                <span className={`text-xs font-semibold transition-all leading-tight whitespace-nowrap ${
                  isSelected 
                    ? 'text-slate-900' 
                    : 'text-slate-600 group-hover:text-slate-900'
                }`}>
                  {item.day}
                </span>
              </div>
            );
          })}
          </div>
        </div>
      </div>
    </div>
  );
}
