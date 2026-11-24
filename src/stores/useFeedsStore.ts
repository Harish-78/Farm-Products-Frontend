import { create } from 'zustand';
import { apiFetch } from '@/lib/api';

export interface FeedItem {
  id: number;
  feed_name: string;
  target_animal: string;
  bag_weight_kg: number;
  current_stock_kg: number;
  cost_per_kg: number;
  reorder_alert_days: number;
  supplier_name: string;
  notes: string;
  daily_consumption_kg: number;
  days_remaining: number;
  is_low_stock: boolean;
}

interface FeedsState {
  feeds: FeedItem[];
  loading: boolean;
  setFeeds: (feeds: FeedItem[]) => void;
  setLoading: (loading: boolean) => void;
  fetchFeeds: () => Promise<void>;
  createFeed: (payload: {
    feed_name: string;
    target_animal: string;
    current_stock_kg: number;
    cost_per_kg: number;
    reorder_alert_days: number;
    supplier_name: string;
  }) => Promise<void>;
  updateStock: (id: number, current_stock_kg: number) => Promise<void>;
  deleteFeed: (id: number) => Promise<void>;
  triggerAlertCheck: () => Promise<string>;
}

export const useFeedsStore = create<FeedsState>((set, get) => ({
  feeds: [],
  loading: true,

  setFeeds: (feeds) => set({ feeds }),
  setLoading: (loading) => set({ loading }),

  fetchFeeds: async () => {
    set({ loading: true });
    try {
      const res = await apiFetch<{ success: boolean; feeds: FeedItem[] }>(
        '/farm/feeds'
      );
      set({ feeds: res.feeds || [], loading: false });
    } catch {
      set({ feeds: [], loading: false });
    }
  },

  createFeed: async (payload) => {
    await apiFetch('/farm/feeds', {
      method: 'POST',
      body: JSON.stringify({
        feed_name: payload.feed_name,
        target_animal: payload.target_animal,
        current_stock_kg: Number(payload.current_stock_kg),
        cost_per_kg: Number(payload.cost_per_kg),
        reorder_alert_days: Number(payload.reorder_alert_days),
        supplier_name: payload.supplier_name,
      }),
    });
    await get().fetchFeeds();
  },

  updateStock: async (id, current_stock_kg) => {
    await apiFetch(`/farm/feeds/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ current_stock_kg: Number(current_stock_kg) }),
    });
    await get().fetchFeeds();
  },

  deleteFeed: async (id) => {
    await apiFetch(`/farm/feeds/${id}`, { method: 'DELETE' });
    await get().fetchFeeds();
  },

  triggerAlertCheck: async () => {
    const res = await apiFetch<{ success: boolean; message: string }>(
      '/farm/feeds/check-alert',
      { method: 'POST' }
    );
    return res.message;
  },
}));