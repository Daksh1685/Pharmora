'use client';

import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const CategoryStatistics = ({ medicines, categories }) => {
  // Calculate statistics for each category
  const statistics = useMemo(() => {
    return categories.map(category => {
      // Handle both ObjectId references and strings
      const categoryId = category._id || category.id;
      const categoryName = category.name;
      
      const categoryMedicines = medicines.filter(m => {
        // If m.category is an object (populated), compare IDs
        if (typeof m.category === 'object' && m.category !== null) {
          return m.category._id === categoryId || m.category.name === categoryName;
        }
        // If m.category is a string, compare with name
        return m.category === categoryName;
      });
      
      const totalStockValue = categoryMedicines.reduce((sum, m) => sum + (m.quantity * m.price), 0);
      const medicineCount = categoryMedicines.length;
      const avgPrice = medicineCount > 0 ? categoryMedicines.reduce((sum, m) => sum + m.price, 0) / medicineCount : 0;
      const lowStockCount = categoryMedicines.filter(m => m.quantity > 0 && m.quantity < 20).length;
      const outOfStockCount = categoryMedicines.filter(m => m.quantity === 0).length;

      return {
        name: categoryName,
        totalStockValue,
        medicineCount,
        avgPrice: Math.round(avgPrice * 100) / 100,
        lowStockCount,
        outOfStockCount,
        activeCount: medicineCount - lowStockCount - outOfStockCount,
      };
    });
  }, [medicines, categories]);

  // Prepare data for donut chart (stock value by category)
  const donutData = useMemo(() => {
    if (statistics.length === 0) return [];

    // Show all categories - including those with 0 value
    // This ensures new categories appear in the legend even with no medicines
    return statistics.map(stat => ({
      name: stat.name,
      value: Math.round(stat.totalStockValue) || 0.1, // Use 0.1 minimum so chart can display
    }));
  }, [statistics]);

  const COLORS = [
    // Soft, light English-style colors - sophisticated pastels
    '#a7d8d8', // Soft Mint
    '#87ceeb', // Light Sky Blue
    '#f5deb3', // Wheat
    '#dda0dd', // Plum (Light)
    '#b0c4de', // Light Steel Blue
    '#f0a8ba', // Light Pink
    '#a8d5ba', // Soft Green
    '#ffb366', // Light Orange
    '#c8a2d0', // Soft Lavender
    '#ffc0cb', // Light Pink
    '#b4d7f0', // Powder Blue
    '#d4e4d0', // Pale Green
  ];

  if (statistics.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Donut Chart Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-lg border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 p-6 sm:p-8 lg:p-10 transition-all duration-300 ease-out">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Stock Value Distribution</h2>

        {/* Donut Chart */}
        <div className="w-full h-80 flex justify-center bg-gradient-to-b from-slate-50 dark:from-slate-700 to-white dark:to-slate-800 rounded-lg p-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={110}
                paddingAngle={2.5}
                dataKey="value"
                animationDuration={600}
              >
                {donutData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    opacity={0.9}
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  border: '2px solid #a7d8d8',
                  borderRadius: '8px',
                  color: '#f1f5f9',
                  padding: '8px 12px',
                  boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)'
                }}
              />
              <Legend 
                verticalAlign="bottom"
                height={40}
                wrapperStyle={{ paddingTop: '16px' }}
                formatter={(value, entry) => `${entry.payload.name}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-4">
          Showing total stock value (₹) distribution across all categories
        </p>
      </div>

      {/* Statistics Table Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-lg border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 p-6 sm:p-8 lg:p-10 transition-all duration-300 ease-out">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Detailed Category Statistics</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700">
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Category</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">Total Medicines</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">Stock Value</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">Avg Price</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">Active</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">Low Stock</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">Out of Stock</th>
              </tr>
            </thead>
            <tbody>
              {statistics.map((stat, idx) => (
                <tr 
                  key={stat.name} 
                  className={`border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                    idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-700/30'
                  }`}
                >
                  <td className="px-4 py-4 text-sm font-medium text-slate-900 dark:text-white">
                    {stat.name}
                  </td>
                  <td className="px-4 py-4 text-right text-sm text-slate-700 dark:text-slate-300">
                    {stat.medicineCount}
                  </td>
                  <td className="px-4 py-4 text-right text-sm text-slate-700 dark:text-slate-300">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200">
                      ₹{(stat.totalStockValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right text-sm text-slate-700 dark:text-slate-300">
                    ₹{stat.avgPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-200">
                      {stat.activeCount}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200">
                      {stat.lowStockCount}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-200">
                      {stat.outOfStockCount}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-600">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{statistics.length}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Total Categories</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{medicines.length}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Total Medicines</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-700 dark:text-slate-300 dark:text-blue-400">
              ₹{(statistics.reduce((sum, s) => sum + s.totalStockValue, 0)).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Total Stock Value</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              ₹{(statistics.reduce((sum, s) => sum + s.avgPrice, 0) / statistics.length).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Avg Category Price</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryStatistics;
