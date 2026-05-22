import { create } from 'zustand';
import apiClient from '@/utils/apiClient';

const useMedicineStore = create((set) => ({
  medicines: [],
  isLoading: false,
  error: null,
  filters: {
    search: '',
    status: 'all',
    sortBy: 'name',
  },

  setMedicines: (medicines) => set({ medicines }),
  addMedicine: (medicine) => set((state) => ({ medicines: [...state.medicines, medicine] })),
  updateMedicine: (id, updates) =>
    set((state) => ({
      medicines: state.medicines.map((m) => (m._id === id ? { ...m, ...updates } : m)),
    })),
  removeMedicine: (id) => set((state) => ({ medicines: state.medicines.filter((m) => m._id !== id) })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  clearError: () => set({ error: null }),
  
  fetchMedicines: async () => {
    try {
      set({ isLoading: true });
      const response = await apiClient.get('/medicines?limit=1000');
      // API returns: { success, data: { medicines: [...], pagination: {...} } }
      const medicinesData = response.data?.data?.medicines || response.data?.data || response.data || [];
      const medicinesArray = Array.isArray(medicinesData) ? medicinesData : [];
      set({ medicines: medicinesArray, error: null });
      return medicinesArray;
    } catch (error) {
      console.error('Failed to fetch medicines:', error);
      set({ error: error.message });
      return [];
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useMedicineStore;
