import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';
import {
  IndianRupee,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Users,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface DashboardData {
  stats: {
    totalRevenue: number;
    paidRevenue: number;
    totalOrders: number;
    pendingProcessing: number;
    deliveredOrders: number;
    totalCustomers: number;
  };
  salesTrend: Array<{ date_label: string; total_sales: number; order_count: number }>;
  categoryShare: Array<{ category: string; count: number; revenue: number }>;
  recentOrders: Array<{
    id: number;
    order_number: string;
    customer_name: string;
    product_name: string;
    total_amount: number;
    payment_status: string;
    order_status: string;
    created_at: string;
  }>;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await apiFetch<{ success: boolean } & DashboardData>('/orders/dashboard-stats');
        setData(res);
      } catch (err) {
        console.error('Failed to load dashboard statistics', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  const stats = data?.stats;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Title */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Admin Overview</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Real-time farm products sales metrics, orders, and customer activity.
          </p>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs uppercase font-medium text-muted-foreground">Total Revenue</CardTitle>
              <IndianRupee className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">₹{Number(stats?.totalRevenue || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                ₹{Number(stats?.paidRevenue || 0).toLocaleString()} collected
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs uppercase font-medium text-muted-foreground">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats?.totalOrders || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Farm orders recorded</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs uppercase font-medium text-muted-foreground">Pending Processing</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats?.pendingProcessing || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Orders awaiting dispatch</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs uppercase font-medium text-muted-foreground">Delivered / Customers</CardTitle>
              <Users className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats?.deliveredOrders || 0} Delivered</div>
              <p className="text-xs text-muted-foreground mt-1">{stats?.totalCustomers || 0} registered users</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 sm:gap-6">
          {/* Sales Trend Chart */}
          <Card className="lg:col-span-4 border-border">
            <CardHeader>
              <CardTitle className="text-sm sm:text-base font-semibold">Weekly Sales Trend</CardTitle>
              <CardDescription className="text-xs">Daily revenue from farm produce orders over the past 7 days</CardDescription>
            </CardHeader>
            <CardContent className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.salesTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary, #10b981)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--color-primary, #10b981)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date_label" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                    formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="total_sales"
                    stroke="var(--color-primary, #10b981)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Distribution Pie Chart */}
          <Card className="lg:col-span-3 border-border">
            <CardHeader>
              <CardTitle className="text-sm sm:text-base font-semibold">Sales by Farm Category</CardTitle>
              <CardDescription className="text-xs">Share of revenue across product lines</CardDescription>
            </CardHeader>
            <CardContent className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.categoryShare || []}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="revenue"
                    nameKey="category"
                  >
                    {(data?.categoryShare || []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                    formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders Overview Table with Horizontal Scroll for Mobile */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm sm:text-base font-semibold">Recent Farm Orders</CardTitle>
            <CardDescription className="text-xs">Latest order transactions received</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[600px] px-4">
                <thead>
                  <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                    <th className="pb-3 px-4 sm:px-0 font-medium">Order</th>
                    <th className="pb-3 px-2 font-medium">Customer</th>
                    <th className="pb-3 px-2 font-medium">Product</th>
                    <th className="pb-3 px-2 font-medium">Amount</th>
                    <th className="pb-3 px-2 font-medium">Payment</th>
                    <th className="pb-3 px-4 sm:px-0 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data?.recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-4 sm:px-0 font-mono font-medium text-xs">{ord.order_number}</td>
                      <td className="py-3 px-2 font-medium text-xs sm:text-sm">{ord.customer_name}</td>
                      <td className="py-3 px-2 text-xs text-muted-foreground truncate max-w-[150px]">{ord.product_name}</td>
                      <td className="py-3 px-2 font-semibold text-xs sm:text-sm">₹{Number(ord.total_amount).toLocaleString()}</td>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-medium ${
                            ord.payment_status === 'PAID'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {ord.payment_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 sm:px-0">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-medium ${
                            ord.order_status === 'DELIVERED'
                              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                              : ord.order_status === 'SHIPPED'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          {ord.order_status === 'DELIVERED' && <CheckCircle2 className="h-3 w-3" />}
                          {ord.order_status}
                        </span>
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
