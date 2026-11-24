import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';
import { Wheat, Plus, AlertTriangle, Bell, Edit, Check, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface FeedItem {
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

export default function FeedsPage() {
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [alertSuccessMsg, setAlertSuccessMsg] = useState('');

  // Form states
  const [feedName, setFeedName] = useState('');
  const [targetAnimal, setTargetAnimal] = useState('Quail');
  const [stockKg, setStockKg] = useState<number>(500);
  const [costKg, setCostKg] = useState<number>(36.5);
  const [alertDays, setAlertDays] = useState<number>(10);
  const [supplier, setSupplier] = useState('');

  // Quick edit stock state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStock, setEditStock] = useState<number>(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const fetchFeeds = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; feeds: FeedItem[] }>('/farm/feeds');
      setFeeds(res.feeds || []);
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
        const res = await apiFetch<{ success: boolean; feeds: FeedItem[] }>('/farm/feeds');
        if (mounted) {
          setFeeds(res.feeds || []);
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
  }, []);

  const handleCreateFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/farm/feeds', {
        method: 'POST',
        body: JSON.stringify({
          feed_name: feedName,
          target_animal: targetAnimal,
          current_stock_kg: Number(stockKg),
          cost_per_kg: Number(costKg),
          reorder_alert_days: Number(alertDays),
          supplier_name: supplier,
        }),
      });
      setShowAddModal(false);
      setFeedName('');
      fetchFeeds();
    } catch (err: any) {
      alert(err.message || 'Failed to add feed');
    }
  };

  const handleSaveStock = async (id: number) => {
    try {
      await apiFetch(`/farm/feeds/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ current_stock_kg: editStock }),
      });
      setEditingId(null);
      fetchFeeds();
    } catch (err: any) {
      alert(err.message || 'Update failed');
    }
  };

  const handleDelete = (id: number) => {
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = async (id: number) => {
    try {
      await apiFetch(`/farm/feeds/${id}`, { method: 'DELETE' });
      setDeleteConfirmId(null);
      fetchFeeds();
    } catch (err: any) {
      setDeleteConfirmId(null);
      alert(err.message || 'Delete failed');
    }
  };

  const handleTriggerAlertCheck = async () => {
    try {
      setAlertSuccessMsg('');
      const res = await apiFetch<{ success: boolean; message: string }>('/farm/feeds/check-alert', {
        method: 'POST',
      });
      setAlertSuccessMsg(res.message);
      setTimeout(() => setAlertSuccessMsg(''), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to test alert cron');
    }
  };

  const totalStockKg = feeds.reduce((acc, f) => acc + Number(f.current_stock_kg), 0);
  const totalFeedValue = feeds.reduce((acc, f) => acc + Number(f.current_stock_kg) * Number(f.cost_per_kg), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Warehouse Feeds & Automated Alerts</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Live stock in hand, days remaining forecast, and automated node-cron 10-day email reminders.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Button variant="outline" size="sm" onClick={handleTriggerAlertCheck} className="gap-1.5 text-xs flex-1 sm:flex-initial justify-center">
              <Bell className="h-3.5 w-3.5 text-amber-500" /> Test 10-Day Alert
            </Button>
            <Button size="sm" onClick={() => setShowAddModal(!showAddModal)} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white flex-1 sm:flex-initial justify-center">
              <Plus className="h-4 w-4" /> Add Feed Stock
            </Button>
          </div>
        </div>

        {alertSuccessMsg && (
          <div className="p-3.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20 animate-in fade-in">
            {alertSuccessMsg}
          </div>
        )}

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase font-medium text-muted-foreground">Total Feed Stock in Warehouse</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{totalStockKg.toLocaleString()} kg</div>
              <p className="text-xs text-muted-foreground mt-1">Available in bags & bins</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase font-medium text-muted-foreground">Total Value of Feed In Hand</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">₹{totalFeedValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Asset value of current feed inventory</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase font-medium text-muted-foreground">Automated Email Notification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">10 Days Prior</div>
              <p className="text-xs text-muted-foreground mt-1">Cron checks daily at 07:00 AM via Nodemailer</p>
            </CardContent>
          </Card>
        </div>

        {/* Add Feed Modal */}
        {showAddModal && (
          <Card className="border-emerald-500/30 bg-card shadow-md animate-in fade-in duration-200">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Register New Feed Inventory Item</CardTitle>
              <CardDescription className="text-xs">Add bags or bulk mash for quails or other livestock</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateFeed} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-semibold">Feed Name / Type</Label>
                    <Input
                      placeholder="e.g. Quail Layer Mash (High Protein)"
                      value={feedName}
                      onChange={(e) => setFeedName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Target Livestock</Label>
                    <select
                      value={targetAnimal}
                      onChange={(e) => setTargetAnimal(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Quail">Quail</option>
                      <option value="Country Chicken">Country Chicken</option>
                      <option value="Duck">Duck</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Current Quantity In Stock (kg)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={stockKg}
                      onChange={(e) => setStockKg(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Cost per kg (₹)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={costKg}
                      onChange={(e) => setCostKg(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Email Alert Threshold (Days)</Label>
                    <Input
                      type="number"
                      value={alertDays}
                      onChange={(e) => setAlertDays(Number(e.target.value))}
                      placeholder="10 days"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Feed Supplier Name (Optional)</Label>
                  <Input
                    placeholder="e.g. Tamilnadu Feeds & Agro, Madurai"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Save Feed Inventory
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Feeds Table */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Warehouse Feed Stocks & Depletion Estimator</CardTitle>
            <CardDescription className="text-xs">
              Days remaining is calculated automatically based on your active quail population and consumption rate
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                    <th className="pb-3 px-4 sm:px-0 font-medium">Feed Description</th>
                    <th className="pb-3 px-2 font-medium">Stock in Warehouse</th>
                    <th className="pb-3 px-2 font-medium">Daily Consumption</th>
                    <th className="pb-3 px-2 font-medium">Cost / kg</th>
                    <th className="pb-3 px-2 font-medium">Runway Status</th>
                    <th className="pb-3 px-4 sm:px-0 font-medium text-right">Quick Stock Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {feeds.map((f) => (
                    <tr key={f.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-4 px-4 sm:px-0 font-medium">
                        <div className="font-semibold text-sm flex items-center gap-1.5">
                          <Wheat className="h-4 w-4 text-amber-500" /> {f.feed_name}
                        </div>
                        <div className="text-[11px] text-muted-foreground">For: {f.target_animal} | Supplier: {f.supplier_name || 'N/A'}</div>
                      </td>
                      <td className="py-4 px-2">
                        {editingId === f.id ? (
                          <Input
                            type="number"
                            className="w-24 h-8 text-xs"
                            value={editStock}
                            onChange={(e) => setEditStock(Number(e.target.value))}
                          />
                        ) : (
                          <span className="font-bold text-base text-foreground">{Number(f.current_stock_kg).toLocaleString()} kg</span>
                        )}
                      </td>
                      <td className="py-4 px-2">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">{f.daily_consumption_kg.toFixed(1)} kg / day</span>
                      </td>
                      <td className="py-4 px-2 font-medium">
                        ₹{f.cost_per_kg} / kg
                      </td>
                      <td className="py-4 px-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold ${
                            f.is_low_stock
                              ? 'bg-destructive/15 text-destructive border border-destructive/25'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {f.is_low_stock && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                          {f.days_remaining} Days Remaining
                        </span>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {f.is_low_stock ? 'Alert active (<= 10 days)' : 'Healthy stock'}
                        </div>
                      </td>
                      <td className="py-4 px-4 sm:px-0 text-right">
                        {editingId === f.id ? (
                          <Button size="sm" variant="default" className="h-8 gap-1 bg-emerald-600 text-white" onClick={() => handleSaveStock(f.id)}>
                            <Check className="h-3.5 w-3.5" /> Save Stock
                          </Button>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1 text-xs mr-2"
                              onClick={() => {
                                setEditingId(f.id);
                                setEditStock(Number(f.current_stock_kg));
                              }}
                            >
                              <Edit className="h-3 w-3" /> Update Stock
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(f.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              title="Delete Feed Item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {deleteConfirmId && (
        <ConfirmDialog
          open={true}
          onOpenChange={() => setDeleteConfirmId(null)}
          title="Delete Feed Item"
          description="Are you sure you want to delete this feed stock record? This action cannot be undone."
          onConfirm={() => handleConfirmDelete(deleteConfirmId!)}
        />
      )}
    </AdminLayout>
  );
}
