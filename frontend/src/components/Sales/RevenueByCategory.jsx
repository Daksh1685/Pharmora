'use client';

import { useState } from 'react';

export default function RevenueByCategory({ data = {} }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  
  const { total = '₹0', items = [] } = data;
  
  // Calculate percentages from real data
  const processedItems = items.map(item => ({
    ...item,
    percentage: item.value || 0
  }));
  
  const totalAmount = processedItems.reduce((sum, item) => sum + (item.percentage || 0), 0);
  const itemsWithPercentage = processedItems.map(item => ({
    ...item,
    percent: totalAmount > 0 ? Math.round((item.percentage / totalAmount) * 100) : 0
  }));

  // SVG dimensions - LARGER FOR BETTER VISIBILITY
  const size = 420;
  const center = size / 2;
  const radius = 90;
  const donutWidth = 24;

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
    const labelRadius = radius + 20;
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
    <div className="bg-slate-50 dark:bg-slate-800 dark:bg-blue-900/20 rounded-2xl p-4 border border-slate-100 dark:border-blue-900/40 shadow-lg hover:shadow-xl transition-all duration-300 h-fit flex flex-col">
      {/* Header */}
      <div className="mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Revenue by Category</h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Sales breakdown by medicine category</p>
      </div>

      {/* Chart and Legend Container */}
      <div className="flex flex-col gap-0.5 flex-1">
        {/* Chart Container - TOP */}
        <div className="flex justify-center items-center">
          <svg
            width="420"
            height="420"
            viewBox={`0 0 ${size} ${size}`}
            preserveAspectRatio="xMidYMid meet"
            className="drop-shadow-sm"
          >
            {/* Glow effect for segments */}
            <defs>
              <filter id="glow-revenue">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
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
                filter={hoveredIndex === null || hoveredIndex === idx ? 'url(#glow-revenue)' : ''}
              >
                {/* Segment path */}
                <path
                  d={segment.path}
                  fill={segment.darkColor}
                  stroke="white"
                  strokeWidth="5"
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
              fill="white"
              stroke="none"
              className="dark:fill-slate-700"
            />

            {/* Center text */}
            <text
              x={center}
              y={center - 15}
              textAnchor="middle"
              className="text-xs fill-slate-500 dark:fill-slate-400"
              fontSize="14"
              fontWeight="500"
            >
              Total Revenue
            </text>
            <text
              x={center}
              y={center + 25}
              textAnchor="middle"
              className="text-2xl font-bold fill-slate-900 dark:fill-white"
              fontSize="36"
              fontWeight="700"
            >
              {total}
            </text>

            {/* Percentage labels */}
            {segments.map((segment, idx) => {
              const textAnchor = segment.labelX > center ? 'start' : 'end';
              
              return (
                <g
                  key={`label-${idx}`}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="cursor-pointer"
                >
                  {/* Percentage text */}
                  <text
                    x={segment.labelX}
                    y={segment.labelY + 6}
                    textAnchor={textAnchor}
                    className="font-bold fill-slate-900 dark:fill-white pointer-events-none"
                    fontSize="15"
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

            {/* Hover tooltip - Category name and revenue */}
            {hoveredIndex !== null && (
              <g>
                {/* Tooltip background */}
                <rect
                  x={center - 70}
                  y={center - 60}
                  width="140"
                  height="50"
                  rx="8"
                  fill="white"
                  stroke={segments[hoveredIndex].darkColor}
                  strokeWidth="2"
                  filter="drop-shadow(0 2px 8px rgba(0,0,0,0.15))"
                  className="dark:fill-slate-700 dark:stroke-current"
                />
                {/* Category name */}
                <text
                  x={center}
                  y={center - 40}
                  textAnchor="middle"
                  className="font-bold fill-slate-900 dark:fill-white"
                  fontSize="14"
                  fontWeight="700"
                >
                  {segments[hoveredIndex].label}
                </text>
                {/* Revenue amount */}
                <text
                  x={center}
                  y={center - 20}
                  textAnchor="middle"
                  className="font-semibold fill-slate-600 dark:fill-slate-300"
                  fontSize="13"
                >
                  ₹{Math.round(segments[hoveredIndex].value / 1000)}K
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Legend - BOTTOM - COMPACT GRID WITH SCROLLING */}
        <div className="flex flex-col gap-1.5 border-t border-slate-200 dark:border-slate-700 pt-1">
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-2">
            {itemsWithPercentage.map((item, idx) => (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setHoveredIndex(hoveredIndex === idx ? null : idx)}
                className={`p-2 rounded-lg transition-all duration-300 cursor-pointer border ${
                  hoveredIndex === idx 
                    ? 'border-slate-900 dark:border-slate-500 bg-white dark:bg-slate-700 shadow-md' 
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 ring-1.5"
                    style={{
                      backgroundColor: item.darkColor,
                      boxShadow: hoveredIndex === idx ? `0 0 6px ${item.darkColor}88` : 'none',
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {item.label}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      ₹{Math.round(item.value / 1000)}K
                    </p>
                  </div>
                  <span className="text-xs font-bold text-white bg-slate-500 dark:bg-slate-600 px-1 py-0.5 rounded text-center">
                    {item.percent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
