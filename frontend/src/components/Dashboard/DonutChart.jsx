'use client';

import { useState } from 'react';

export default function DonutChart({ data = {} }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  
  const { total = '8K', items = [] } = data;
  
  // Calculate percentages from real data
  const processedItems = items.map(item => ({
    ...item,
    percentage: item.count || item.value || 0
  }));
  
  const totalCount = processedItems.reduce((sum, item) => sum + (item.percentage || 0), 0);
  const itemsWithPercentage = processedItems.map(item => ({
    ...item,
    percent: totalCount > 0 ? Math.round((item.percentage / totalCount) * 100) : 0
  }));

  // SVG dimensions - OPTIMIZED SIZE
  const size = 300;
  const center = size / 2;
  const radius = 65;
  const donutWidth = 18;

  // Generate path data for donut segments
  let currentAngle = -90; // Start from top

  const segments = itemsWithPercentage.map((item, idx) => {
    const sliceAngle = (item.percent / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    
    // Calculate positions for path
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const outerX1 = center + radius * Math.cos(startRad);
    const outerY1 = center + radius * Math.sin(startRad);
    const outerX2 = center + radius * Math.cos(endRad);
    const outerY2 = center + radius * Math.sin(endRad);
    
    const innerRadius = radius - donutWidth;
    const innerX1 = center + innerRadius * Math.cos(startRad);
    const innerY1 = center + innerRadius * Math.sin(startRad);
    const innerX2 = center + innerRadius * Math.cos(endRad);
    const innerY2 = center + innerRadius * Math.sin(endRad);
    
    const largeArc = sliceAngle > 180 ? 1 : 0;
    
    // Create SVG path
    const path = `
      M ${outerX1} ${outerY1}
      A ${radius} ${radius} 0 ${largeArc} 1 ${outerX2} ${outerY2}
      L ${innerX2} ${innerY2}
      A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerX1} ${innerY1}
      Z
    `;
    
    // Calculate label position - CLOSE TO DONUT SEGMENTS
    const midAngle = (startAngle + endAngle) / 2;
    const midRad = (midAngle * Math.PI) / 180;
    const labelRadius = radius + 15;
    const labelX = center + labelRadius * Math.cos(midRad);
    const labelY = center + labelRadius * Math.sin(midRad);
    
    // Line end position (on outer edge of donut)
    const lineRadius = radius + 5;
    const lineX = center + lineRadius * Math.cos(midRad);
    const lineY = center + lineRadius * Math.sin(midRad);
    
    currentAngle = endAngle;
    
    return {
      ...item,
      path,
      labelX,
      labelY,
      lineX,
      lineY,
      midAngle
    };
  });

  return (
    <div className="bg-slate-50 dark:bg-slate-800 dark:bg-blue-900/20 rounded-2xl p-3 sm:p-4 md:p-5 border border-slate-100 dark:border-blue-900/40 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col">
      {/* Header */}
      <div className="mb-2 sm:mb-3 md:mb-4 pb-0 border-b-0">
        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-900 dark:text-white">Graph Report</h3>
      </div>

      {/* Chart Container - COMPACT */}
      <div className="flex justify-center flex-1 py-1 overflow-hidden">
        <svg
          width="95%"
          height="100%"
          viewBox={`0 0 ${size} ${size}`}
          preserveAspectRatio="xMidYMid meet"
          className="drop-shadow-sm"
          style={{ maxWidth: '100%', maxHeight: '100%' }}
        >
          {/* Glow effect for segments */}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Donut segments */}
          {segments.map((segment, idx) => (
            <g
              key={`segment-${idx}`}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer transition-all duration-300"
              filter={hoveredIndex === null || hoveredIndex === idx ? 'url(#glow)' : ''}
            >
              {/* Segment path */}
              <path
                d={segment.path}
                fill={segment.color}
                stroke={typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? '#1e293b' : 'white'}
                strokeWidth="4"
                opacity={hoveredIndex === null || hoveredIndex === idx ? 1 : 0.4}
                className="transition-all duration-300"
              />
            </g>
          ))}

          {/* Center circle (white background for donut effect) */}
          <circle
            cx={center}
            cy={center}
            r={radius - donutWidth}
            fill={typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? '#1e293b' : 'white'}
            stroke="none"
          />

          {/* Center text */}
          <text
            x={center}
            y={center - 10}
            textAnchor="middle"
            className="text-xs"
            fill={typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b'}
            fontSize="11"
            fontWeight="400"
          >
            Total
          </text>
          <text
            x={center}
            y={center + 20}
            textAnchor="middle"
            className="text-2xl font-bold"
            fill={typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#1e293b'}
            fontSize="32"
            fontWeight="700"
          >
            {total}
          </text>

          {/* Percentage labels - NO LINES */}
          {segments.map((segment, idx) => {
            // Determine text anchor for proper alignment
            const textAnchor = segment.labelX > center ? 'start' : 'end';
            
            return (
              <g
                key={`label-${idx}`}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                {/* Percentage text only */}
                <text
                  x={segment.labelX}
                  y={segment.labelY + 5}
                  textAnchor={textAnchor}
                  className="font-bold pointer-events-none"
                  fill={typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#1e293b'}
                  fontSize="13"
                  fontWeight="700"
                  opacity={hoveredIndex === null || hoveredIndex === idx ? 1 : 0.3}
                  style={{ 
                    transition: 'opacity 300ms ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {segment.percent}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend - VERY COMPACT */}
      <div className="border-t border-slate-200/50 dark:border-slate-700/50 pt-1 mt-1 sm:pt-2 sm:mt-2">
        <div className="grid grid-cols-2 gap-1 sm:gap-2">
          {itemsWithPercentage.map((item, idx) => (
            <div
              key={idx}
              onClick={() => setHoveredIndex(hoveredIndex === idx ? null : idx)}
              className="flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-all duration-300 cursor-pointer group"
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0 transition-all duration-300 ring-1 ring-offset-0.5"
                style={{
                  backgroundColor: item.darkColor,
                  boxShadow: hoveredIndex === idx ? `0 0 6px ${item.darkColor}60` : 'none'
                }}
              />
              <div className="flex-1 min-w-0">
                <span className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors truncate">
                  {item.label}
                </span>
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors whitespace-nowrap flex-shrink-0">
                {item.percent}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
