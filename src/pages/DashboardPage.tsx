import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Bird,
  Wheat,
  Clock,
  AlertTriangle,
  Receipt,
  Wallet,
  ShoppingBag,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from 'recharts';

interface PnLSummary {
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

interface PnLData {
  summary: PnLSummary;
  dailyProfitTrend: Array<{
    date_label: string;
    revenue: number;
    expense: number;
    net_profit: number;
  }>;
  expenseBreakdown: Array<{ category: string; total_amount: number; count: number }>;
  monthlyComparison: Array<{
    month_label: string;
    revenue: number;
    expense: number;
    profit: number;
  }>;
  orderStatusDistribution: Array<{
    order_status: string;
    count: number;
    total_value: number;
  }>;
  flockDistribution: Array<{
    batch_name: string;
    current_count: number;
    mortality_count: number;
    daily_feed_kg: number;
  }>;
}

const PALETTE = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'];
const STATUS_COLORS: Record<string, string> = {
  DELIVERED: '#10b981',
  SHIPPED: '#3b82f6',
  PROCESSING: '#f59e0b',
  CANCELLED: '#ef4444',
  PENDING: '#a855f7',
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<PnLData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await apiFetch<{ success: boolean } & PnLData>('/farm/pnl-summary');
        setData(res);
      } catch (err) {
        console.error('Failed to load P&L statistics', err);
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

  const s = data?.summary;
  const isNetProfitPositive = (s?.netProfitInHand || 0) >= 0;
  const isTodayPositive = (s?.todayNetProfit || 0) >= 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Title with Low Feed Alert Banner */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{t('dashboard.subtitle')}</p>
        </div>

        {/* 10-Day Feed Critical Banner if feed runs out soon */}
        {s && s.feedDaysLeft <= 10 && (
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start sm:items-center justify-between gap-3 text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              <div>
                <h4 className="text-sm font-bold">Quail Feed Depletion Warning!</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Based on your {s.totalActiveQuails} quails consuming {s.dailyFeedConsumptionKg} kg/day, you only have{' '}
                  <strong className="text-amber-600 dark:text-amber-400 font-bold">{s.feedDaysLeft} days</strong> of feed stock remaining ({s.totalFeedStockKg} kg left in warehouse).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Primary 4 Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className={`border-border ${isNetProfitPositive ? 'bg-emerald-500/5' : 'bg-destructive/5'}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs uppercase font-semibold text-muted-foreground">{t('dashboard.netProfitInHand')}</CardTitle>
              <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            </CardHeader>
            <CardContent>
              <div className={`text-xl sm:text-2xl font-extrabold break-all ${isNetProfitPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                ₹{Number(s?.netProfitInHand || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                {isNetProfitPositive ? <TrendingUp className="h-3 w-3 text-emerald-500 shrink-0" /> : <TrendingDown className="h-3 w-3 text-destructive shrink-0" />}
                <span className="truncate">{t('dashboard.netProfitDesc')}</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs uppercase font-semibold text-muted-foreground">{t('dashboard.todayDailyGain')}</CardTitle>
              <IndianRupee className="h-4 w-4 text-blue-500 shrink-0" />
            </CardHeader>
            <CardContent>
              <div className={`text-xl sm:text-2xl font-bold break-all ${isTodayPositive ? 'text-blue-600 dark:text-blue-400' : 'text-destructive'}`}>
                ₹{Number(s?.todayNetProfit || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('dashboard.todayRevenue')}: ₹{Number(s?.todayRevenue || 0).toLocaleString()} | {t('dashboard.todayExpenses')}: ₹{Number(s?.todayExpenses || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs uppercase font-semibold text-muted-foreground">{t('dashboard.totalRevenue')}</CardTitle>
              <ShoppingBag className="h-4 w-4 text-indigo-500 shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold break-all">₹{Number(s?.totalRevenue || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {s?.totalOrdersCount} {t('dashboard.totalOrders')} | ₹{Number(s?.totalCashCollected || 0).toLocaleString()} {t('dashboard.collected')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs uppercase font-semibold text-muted-foreground">{t('dashboard.totalExpenses')}</CardTitle>
              <Receipt className="h-4 w-4 text-amber-500 shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 break-all">
                ₹{Number(s?.totalExpenses || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('dashboard.expensesDesc')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quail Population & Warehouse Live Snapshot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs uppercase font-medium text-muted-foreground">{t('dashboard.activeQuails')}</CardTitle>
              <Bird className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{s?.totalActiveQuails} Birds</div>
              <p className="text-xs text-muted-foreground mt-1">{s?.totalMortality} {t('dashboard.mortality')}</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs uppercase font-medium text-muted-foreground">{t('dashboard.dailyFeedUsed')}</CardTitle>
              <Wheat className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{s?.dailyFeedConsumptionKg} kg / day</div>
              <p className="text-xs text-muted-foreground mt-1">{t('dashboard.feedFormulaDesc')}</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs uppercase font-medium text-muted-foreground">{t('dashboard.feedWarehouse')}</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{s?.totalFeedStockKg} kg</div>
              <p className="text-xs text-muted-foreground mt-1">Valued at ₹{Number(s?.feedStockValueInHand || 0).toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs uppercase font-medium text-muted-foreground">{t('dashboard.feedRunway')}</CardTitle>
              <AlertTriangle className={`h-4 w-4 ${(s?.feedDaysLeft || 0) <= 10 ? 'text-destructive' : 'text-emerald-500'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-xl font-bold ${(s?.feedDaysLeft || 0) <= 10 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {s?.feedDaysLeft} {t('dashboard.daysRemaining')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Automated 10-day cron threshold</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart Row 1: 14-Day Revenue vs Expenses Area Chart + Expenses Pie Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 sm:gap-6">
          <Card className="lg:col-span-4 border-border">
            <CardHeader>
              <CardTitle className="text-sm sm:text-base font-semibold">{t('dashboard.revenueVsExpense')}</CardTitle>
              <CardDescription className="text-xs">{t('dashboard.revenueVsExpenseDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.dailyProfitTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="date_label" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                    formatter={(val: any, name: any) => [`₹${Number(val).toLocaleString()}`, name === 'revenue' ? 'Sales Revenue' : 'Expenses']}
                  />
                  <Area type="monotone" dataKey="revenue" name="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#revGrad)" />
                  <Area type="monotone" dataKey="expense" name="expense" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#expGrad)" />
                  <Legend verticalAlign="top" height={30} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 border-border">
            <CardHeader>
              <CardTitle className="text-sm sm:text-base font-semibold">{t('dashboard.expenseDistribution')}</CardTitle>
              <CardDescription className="text-xs">{t('dashboard.expenseDistributionDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.expenseBreakdown || []}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="total_amount"
                    nameKey="category"
                  >
                    {(data?.expenseBreakdown || []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Total Spent']}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Chart Row 2: 6-Month Monthly Comparison (Bar Chart) + Daily Net Profit Curve (Line Chart) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Monthly Comparison Multi-Bar Chart */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-sm sm:text-base font-semibold">Monthly Performance Comparison (Last 6 Months)</CardTitle>
              <CardDescription className="text-xs">Bar chart comparing monthly sales income against cumulative costs</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.monthlyComparison || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="month_label" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                    formatter={(val: any, name: any) => [`₹${Number(val).toLocaleString()}`, name === 'revenue' ? 'Sales Revenue' : name === 'expense' ? 'Expenses' : 'Net Profit']}
                  />
                  <Bar dataKey="revenue" name="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="expense" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Legend verticalAlign="top" height={30} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Daily Net Profit Trajectory (Line Chart) */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-sm sm:text-base font-semibold">14-Day Net Profit Trajectory</CardTitle>
              <CardDescription className="text-xs">Daily gain fluctuation line showing pure profit after deducting all expenses</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.dailyProfitTrend || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="date_label" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Net In-Hand Profit']}
                  />
                  <Line type="monotone" dataKey="net_profit" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Chart Row 3: Order Status Funnel (Donut) + Quail Batch Population Distribution (Horizontal Bar) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Order Status Distribution */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-sm sm:text-base font-semibold">Orders Fulfillment & Status Breakdown</CardTitle>
              <CardDescription className="text-xs">Volume distribution of orders across delivery statuses</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.orderStatusDistribution || []}
                    cx="50%"
                    cy="45%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="order_status"
                  >
                    {(data?.orderStatusDistribution || []).map((entry, index) => (
                      <Cell
                        key={`status-${index}`}
                        fill={STATUS_COLORS[entry.order_status] || PALETTE[index % PALETTE.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                    formatter={(val: any, _name: any, item: any) => [
                      `${val} Orders (₹${Number(item.payload.total_value).toLocaleString()})`,
                      'Count',
                    ]}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quail Flock Population & Daily Feed Requirements (Bar Chart) */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-sm sm:text-base font-semibold">Quail Flock Batches & Feed Requirements</CardTitle>
              <CardDescription className="text-xs">Bird populations across farm sheds and daily kg feed consumption</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.flockDistribution || []} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
                  <XAxis type="number" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis dataKey="batch_name" type="category" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} width={100} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                    formatter={(val: any, name: any) => [
                      name === 'current_count' ? `${Number(val).toLocaleString()} Quails` : `${val} kg/day`,
                      name === 'current_count' ? 'Live Quails' : 'Daily Feed',
                    ]}
                  />
                  <Bar dataKey="current_count" name="current_count" fill="#10b981" radius={[0, 4, 4, 0]} />
                  <Legend verticalAlign="top" height={25} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
