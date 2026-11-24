import { create } from 'zustand';
import { apiFetch } from '@/lib/api';

export interface ExpenseItem {
  id: number;
  category: string;
  title: string;
  amount: number;
  expense_date: string;
  payment_method: string;
  business_unit: string;
  notes: string;
}

interface ExpensesState {
  expenses: ExpenseItem[];
  loading: boolean;
  categoryFilter: string;
  setExpenses: (expenses: ExpenseItem[]) => void;
  setLoading: (loading: boolean) => void;
  setCategoryFilter: (filter: string) => void;
  fetchExpenses: (categoryFilter?: string) => Promise<void>;
  createExpense: (payload: {
    category: string;
    title: string;
    amount: number;
    expense_date: string;
    business_unit: string;
    payment_method: string;
    notes: string;
  }) => Promise<void>;
  deleteExpense: (id: number) => Promise<void>;
}

export const CATEGORIES = [
  'Packaging & Labeling',
  'Feed & Nutrition',
  'Medicines & Vaccines',
  'Electricity & Water',
  'Transport & Fuel',
  'Farm Shed Maintenance',
  'Equipment & Brooders',
  'Labor & Wages',
  'Other Operational Expense',
];

export const useExpensesStore = create<ExpensesState>((set, get) => ({
  expenses: [],
  loading: true,
  categoryFilter: 'ALL',

  setExpenses: (expenses) => set({ expenses }),
  setLoading: (loading) => set({ loading }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),

  fetchExpenses: async (categoryFilter = get().categoryFilter) => {
    set({ loading: true });
    try {
      const q = new URLSearchParams();
      if (categoryFilter !== 'ALL') q.append('category', categoryFilter);
      const res = await apiFetch<{ success: boolean; expenses: ExpenseItem[] }>(
        `/farm/expenses?${q.toString()}`
      );
      set({ expenses: res.expenses || [], loading: false });
    } catch {
      set({ expenses: [], loading: false });
    }
  },

  createExpense: async (payload) => {
    await apiFetch('/farm/expenses', {
      method: 'POST',
      body: JSON.stringify({
        category: payload.category,
        title: payload.title,
        amount: Number(payload.amount),
        expense_date: payload.expense_date,
        business_unit: payload.business_unit,
        payment_method: payload.payment_method,
        notes: payload.notes,
      }),
    });
    await get().fetchExpenses(get().categoryFilter);
  },

  deleteExpense: async (id) => {
    await apiFetch(`/farm/expenses/${id}`, { method: 'DELETE' });
    await get().fetchExpenses(get().categoryFilter);
  },
}));