import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';
import {
  Plus,
  RefreshCw,
  Trash2,
  Filter,
  Package,
  Tag,
  Zap,
  Truck,
  HeartPulse,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';

interface ExpenseItem {
  id: number;
  category: string;
  title: string;
  amount: number;
  expense_date: string;
  payment_method: string;
  business_unit: string;
  notes: string;
}

const CATEGORIES = [
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

const PAYMENT_METHODS = [
  { value: 'UPI', label: 'UPI / GPay / PhonePe' },
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer / NEFT' },
  { value: 'CARD', label: 'Credit/Debit Card' },
];

type FormErrors = Partial<Record<'category' | 'title' | 'amount' | 'expense_date' | 'payment_method' | 'business_unit', string>>;

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Creating / deleting states
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  // Form states — amount kept as string so leading zeros survive typing
  const [category, setCategory] = useState('Packaging & Labeling');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [businessUnit, setBusinessUnit] = useState('Quail Farm');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [notes, setNotes] = useState('');

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (categoryFilter !== 'ALL') q.append('category', categoryFilter);
      const res = await apiFetch<{ success: boolean; expenses: ExpenseItem[] }>(
        `/farm/expenses?${q.toString()}`
      );
      setExpenses(res.expenses || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const q = new URLSearchParams();
        if (categoryFilter !== 'ALL') q.append('category', categoryFilter);
        const res = await apiFetch<{ success: boolean; expenses: ExpenseItem[] }>(
          `/farm/expenses?${q.toString()}`
        );
        if (mounted) setExpenses(res.expenses || []);
      } catch (err) {
        console.error(err);
        if (mounted) toast.error('Failed to load expenses');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [categoryFilter]);

  // Reset + close the add form
  const resetForm = () => {
    setCategory('Packaging & Labeling');
    setTitle('');
    setAmount('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setBusinessUnit('Quail Farm');
    setPaymentMethod('UPI');
    setNotes('');
    setErrors({});
  };

  const closeAddModal = () => {
    if (creating) return;
    setShowAddModal(false);
    resetForm();
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};

    if (!title.trim()) {
      next.title = 'Expense title is required';
    } else if (title.trim().length < 3) {
      next.title = 'Title is too short';
    }

    const amt = Number(amount);
    if (amount.trim() === '') {
      next.amount = 'Amount is required';
    } else if (!Number.isFinite(amt) || amt <= 0) {
      next.amount = 'Amount must be greater than zero';
    }

    if (!expenseDate) {
      next.expense_date = 'Date is required';
    } else {
      const d = new Date(expenseDate);
      if (isNaN(d.getTime())) {
        next.expense_date = 'Invalid date';
      } else if (d > new Date()) {
        next.expense_date = 'Date cannot be in the future';
      }
    }

    if (!businessUnit.trim()) {
      next.business_unit = 'Business unit is required';
    }

    if (!CATEGORIES.includes(category)) {
      next.category = 'Select a valid category';
    }

    if (!PAYMENT_METHODS.some((p) => p.value === paymentMethod)) {
      next.payment_method = 'Select a valid payment method';
    }

    return next;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error('Please fix the highlighted fields');
      return;
    }

    setErrors({});
    setCreating(true);
    try {
      await apiFetch('/farm/expenses', {
        method: 'POST',
        body: JSON.stringify({
          category,
          title: title.trim(),
          amount: Number(amount),
          expense_date: expenseDate,
          business_unit: businessUnit.trim(),
          payment_method: paymentMethod,
          notes: notes.trim(),
        }),
      });
      toast.success('Expense saved');
      setShowAddModal(false);
      resetForm();
      fetchExpenses();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save expense';
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (id: number) => setDeleteConfirmId(id);

  const handleConfirmDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await apiFetch(`/farm/expenses/${id}`, { method: 'DELETE' });
      toast.success('Expense deleted');
      setDeleteConfirmId(null);
      fetchExpenses();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      toast.error(message);
      setDeleteConfirmId(null);
    } finally {
      setDeletingId(null);
    }
  };

  const totalExpense = expenses.reduce((acc, x) => acc + Number(x.amount), 0);
  const packagingTotal = expenses
    .filter(
      (x) =>
        x.category.includes('Packaging') || x.category.includes('Labeling')
    )
    .reduce((acc, x) => acc + Number(x.amount), 0);

  const fieldClass = (key: keyof FormErrors) =>
    errors[key] ? 'border-destructive focus:ring-destructive' : '';

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Farm Expense Tracker
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Log feed purchases, custom egg packaging & labels, utility charges, and dynamic custom operational costs.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchExpenses}
              disabled={loading}
              className="gap-1.5 flex-1 sm:flex-initial justify-center"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => setShowAddModal(!showAddModal)}
              disabled={creating}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white flex-1 sm:flex-initial justify-center"
            >
              <Plus className="h-4 w-4" /> Add Expense
            </Button>
          </div>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase font-medium text-muted-foreground">
                Total Filtered Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                ₹{totalExpense.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Directly deducted from gross revenue
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase font-medium text-muted-foreground">
                Packaging & Labeling Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                ₹{packagingTotal.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Cartons, stickers, shrink wraps & boxes
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase font-medium text-muted-foreground">
                Business Line Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-foreground">
                Multi-Business
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Ready for quails, eggs, chicken, and organic goods
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Add Expense Form */}
        {showAddModal && (
          <Card className="border-emerald-500/30 bg-card shadow-md animate-in fade-in duration-200">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Log Dynamic Farm Expense
              </CardTitle>
              <CardDescription className="text-xs">
                Add packaging cartons, custom print labels, medicines, feeds, or utilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} noValidate className="space-y-4">
                <fieldset disabled={creating} className="space-y-4 disabled:opacity-70">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Expense Category</Label>
                      <div className="relative">
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full h-9 rounded-md border border-input bg-transparent pl-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs font-semibold">
                        Expense Description / Title
                      </Label>
                      <Input
                        placeholder="e.g. 500 pcs Quail Egg Cartons + Brand Label Stickers"
                        value={title}
                        onChange={(e) => {
                          setTitle(e.target.value);
                          if (errors.title) {
                            setErrors((p) => {
                              const n = { ...p };
                              delete n.title;
                              return n;
                            });
                          }
                        }}
                        required
                        aria-invalid={!!errors.title}
                        className={fieldClass('title')}
                      />
                      {errors.title && (
                        <p className="text-[11px] text-destructive">{errors.title}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Amount (₹)</Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={amount}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === '' || /^\d*\.?\d*$/.test(v)) {
                            setAmount(v);
                            if (errors.amount) {
                              setErrors((p) => {
                                const n = { ...p };
                                delete n.amount;
                                return n;
                              });
                            }
                          }
                        }}
                        required
                        aria-invalid={!!errors.amount}
                        className={fieldClass('amount')}
                      />
                      {errors.amount && (
                        <p className="text-[11px] text-destructive">{errors.amount}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Date of Expense</Label>
                      <Input
                        type="date"
                        value={expenseDate}
                        onChange={(e) => {
                          setExpenseDate(e.target.value);
                          if (errors.expense_date) {
                            setErrors((p) => {
                              const n = { ...p };
                              delete n.expense_date;
                              return n;
                            });
                          }
                        }}
                        required
                        aria-invalid={!!errors.expense_date}
                        className={fieldClass('expense_date')}
                      />
                      {errors.expense_date && (
                        <p className="text-[11px] text-destructive">
                          {errors.expense_date}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Payment Mode</Label>
                      <div className="relative">
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full h-9 rounded-md border border-input bg-transparent pl-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                        >
                          {PAYMENT_METHODS.map((p) => (
                            <option key={p.value} value={p.value}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Business Unit</Label>
                      <Input
                        value={businessUnit}
                        onChange={(e) => {
                          setBusinessUnit(e.target.value);
                          if (errors.business_unit) {
                            setErrors((p) => {
                              const n = { ...p };
                              delete n.business_unit;
                              return n;
                            });
                          }
                        }}
                        placeholder="Quail Farm"
                        aria-invalid={!!errors.business_unit}
                        className={fieldClass('business_unit')}
                      />
                      {errors.business_unit && (
                        <p className="text-[11px] text-destructive">
                          {errors.business_unit}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Additional Notes / Vendor Info
                    </Label>
                    <Input
                      placeholder="Vendor invoice #, quantity bought, or receipt details"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </fieldset>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={closeAddModal}
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={creating}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 min-w-[160px]"
                  >
                    {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                    {creating ? 'Saving...' : 'Save Expense Record'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1 mr-1 shrink-0">
            <Filter className="h-3.5 w-3.5" /> Category:
          </span>
          {['ALL', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium shrink-0 transition-colors ${
                categoryFilter === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Expenses Table */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Logged Expenses ({expenses.length})
            </CardTitle>
            <CardDescription className="text-xs">
              All dynamic costs deducted automatically in your daily profit calculations
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">
                  No expenses logged{categoryFilter !== 'ALL' ? ' for this category' : ''} yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                      <th className="pb-3 px-4 sm:px-0 font-medium">Expense Item</th>
                      <th className="pb-3 px-2 font-medium">Category</th>
                      <th className="pb-3 px-2 font-medium">Date</th>
                      <th className="pb-3 px-2 font-medium">Payment</th>
                      <th className="pb-3 px-2 font-medium">Amount</th>
                      <th className="pb-3 px-4 sm:px-0 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {expenses.map((x) => (
                      <tr key={x.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-4 px-4 sm:px-0 font-medium">
                          <div className="font-semibold text-sm">{x.title}</div>
                          {x.notes && (
                            <div className="text-[11px] text-muted-foreground">
                              {x.notes}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-muted text-foreground">
                            {x.category.includes('Packaging') && (
                              <Package className="h-3 w-3 text-indigo-500" />
                            )}
                            {x.category.includes('Feed') && (
                              <Tag className="h-3 w-3 text-amber-500" />
                            )}
                            {x.category.includes('Electricity') && (
                              <Zap className="h-3 w-3 text-yellow-500" />
                            )}
                            {x.category.includes('Transport') && (
                              <Truck className="h-3 w-3 text-blue-500" />
                            )}
                            {x.category.includes('Medicines') && (
                              <HeartPulse className="h-3 w-3 text-rose-500" />
                            )}
                            {x.category}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-xs text-muted-foreground">
                          {new Date(x.expense_date).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-2 text-xs font-mono font-medium">
                          {x.payment_method}
                        </td>
                        <td className="py-4 px-2 font-bold text-amber-600 dark:text-amber-400 text-sm">
                          ₹{Number(x.amount).toLocaleString()}
                        </td>
                        <td className="py-4 px-4 sm:px-0 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(x.id)}
                            disabled={deletingId === x.id}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            title="Delete Expense"
                          >
                            {deletingId === x.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {deleteConfirmId && (
        <ConfirmDialog
          open={true}
          onOpenChange={() => {
            if (deletingId) return;
            setDeleteConfirmId(null);
          }}
          title="Delete Expense"
          description="Are you sure you want to delete this expense record? This action cannot be undone."
          onConfirm={() => handleConfirmDelete(deleteConfirmId!)}
        />
      )}
    </AdminLayout>
  );
}