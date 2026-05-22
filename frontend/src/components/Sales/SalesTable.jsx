'use client';

import { IconTrash, IconEdit } from '@tabler/icons-react';
import Button from '@/components/Common/Button';

export default function SalesTable({
  sales = [],
  medicines = {},
  loading,
  onDelete,
  onEdit,
}) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!sales || sales.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <p className="text-slate-600 dark:text-slate-400">No sales recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
              Date
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
              Medicine
            </th>
            <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">
              Quantity
            </th>
            <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">
              Unit Price
            </th>
            <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">
              Total Amount
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
              Notes
            </th>
            <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => {
            // Handle both old format (single medicine) and new format (multiple medicines per sale)
            const medicines_list = sale.medicines && sale.medicines.length > 0 
              ? sale.medicines 
              : [{
                  medicineId: sale.medicineId,
                  medicineName: medicines[sale.medicineId]?.name || 'Unknown Medicine',
                  quantity: sale.quantity,
                  price: sale.unitPrice,
                  subtotal: sale.unitPrice * sale.quantity
                }];

            return (
              <tr
                key={sale._id || sale.id}
                className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                  {formatDate(sale.createdAt || sale.date)}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                  <div className="space-y-1">
                    {medicines_list.map((med, idx) => (
                      <div key={idx} className="text-xs">
                        {med.medicineName || med.medicineId?.name || 'Unknown Medicine'}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-right text-slate-900 dark:text-white">
                  <div className="space-y-1">
                    {medicines_list.map((med, idx) => (
                      <span key={idx} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium block">
                        {med.quantity}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-right text-slate-900 dark:text-white">
                  <div className="space-y-1">
                    {medicines_list.map((med, idx) => (
                      <div key={idx} className="text-xs">
                        ₹{(med.price || 0).toFixed(2)}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-right font-semibold text-emerald-600 dark:text-emerald-400">
                  ₹{(sale.totalAmount || medicines_list.reduce((sum, m) => sum + (m.subtotal || 0), 0)).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 max-w-xs">
                  {sale.notes || '-'}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(sale._id || sale.id)}
                        className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-blue-900/20 rounded-lg transition-colors inline-flex items-center justify-center"
                        title="Edit"
                      >
                        <IconEdit size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(sale._id || sale.id)}
                      className="p-2 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors inline-flex items-center justify-center"
                      title="Delete"
                    >
                      <IconTrash size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
