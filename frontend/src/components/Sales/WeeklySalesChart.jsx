'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export default function WeeklySalesChart({ salesData = [] }) {
  const [chartData, setChartData] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (Array.isArray(salesData) && salesData.length > 0) {
      setChartData(salesData);
      // Set default to first item with sales
      const itemWithSales = salesData.find(d => d.amount > 0);
      setSelectedDay(itemWithSales ? itemWithSales.day : salesData[0].day);
    }
  }, [salesData]);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white px-4 py-2 rounded-lg shadow-xl border border-orange-500">
          <p className="font-bold text-sm">₹{payload[0].value.toLocaleString('en-IN')}</p>
        </div>
      );
    }
    return null;
  };

  const handleBarClick = (data) => {
    setSelectedDay(data.day);
  };

  return (
    <div className="w-full h-full flex flex-col gap-2">
      <div className="flex-1 flex flex-col min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 30, right: 40, left: 10, bottom: 30 }}
            style={{ backgroundColor: 'transparent' }}
          >
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.9} />
              </linearGradient>
              <linearGradient id="colorSelected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff8c42" stopOpacity={1} />
                <stop offset="95%" stopColor="#ff6b35" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDarkMode ? '#475569' : '#e2e8f0'}
              vertical={false}
              opacity={0.5}
            />
            <XAxis
              dataKey="day"
              stroke={isDarkMode ? '#94a3b8' : '#64748b'}
              style={{ fontSize: '13px', fontWeight: '600', fill: isDarkMode ? '#cbd5e1' : '#64748b' }}
              axisLine={{ stroke: isDarkMode ? '#475569' : '#cbd5e1' }}
              tickLine={false}
              height={40}
            />
            <YAxis
              stroke={isDarkMode ? '#94a3b8' : '#64748b'}
              style={{ fontSize: '13px', fontWeight: '500', fill: isDarkMode ? '#cbd5e1' : '#64748b' }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
              width={50}
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${Math.round(value / 1000)}K`;
                return '0';
              }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 193, 7, 0.1)' }} />
            <Bar
              dataKey="amount"
              fill="url(#colorSales)"
              radius={[10, 10, 0, 0]}
              onClick={handleBarClick}
              style={{ cursor: 'pointer' }}
              animationDuration={500}
              animationEasing="ease-in-out"
              minPointSize={3}
              maxBarSize={80}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={selectedDay === entry.day ? 'url(#colorSelected)' : entry.amount > 0 ? 'url(#colorSales)' : '#cbd5e1'}
                  style={{
                    transition: 'all 0.3s ease-in-out',
                    filter: selectedDay === entry.day ? 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.25))' : 'none',
                  }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex gap-8 justify-center text-sm text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-gradient-to-b from-orange-500 to-orange-600"></div>
          <span className="font-semibold">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-gradient-to-b from-amber-400 to-amber-500"></div>
          <span className="font-semibold">Sales</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-slate-400"></div>
          <span className="font-semibold">No Sales</span>
        </div>
      </div>
    </div>
  );
}
