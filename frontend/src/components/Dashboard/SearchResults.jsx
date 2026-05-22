'use client';

import useSearchStore from '@/store/searchStore';
import { IconX } from '@tabler/icons-react';

export default function SearchResults() {
  const searchResults = useSearchStore((state) => state.searchResults);
  const searchQuery = useSearchStore((state) => state.searchQuery);
  const clearSearch = useSearchStore((state) => state.clearSearch);

  if (!searchQuery || searchResults.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Search Results ({searchResults.length})
        </h2>
        <button
          onClick={clearSearch}
          className="p-1 hover:bg-blue-200/40 rounded-lg transition-colors"
        >
          <IconX size={20} className="text-slate-600" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {searchResults.map((result, index) => (
          <div
            key={index}
            className="bg-white rounded-lg border border-slate-300 dark:border-slate-600 p-4 hover:shadow-md transition-shadow"
          >
            {result.type === 'medicine' && (
              <>
                <h3 className="font-semibold text-slate-900 mb-2">{result.name}</h3>
                <p className="text-xs text-slate-600 mb-3">
                  {result.genericName && <>Generic: {result.genericName}</>}
                </p>
                <div className="space-y-1 text-sm">
                  {result.manufacturer && (
                    <p className="text-slate-600">
                      <span className="font-medium">Manufacturer:</span> {result.manufacturer}
                    </p>
                  )}
                  {result.quantity !== undefined && (
                    <p className={`font-medium ${result.quantity <= 20 ? 'text-red-600' : 'text-green-600'}`}>
                      Stock: {result.quantity}
                    </p>
                  )}
                  {result.price && (
                    <p className="text-slate-600">
                      <span className="font-medium">Price:</span> ₹{result.price}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
