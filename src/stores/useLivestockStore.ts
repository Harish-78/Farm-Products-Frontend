import { create } from 'zustand';
import { apiFetch } from '@/lib/api';

export interface LivestockBatch {
  id: number;
  animal_type: string;
  batch_name: string;
  current_count: number | string;
  mortality_count: number | string;
  avg_daily_feed_per_bird_grams: number | string;
  calculated_daily_feed_kg: number | string;
  notes: string | null;
  created_at: string;
}

interface LivestockState {
  batches: LivestockBatch[];
  loading: boolean;
  setBatches: (batches: LivestockBatch[]) => void;
  setLoading: (loading: boolean) => void;
  fetchBatches: () => Promise<void>;
  createBatch: (payload: {
    animal_type: string;
    batch_name: string;
    current_count: number;
    mortality_count: number;
    avg_daily_feed_per_bird_grams: number;
    notes: string;
  }) => Promise<void>;
  updateBatch: (
    id: number,
    payload: { current_count: number; mortality_count: number }
  ) => Promise<void>;
  deleteBatch: (id: number) => Promise<void>;
}

export const useLivestockStore = create<LivestockState>((set, get) => ({
  batches: [],
  loading: true,

  setBatches: (batches) => set({ batches }),
  setLoading: (loading) => set({ loading }),

  fetchBatches: async () => {
    set({ loading: true });
    try {
      const res = await apiFetch<{ success: boolean; livestock: LivestockBatch[] }>(
        '/farm/livestock'
      );
      set({ batches: res.livestock ?? [], loading: false });
    } catch {
      set({ batches: [], loading: false });
    }
  },

  createBatch: async (payload) => {
    await apiFetch('/farm/livestock', {
      method: 'POST',
      body: JSON.stringify({
        animal_type: payload.animal_type,
        batch_name: payload.batch_name,
        current_count: Number(payload.current_count),
        mortality_count: Number(payload.mortality_count),
        avg_daily_feed_per_bird_grams: Number(payload.avg_daily_feed_per_bird_grams),
        notes: payload.notes,
      }),
    });
    await get().fetchBatches();
  },

  updateBatch: async (id, payload) => {
    await apiFetch(`/farm/livestock/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        current_count: Number(payload.current_count),
        mortality_count: Number(payload.mortality_count),
      }),
    });
    await get().fetchBatches();
  },

  deleteBatch: async (id) => {
    await apiFetch(`/farm/livestock/${id}`, { method: 'DELETE' });
    await get().fetchBatches();
  },
}));