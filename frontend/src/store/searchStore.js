import { create } from 'zustand';

const useSearchStore = create((set) => ({
  searchQuery: '',
  searchFilter: 'all',
  searchResults: [],
  isSearching: false,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchFilter: (filter) => set({ searchFilter: filter }),
  setSearchResults: (results) => set({ searchResults: results }),
  setIsSearching: (isSearching) => set({ isSearching }),

  clearSearch: () => set({
    searchQuery: '',
    searchFilter: 'all',
    searchResults: [],
    isSearching: false,
  }),
}));

export default useSearchStore;
