'use client';

import { useState } from 'react';
import { IconChevronDown, IconChevronUp, IconTrash } from '@tabler/icons-react';
import Button from '@/components/Common/Button';

export default function BatchTable({ 
  batches = [], 
  medicines = {},
  loading,
  onDelete 
}) {
  const [expandedMedicine, setExpandedMedicine] = useState(null);

  const isExpiringsoon = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  };

  // Group batches by medicine
  const batchesByMedicine = batches.reduce((acc, batch) => {
    if (!acc[batch.medicineId]) {
      acc[batch.medicineId] = [];
    }
    acc[batch.medicineId].push(batch);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-16 bg-slate-200 rounded animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!batches || batches.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-slate-600">No batches found. Add one to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {Object.entries(batchesByMedicine).map(([medicineId, medicineBatches]) => {
        const medicineName = medicines[medicineId]?.name || `Medicine ${medicineId}`;
        const isExpanded = expandedMedicine === medicineId;
        const totalQuantity = medicineBatches.reduce((sum, b) => sum + parseInt(b.quantity), 0);

        return (
          <div key={medicineId} className="border border-slate-200 rounded-lg overflow-hidden">
            {/* Header Row */}
            <button
              onClick={() =>
                setExpandedMedicine(isExpanded ? null : medicineId)
              }
              className="w-full px-6 py-4 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-4 flex-1 text-left">
                <div className={isExpanded ? 'text-slate-700 dark:text-slate-300' : 'text-slate-600'}>
                  {isExpanded ? (
                    <IconChevronUp size={20} />
                  ) : (
                    <IconChevronDown size={20} />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{medicineName}</p>
                  <p className="text-sm text-slate-600">
                    {medicineBatches.length} batch{medicineBatches.length !== 1 ? 'es' : ''} • {totalQuantity} units
                  </p>
                </div>
              </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t border-slate-200">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">
                        Batch No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">
                        Mfg Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">
                        Expiry Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">
                        Status
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicineBatches.map((batch) => {
                      const expired = isExpired(batch.expiryDate);
                      const expiringsoon = isExpiringsoon(batch.expiryDate);
                      const daysLeft = getDaysUntilExpiry(batch.expiryDate);

                      return (
                        <tr
                          key={batch.id}
                          className={`border-t border-slate-200 hover:bg-slate-50 transition-colors ${
                            expired
                              ? 'bg-red-50'
                              : expiringsoon
                              ? 'bg-amber-50'
                              : ''
                          }`}
                        >
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">
                            {batch.batchNo}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-900">
                            {batch.quantity}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {formatDate(batch.mfgDate)}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-900">
                            {formatDate(batch.expiryDate)}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {expired ? (
                              <span className="inline-block px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                                Expired
                              </span>
                            ) : expiringsoon ? (
                              <span className="inline-block px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                                Expiring in {daysLeft} days
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                Active
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => onDelete(batch.id)}
                              className="p-2 text-slate-600 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center justify-center"
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
            )}
          </div>
        );
      })}
    </div>
  );
}
