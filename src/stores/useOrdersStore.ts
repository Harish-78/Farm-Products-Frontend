import { create } from 'zustand';
import { apiFetch } from '@/lib/api';

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  product_name: string;
  category: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  payment_status: 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';
  order_status: 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  shipping_address: string;
  created_at: string;
}

interface OrdersState {
  orders: Order[];
  loading: boolean;
  search: string;
  statusFilter: string;
  setOrders: (orders: Order[]) => void;
  setLoading: (loading: boolean) => void;
  setSearch: (search: string) => void;
  setStatusFilter: (statusFilter: string) => void;
  fetchOrders: () => Promise<void>;
  updateOrderStatus: (
    orderId: number,
    newStatus: Order['order_status']
  ) => Promise<void>;
  deleteOrder: (id: number) => Promise<void>;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  loading: true,
  search: '',
  statusFilter: 'ALL',

  setOrders: (orders) => set({ orders }),
  setLoading: (loading) => set({ loading }),
  setSearch: (search) => set({ search }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),

  fetchOrders: async () => {
    set({ loading: true });
    try {
      const queryParams = new URLSearchParams();
      if (get().statusFilter !== 'ALL') queryParams.append('status', get().statusFilter);
      if (get().search.trim()) queryParams.append('search', get().search.trim());
      const res = await apiFetch<{ success: boolean; orders: Order[] }>(
        `/orders?${queryParams.toString()}`
      );
      set({ orders: res.orders || [], loading: false });
    } catch {
      set({ orders: [], loading: false });
    }
  },

  updateOrderStatus: async (orderId, newStatus) => {
    await apiFetch(`/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({ order_status: newStatus }),
    });
    set((prev) => ({
      orders: prev.orders.map((ord) =>
        ord.id === orderId ? { ...ord, order_status: newStatus } : ord
      ),
    }));
    await get().fetchOrders();
  },

  deleteOrder: async (id) => {
    await apiFetch(`/orders/${id}`, { method: 'DELETE' });
    set((prev) => ({ orders: prev.orders.filter((ord) => ord.id !== id) }));
    await get().fetchOrders();
  },
}));