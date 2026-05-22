'use client';

import { IconTrash, IconPackage, IconUser, IconCalendar } from '@tabler/icons-react';

export default function PurchaseTable({
  purchases = [],
  medicines = {},
  loading,
  onDelete,
}) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
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

  if (!purchases || purchases.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <IconPackage size={40} className="mx-auto text-slate-400 mb-3" />
        <p className="text-slate-600 dark:text-slate-400">No purchases recorded yet.</p>
        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Add a purchase to see it here.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
              Date
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
              Supplier
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
              Medicine(s)
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
            <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {purchases.map((purchase) => {
            // Handle both old format (purchase.medicineId) and new format (purchase.medicines[])
            const firstMedicine = purchase.medicines?.[0];
            const medicineName = firstMedicine?.medicineName 
              || firstMedicine?.medicineId?.name
              || medicines[purchase.medicineId]?.name 
              || 'Unknown Medicine';
            const quantity = firstMedicine?.quantity ?? purchase.quantity ?? 0;
            const unitPrice = firstMedicine?.purchasePrice ?? purchase.price ?? 0;
            const totalAmount = purchase.totalAmount ?? (unitPrice * quantity);

            return (
              <tr
                key={purchase._id || purchase.id}
                className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-300">
                  {formatDate(purchase.createdAt || purchase.date)}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    <IconUser size={14} className="text-slate-400" />
                    {purchase.supplierName || purchase.supplier || 'Unknown Supplier'}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-300">
                  <div>
                    {medicineName}
                    {purchase.medicines?.length > 1 && (
                      <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                        +{purchase.medicines.length - 1} more
                      </span>
                    )}
                  </div>
                  {firstMedicine?.batchNumber && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Batch: {firstMedicine.batchNumber}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-right">
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-xs font-medium">
                    {quantity}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-right text-slate-900 dark:text-slate-300">
                  ₹{Number(unitPrice).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-right font-semibold text-slate-700 dark:text-slate-300 dark:text-blue-400">
                  ₹{Number(totalAmount).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => onDelete(purchase._id || purchase.id)}
                    className="p-2 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors inline-flex items-center justify-center"
                    title="Delete"
                  >
                    <IconTrash size={18} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
