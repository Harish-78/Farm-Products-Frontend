import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';
import { Bird, Plus, RefreshCw, Edit, Check, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface LivestockBatch {
  id: number;
  animal_type: string;
  batch_name: string;
  current_count: number;
  mortality_count: number;
  avg_daily_feed_per_bird_grams: number;
  calculated_daily_feed_kg: number;
  notes: string;
  created_at: string;
}

export default function QuailsPage() {
  const [batches, setBatches] = useState<LivestockBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [animalType, setAnimalType] = useState('Quail');
  const [batchName, setBatchName] = useState('');
  const [currentCount, setCurrentCount] = useState<number>(500);
  const [mortalityCount, setMortalityCount] = useState<number>(0);
  const [feedGrams, setFeedGrams] = useState<number>(28);
  const [notes, setNotes] = useState('');

  // Inline edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editCount, setEditCount] = useState<number>(0);
  const [editMortality, setEditMortality] = useState<number>(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; livestock: LivestockBatch[] }>('/farm/livestock');
      setBatches(res.livestock || []);
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
        const res = await apiFetch<{ success: boolean; batches: LivestockBatch[] }>('/farm/livestock');
        if (mounted) {
          setBatches(res.batches || []);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/farm/livestock', {
        method: 'POST',
        body: JSON.stringify({
          animal_type: animalType,
          batch_name: batchName,
          current_count: Number(currentCount),
          mortality_count: Number(mortalityCount),
          avg_daily_feed_per_bird_grams: Number(feedGrams),
          notes,
        }),
      });
      setShowAddModal(false);
      setBatchName('');
      fetchBatches();
    } catch (err: any) {
      alert(err.message || 'Failed to add flock');
    }
  };

  const handleSaveEdit = async (id: number) => {
    try {
      await apiFetch(`/farm/livestock/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          current_count: editCount,
          mortality_count: editMortality,
        }),
      });
      setEditingId(null);
      fetchBatches();
    } catch (err: any) {
      alert(err.message || 'Update failed');
    }
  };

  const handleDelete = (id: number) => {
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = async (id: number) => {
    try {
      await apiFetch(`/farm/livestock/${id}`, { method: 'DELETE' });
      setDeleteConfirmId(null);
      fetchBatches();
    } catch (err: any) {
      setDeleteConfirmId(null);
      alert(err.message || 'Delete failed');
    }
  };

  const totalQuails = batches.reduce((acc, b) => acc + Number(b.current_count), 0);
  const totalMortality = batches.reduce((acc, b) => acc + Number(b.mortality_count), 0);
  const totalDailyFeedKg = batches.reduce((acc, b) => acc + Number(b.calculated_daily_feed_kg || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Quails & Livestock Inventory</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Live bird populations, daily feed consumption formulas, and mortality logs.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Button variant="outline" size="sm" onClick={fetchBatches} className="gap-1.5 flex-1 sm:flex-initial justify-center">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button size="sm" onClick={() => setShowAddModal(!showAddModal)} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white flex-1 sm:flex-initial justify-center">
              <Plus className="h-4 w-4" /> Add Flock / Batch
            </Button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase font-medium text-muted-foreground">Total Live Quails</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{totalQuails.toLocaleString()} Birds</div>
              <p className="text-xs text-muted-foreground mt-1">Currently feeding on farm</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase font-medium text-muted-foreground">Total Daily Feed Consumption</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{totalDailyFeedKg.toFixed(1)} kg / day</div>
              <p className="text-xs text-muted-foreground mt-1">Calculated from bird count & daily feed ratio</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase font-medium text-muted-foreground">Recorded Mortality</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{totalMortality.toLocaleString()} Birds</div>
              <p className="text-xs text-muted-foreground mt-1">Tracked for health monitoring</p>
            </CardContent>
          </Card>
        </div>

        {/* Add Modal Form */}
        {showAddModal && (
          <Card className="border-emerald-500/30 bg-card shadow-md animate-in fade-in duration-200">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Register New Livestock / Quail Batch</CardTitle>
              <CardDescription className="text-xs">Supports quails, country chickens, and any future poultry business expansions</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Animal / Category</Label>
                    <select
                      value={animalType}
                      onChange={(e) => setAnimalType(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Quail">Quail (Japanese / Coturnix)</option>
                      <option value="Country Chicken">Country Chicken (Nattu Kozhi)</option>
                      <option value="Duck">Duck / Kadaknath</option>
                      <option value="Other">Other Livestock</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-semibold">Batch Name / Shed Identifier</Label>
                    <Input
                      placeholder="e.g. Shed 1 - Layer Quails Batch A"
                      value={batchName}
                      onChange={(e) => setBatchName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Live Bird Count</Label>
                    <Input
                      type="number"
                      value={currentCount}
                      onChange={(e) => setCurrentCount(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Feed per Bird (Grams / Day)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={feedGrams}
                      onChange={(e) => setFeedGrams(Number(e.target.value))}
                      placeholder="28g standard for quails"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Mortality Count</Label>
                    <Input
                      type="number"
                      value={mortalityCount}
                      onChange={(e) => setMortalityCount(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-3">
                    <Label className="text-xs font-semibold">Notes / Shed Remarks (Optional)</Label>
                    <Input
                      placeholder="e.g. Vaccinated on day 14, high laying rate"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Save Flock Batch
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Batches Table */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Flocks & Quail Batches</CardTitle>
            <CardDescription className="text-xs">Live count updates adjust your automated feed requirements instantly</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                    <th className="pb-3 px-4 sm:px-0 font-medium">Batch / Shed Name</th>
                    <th className="pb-3 px-2 font-medium">Animal Type</th>
                    <th className="pb-3 px-2 font-medium">Live Quails Count</th>
                    <th className="pb-3 px-2 font-medium">Daily Feed Need</th>
                    <th className="pb-3 px-2 font-medium">Mortality</th>
                    <th className="pb-3 px-4 sm:px-0 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {batches.map((b) => (
                    <tr key={b.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-4 px-4 sm:px-0 font-medium">
                        <div className="font-semibold text-sm">{b.batch_name}</div>
                        <div className="text-[11px] text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="py-4 px-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <Bird className="h-3 w-3" /> {b.animal_type}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        {editingId === b.id ? (
                          <Input
                            type="number"
                            className="w-24 h-8 text-xs"
                            value={editCount}
                            onChange={(e) => setEditCount(Number(e.target.value))}
                          />
                        ) : (
                          <span className="font-bold text-base text-foreground">{b.current_count.toLocaleString()}</span>
                        )}
                      </td>
                      <td className="py-4 px-2">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">{b.calculated_daily_feed_kg} kg/day</span>
                        <div className="text-[10px] text-muted-foreground">({b.avg_daily_feed_per_bird_grams}g / bird)</div>
                      </td>
                      <td className="py-4 px-2">
                        {editingId === b.id ? (
                          <Input
                            type="number"
                            className="w-20 h-8 text-xs"
                            value={editMortality}
                            onChange={(e) => setEditMortality(Number(e.target.value))}
                          />
                        ) : (
                          <span className="text-amber-600 font-medium text-sm">{b.mortality_count}</span>
                        )}
                      </td>
                      <td className="py-4 px-4 sm:px-0 text-right">
                        {editingId === b.id ? (
                          <Button size="sm" variant="default" className="h-8 gap-1 bg-emerald-600 text-white" onClick={() => handleSaveEdit(b.id)}>
                            <Check className="h-3.5 w-3.5" /> Save
                          </Button>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1 text-xs mr-2"
                              onClick={() => {
                                setEditingId(b.id);
                                setEditCount(b.current_count);
                                setEditMortality(b.mortality_count);
                              }}
                            >
                              <Edit className="h-3 w-3" /> Quick Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(b.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              title="Delete Batch"
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
          title="Delete Livestock Batch"
          description="Are you sure you want to delete this livestock batch? This action cannot be undone."
          onConfirm={() => handleConfirmDelete(deleteConfirmId!)}
        />
      )}
    </AdminLayout>
  );
}
