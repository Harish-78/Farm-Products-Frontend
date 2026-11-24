import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';
import { Plus, RefreshCw, Trash2, Filter, Package, Tag, Zap, Truck, HeartPulse } from 'lucide-react';

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

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Form states
  const [category, setCategory] = useState('Packaging & Labeling');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [businessUnit, setBusinessUnit] = useState('Quail Farm');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [notes, setNotes] = useState('');

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (categoryFilter !== 'ALL') q.append('category', categoryFilter);
      const res = await apiFetch<{ success: boolean; expenses: ExpenseItem[] }>(`/farm/expenses?${q.toString()}`);
      setExpenses(res.expenses || []);
    } catch (err) {
      console.error(err);
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
        const res = await apiFetch<{ success: boolean; expenses: ExpenseItem[] }>(`/farm/expenses?${q.toString()}`);
        if (mounted) {
          setExpenses(res.expenses || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [categoryFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    try {
      await apiFetch('/farm/expenses', {
        method: 'POST',
        body: JSON.stringify({
          category,
          title,
          amount: Number(amount),
          expense_date: expenseDate,
          business_unit: businessUnit,
          payment_method: paymentMethod,
          notes,
        }),
      });
      setShowAddModal(false);
      setTitle('');
      setAmount(0);
      setNotes('');
      fetchExpenses();
    } catch (err: any) {
      alert(err.message || 'Failed to save expense');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await apiFetch(`/farm/expenses/${id}`, { method: 'DELETE' });
      fetchExpenses();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  const totalExpense = expenses.reduce((acc, x) => acc + Number(x.amount), 0);
  const packagingTotal = expenses
    .filter((x) => x.category.includes('Packaging') || x.category.includes('Labeling'))
    .reduce((acc, x) => acc + Number(x.amount), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Farm Expense Tracker</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Log feed purchases, custom egg packaging & labels, utility charges, and dynamic custom operational costs.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Button variant="outline" size="sm" onClick={fetchExpenses} className="gap-1.5 flex-1 sm:flex-initial justify-center">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button size="sm" onClick={() => setShowAddModal(!showAddModal)} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white flex-1 sm:flex-initial justify-center">
              <Plus className="h-4 w-4" /> Add Expense
            </Button>
          </div>
        </div>

        {/* Expense Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase font-medium text-muted-foreground">Total Filtered Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">₹{totalExpense.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Directly deducted from gross revenue</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase font-medium text-muted-foreground">Packaging & Labeling Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">₹{packagingTotal.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Cartons, stickers, shrink wraps & boxes</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase font-medium text-muted-foreground">Business Line Support</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-foreground">Multi-Business</div>
              <p className="text-xs text-muted-foreground mt-1">Ready for quails, eggs, chicken, and organic goods</p>
            </CardContent>
          </Card>
        </div>

        {/* Add Expense Form Modal */}
        {showAddModal && (
          <Card className="border-emerald-500/30 bg-card shadow-md animate-in fade-in duration-200">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Log Dynamic Farm Expense</CardTitle>
              <CardDescription className="text-xs">Add packaging cartons, custom print labels, medicines, feeds, or utilities</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Expense Category</Label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-semibold">Expense Description / Title</Label>
                    <Input
                      placeholder="e.g. 500 pcs Quail Egg Cartons + Brand Label Stickers"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Amount (₹)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Date of Expense</Label>
                    <Input
                      type="date"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Payment Mode</Label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="CASH">Cash</option>
                      <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                      <option value="CARD">Credit/Debit Card</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Business Unit</Label>
                    <Input
                      value={businessUnit}
                      onChange={(e) => setBusinessUnit(e.target.value)}
                      placeholder="Quail Farm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Additional Notes / Vendor Info</Label>
                  <Input
                    placeholder="Vendor invoice #, quantity bought, or receipt details"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Save Expense Record
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

        {/* Expenses List Table */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Logged Expenses ({expenses.length})</CardTitle>
            <CardDescription className="text-xs">All dynamic costs deducted automatically in your daily profit calculations</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
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
                        {x.notes && <div className="text-[11px] text-muted-foreground">{x.notes}</div>}
                      </td>
                      <td className="py-4 px-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-muted text-foreground">
                          {x.category.includes('Packaging') && <Package className="h-3 w-3 text-indigo-500" />}
                          {x.category.includes('Feed') && <Tag className="h-3 w-3 text-amber-500" />}
                          {x.category.includes('Electricity') && <Zap className="h-3 w-3 text-yellow-500" />}
                          {x.category.includes('Transport') && <Truck className="h-3 w-3 text-blue-500" />}
                          {x.category.includes('Medicines') && <HeartPulse className="h-3 w-3 text-rose-500" />}
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
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title="Delete Expense"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
