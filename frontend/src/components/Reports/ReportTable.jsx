'use client';

export default function ReportTable({ 
  data = [], 
  columns = [],
  loading,
  emptyMessage = 'No data available'
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-12 bg-slate-200 rounded animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-slate-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-6 py-3 text-left text-sm font-semibold text-slate-700 ${
                  col.align === 'right' ? 'text-right' : ''
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={row.id || idx}
              className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
            >
              {columns.map((col) => (
                <td
                  key={`${row.id}-${col.key}`}
                  className={`px-6 py-4 text-sm text-slate-900 ${
                    col.align === 'right' ? 'text-right' : ''
                  }`}
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary Footer */}
      {data.length > 0 && (
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-700">
              Total Records: {data.length}
            </span>
            {data[0] && typeof data[0].amount === 'number' && (
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Total: ₹
                {data
                  .reduce((sum, row) => sum + (row.amount || 0), 0)
                  .toFixed(2)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
