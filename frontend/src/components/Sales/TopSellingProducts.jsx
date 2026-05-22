'use client';

import { useMemo } from 'react';

export default function TopSellingProducts({ sales, medicines }) {
  // Calculate top selling products from sales data
  const topProducts = useMemo(() => {
    if (!sales || sales.length === 0) return [];

    // Group sales by medicine ID
    const productMap = {};
    sales.forEach(sale => {
      const medicineId = sale.medicineId;
      if (!productMap[medicineId]) {
        productMap[medicineId] = {
          medicineId,
          totalQuantity: 0,
          totalRevenue: 0,
          saleCount: 0,
          medicineName: sale.medicineName || 'Unknown',
          unitPrice: sale.unitPrice || 0,
        };
      }
      productMap[medicineId].totalQuantity += sale.quantity || 0;
      productMap[medicineId].totalRevenue += (sale.unitPrice * sale.quantity) || 0;
      productMap[medicineId].saleCount += 1;
    });

    // Convert to array and sort by total revenue
    return Object.values(productMap)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5); // Top 5
  }, [sales]);

  if (!topProducts || topProducts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-6">Top Selling Products</h2>
        <p className="text-slate-500 text-center py-8">No sales data available</p>
      </div>
    );
  }

  // Calculate max values for scaling
  const maxRevenue = Math.max(...topProducts.map(p => p.totalRevenue));
  const maxQuantity = Math.max(...topProducts.map(p => p.totalQuantity));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-all duration-300">
      <h2 className="text-lg font-bold text-slate-900 mb-6">Top Selling Products</h2>

      <div className="space-y-4">
        {topProducts.map((product, index) => {
          const revenuePercentage = (product.totalRevenue / maxRevenue) * 100;
          const quantityPercentage = (product.totalQuantity / maxQuantity) * 100;

          return (
            <div key={`product-${product.medicineId}-${index}`} className="group">
              {/* Product header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 rounded-full w-6 h-6 flex items-center justify-center">
                      {index + 1}
                    </span>
                    <h3 className="font-semibold text-slate-900 truncate">
                      {product.medicineName}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    {product.saleCount} transaction{product.saleCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">₹{product.totalRevenue.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-slate-500">{product.totalQuantity} units</p>
                </div>
              </div>

              {/* Revenue progress bar */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-600 font-medium">Revenue</span>
                  <span className="text-xs text-slate-500">{revenuePercentage.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 group-hover:from-blue-600 group-hover:to-blue-700"
                    style={{ width: `${revenuePercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Quantity progress bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-600 font-medium">Units Sold</span>
                  <span className="text-xs text-slate-500">{quantityPercentage.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500 group-hover:from-emerald-600 group-hover:to-emerald-700"
                    style={{ width: `${quantityPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200">
        <div className="text-center">
          <p className="text-xs text-slate-600 mb-1">Total Revenue</p>
          <p className="font-bold text-slate-900">
            ₹{topProducts.reduce((sum, p) => sum + p.totalRevenue, 0).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-600 mb-1">Total Units</p>
          <p className="font-bold text-slate-900">
            {topProducts.reduce((sum, p) => sum + p.totalQuantity, 0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-600 mb-1">Avg Per Product</p>
          <p className="font-bold text-slate-900">
            ₹{Math.floor(topProducts.reduce((sum, p) => sum + p.totalRevenue, 0) / topProducts.length).toLocaleString('en-IN')}
          </p>
        </div>
      </div>
    </div>
  );
}
