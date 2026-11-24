import { create } from 'zustand';
import { apiFetch } from '@/lib/api';

export interface PnLSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfitInHand: number;
  todayRevenue: number;
  todayExpenses: number;
  todayNetProfit: number;
  totalCashCollected: number;
  pendingReceivables: number;
  totalOrdersCount: number;
  totalActiveQuails: number;
  totalMortality: number;
  dailyFeedConsumptionKg: number;
  totalFeedStockKg: number;
  feedStockValueInHand: number;
  feedDaysLeft: number;
}

export interface DailyProfitTrend {
  date_label: string;
  revenue: number;
  expense: number;
  net_profit: number;
}

export interface ExpenseBreakdown {
  category: string;
  total_amount: number;
  count: number;
}

export interface MonthlyComparison {
  month_label: string;
  revenue: number;
  expense: number;
  profit: number;
}

export interface OrderStatusDistribution {
  order_status: string;
  count: number;
  total_value: number;
}

export interface FlockDistribution {
  batch_name: string;
  current_count: number;
  mortality_count: number;
  daily_feed_kg: number;
}

export interface PnLData {
  summary: PnLSummary;
  dailyProfitTrend: DailyProfitTrend[];
  expenseBreakdown: ExpenseBreakdown[];
  monthlyComparison: MonthlyComparison[];
  orderStatusDistribution: OrderStatusDistribution[];
  flockDistribution: FlockDistribution[];
}

interface PnLState {
  data: PnLData | null;
  loading: boolean;
  setData: (data: PnLData | null) => void;
  setLoading: (loading: boolean) => void;
  fetchPnL: () => Promise<void>;
}

export const usePnLStore = create<PnLState>((set) => ({
  data: null,
  loading: true,

  setData: (data) => set({ data }),
  setLoading: (loading) => set({ loading }),

  fetchPnL: async () => {
    set({ loading: true });
    try {
      const res = await apiFetch<{ success: boolean } & PnLData>('/farm/pnl-summary');
      if (res.success) {
        const { success: _ignored, ...data } = res;
        void _ignored;
        set({ data, loading: false });
      } else {
        set({ data: null, loading: false });
      }
    } catch {
      set({ data: null, loading: false });
    }
  },
}));