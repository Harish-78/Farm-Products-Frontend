import { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { Search, Filter, RefreshCw, CheckCircle2, Clock, Truck, XCircle, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';

interface Order {
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter !== 'ALL') queryParams.append('status', statusFilter);
      if (search.trim()) queryParams.append('search', search.trim());

      const res = await apiFetch<{ success: boolean; orders: Order[] }>(
        `/orders?${queryParams.toString()}`
      );
      setOrders(res.orders || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (statusFilter !== 'ALL') queryParams.append('status', statusFilter);

        const res = await apiFetch<{ success: boolean; orders: Order[] }>(
          `/orders?${queryParams.toString()}`
        );
        if (!ignore) setOrders(res.orders || []);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await apiFetch(`/orders/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify({ order_status: newStatus }),
      });
      // Update local state
      setOrders((prev) =>
        prev.map((ord) => (ord.id === orderId ? { ...ord, order_status: newStatus as any } : ord))
      );
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = (id: number) => {
    setDeleteConfirmId(id);
  };

 const handleConfirmDelete = async (id: number) => {
  try {
    await apiFetch(`/orders/${id}`, { method: 'DELETE' });
    setDeleteConfirmId(null);
    setOrders((prev) => prev.filter((ord) => ord.id !== id));
  } catch (err) {
    setDeleteConfirmId(null);
    const message = err instanceof Error ? err.message : 'Delete failed';
    toast.error(message);
  }
};

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Orders Management</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Manage, search, and update delivery status for all Poongodi Farm Products orders.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchOrders} className="gap-2 w-full sm:w-auto justify-center">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Filter and Search Bar */}
        <Card className="border-border">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
              {/* Search input */}
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-80">
                <div className="relative w-full">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search order #, customer..."
                    className="pl-9 h-9 text-xs sm:text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Button type="submit" size="sm" className="h-9 shrink-0">
                  Search
                </Button>
              </form>

              {/* Status Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1 mr-1 shrink-0">
                  <Filter className="h-3.5 w-3.5" /> Filter:
                </span>
                {['ALL', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium shrink-0 transition-colors ${
                      statusFilter === status
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card className="border-border">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-sm sm:text-base font-semibold">Orders List ({orders.length})</CardTitle>
            <CardDescription className="text-xs">Live orders stored in PostgreSQL</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">No orders found matching the filter criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                      <th className="pb-3 px-4 sm:px-0 font-medium">Order Number</th>
                      <th className="pb-3 px-2 font-medium">Customer Details</th>
                      <th className="pb-3 px-2 font-medium">Produce Item</th>
                      <th className="pb-3 px-2 font-medium">Qty</th>
                      <th className="pb-3 px-2 font-medium">Total Amount</th>
                      <th className="pb-3 px-2 font-medium">Payment</th>
                      <th className="pb-3 px-2 font-medium">Status</th>
                      <th className="pb-3 px-4 sm:px-0 font-medium text-right">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-4 px-4 sm:px-0 font-mono font-medium text-xs">
                          {ord.order_number}
                          <div className="text-[10px] text-muted-foreground font-sans mt-0.5">
                            {new Date(ord.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <p className="font-semibold text-xs leading-none">{ord.customer_name}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">{ord.customer_phone}</p>
                          <p className="text-[11px] text-muted-foreground truncate max-w-[160px]">
                            {ord.shipping_address}
                          </p>
                        </td>
                        <td className="py-4 px-2">
                          <p className="font-medium text-xs">{ord.product_name}</p>
                          <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.2 bg-muted text-muted-foreground rounded">
                            {ord.category}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-xs font-medium">{ord.quantity}x</td>
                        <td className="py-4 px-2 font-semibold text-xs sm:text-sm">₹{Number(ord.total_amount).toLocaleString()}</td>
                        <td className="py-4 px-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-medium ${
                              ord.payment_status === 'PAID'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {ord.payment_status}
                          </span>
                        </td>
                        <td className="py-4 px-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium ${
                              ord.order_status === 'DELIVERED'
                                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                : ord.order_status === 'SHIPPED'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                : ord.order_status === 'PROCESSING'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'bg-destructive/10 text-destructive'
                            }`}
                          >
                            {ord.order_status === 'DELIVERED' && <CheckCircle2 className="h-3 w-3" />}
                            {ord.order_status === 'SHIPPED' && <Truck className="h-3 w-3" />}
                            {ord.order_status === 'PROCESSING' && <Clock className="h-3 w-3" />}
                            {ord.order_status === 'CANCELLED' && <XCircle className="h-3 w-3" />}
                            {ord.order_status}
                          </span>
                        </td>
                        <td className="py-4 px-4 sm:px-0 text-right">
                          <div className="flex items-center gap-1">
                            <select
                              disabled={updatingId === ord.id}
                              value={ord.order_status}
                              onChange={(e) => handleUpdateStatus(ord.id, e.target.value)}
                              className="text-xs bg-card border border-border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                            >
                              <option value="PROCESSING">Mark Processing</option>
                              <option value="SHIPPED">Mark Shipped</option>
                              <option value="DELIVERED">Mark Delivered</option>
                              <option value="CANCELLED">Mark Cancelled</option>
                            </select>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(ord.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              title="Delete Order"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
          onOpenChange={() => setDeleteConfirmId(null)}
          title="Delete Order"
          description="Are you sure you want to delete this order record? This action cannot be undone."
          onConfirm={() => handleConfirmDelete(deleteConfirmId!)}
        />
      )}
    </AdminLayout>
  );
}
