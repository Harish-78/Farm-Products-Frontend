import { useCallback, useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLivestockStore } from '@/stores/useLivestockStore';
import { Bird, Plus, RefreshCw, Edit, Check, Trash2, ChevronDown, Loader2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export default function QuailsPage() {
  // ---- Zustand store: single source of truth for flock data ----
  const {
    batches,
    loading,
    fetchBatches,
    createBatch,
    updateBatch,
    deleteBatch,
  } = useLivestockStore();

  // Load flock data on mount
  useEffect(() => {
    void fetchBatches();
  }, [fetchBatches]);

  // ---- Ephemeral form / UI state (kept local) ----
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [animalType, setAnimalType] = useState('Quail');
  const [batchName, setBatchName] = useState('');
  const [currentCount, setCurrentCount] = useState<number>(500);
  const [mortalityCount, setMortalityCount] = useState<number>(0);
  const [feedGrams, setFeedGrams] = useState<number>(28);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Inline edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editCount, setEditCount] = useState<number>(0);
  const [editMortality, setEditMortality] = useState<number>(0);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const handleRefresh = useCallback(() => {
    void fetchBatches();
  }, [fetchBatches]);

  const validateCreateForm = useCallback((): string | null => {
    if (!batchName.trim()) {
      return 'Batch name / shed identifier is required.';
    }
    if (Number.isNaN(Number(currentCount)) || Number(currentCount) <= 0) {
      return 'Live bird count must be greater than 0.';
    }
    if (Number.isNaN(Number(feedGrams)) || Number(feedGrams) <= 0) {
      return 'Feed per bird must be greater than 0 grams per day.';
    }
    if (Number.isNaN(Number(mortalityCount)) || Number(mortalityCount) < 0) {
      return 'Mortality count cannot be negative.';
    }
    if (Number(mortalityCount) > Number(currentCount)) {
      return 'Mortality count cannot exceed live bird count.';
    }
    return null;
  }, [batchName, currentCount, feedGrams, mortalityCount]);

  const handleCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isCreating) return;

      const validationMessage = validateCreateForm();
      if (validationMessage) {
        setFormError(validationMessage);
        return;
      }

      setFormError(null);
      setIsCreating(true);

      try {
        await createBatch({
          animal_type: animalType,
          batch_name: batchName.trim(),
          current_count: Number(currentCount),
          mortality_count: Number(mortalityCount),
          avg_daily_feed_per_bird_grams: Number(feedGrams),
          notes: notes.trim(),
        });
        setShowAddModal(false);
        setBatchName('');
        setNotes('');
        setFormError(null);
      } catch (err: unknown) {
        setFormError(getErrorMessage(err, 'Failed to add flock'));
      } finally {
        setIsCreating(false);
      }
    },
    [isCreating, validateCreateForm, createBatch, animalType, batchName, currentCount, mortalityCount, feedGrams, notes],
  );

  const handleSaveEdit = useCallback(
    async (id: number) => {
      if (updatingId !== null) return;

      if (Number.isNaN(Number(editCount)) || Number(editCount) < 0) {
        alert('Live bird count cannot be negative.');
        return;
      }
      if (Number.isNaN(Number(editMortality)) || Number(editMortality) < 0) {
        alert('Mortality count cannot be negative.');
        return;
      }
      if (Number.isNaN(Number(editMortality)) || Number(editMortality) > Number(editCount)) {
        alert('Mortality count cannot exceed live bird count.');
        return;
      }

      setUpdatingId(id);
      try {
        await updateBatch(id, {
          current_count: Number(editCount),
          mortality_count: Number(editMortality),
        });
        setEditingId(null);
      } catch (err: unknown) {
        alert(getErrorMessage(err, 'Update failed'));
      } finally {
        setUpdatingId(null);
      }
    },
    [updatingId, editCount, editMortality, updateBatch],
  );

  const handleDelete = useCallback((id: number) => {
    setDeleteConfirmId(id);
  }, []);

  const handleConfirmDelete = useCallback(
    async (id: number) => {
      try {
        await deleteBatch(id);
        setDeleteConfirmId(null);
      } catch (err: unknown) {
        setDeleteConfirmId(null);
        alert(getErrorMessage(err, 'Delete failed'));
      }
    },
    [deleteBatch],
  );

  const totalQuails = batches.reduce((acc, b) => acc + Number(b.current_count || 0), 0);
  const totalMortality = batches.reduce((acc, b) => acc + Number(b.mortality_count || 0), 0);
  const totalDailyFeedKg = batches.reduce(
    (acc, b) => acc + Number(b.calculated_daily_feed_kg || 0),
    0,
  );

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
            <Button
              variant="outline"
              size="sm"
              disabled={loading || isCreating || updatingId !== null}
              onClick={handleRefresh}
              className="gap-1.5 flex-1 sm:flex-initial justify-center"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button
              size="sm"
              disabled={isCreating}
              onClick={() => {
                setFormError(null);
                setShowAddModal((prev) => !prev);
              }}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white flex-1 sm:flex-initial justify-center"
            >
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
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {totalQuails.toLocaleString()} Birds
              </div>
              <p className="text-xs text-muted-foreground mt-1">Currently feeding on farm</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase font-medium text-muted-foreground">
                Total Daily Feed Consumption
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                {totalDailyFeedKg.toFixed(2)} kg / day
              </div>
              <p className="text-xs text-muted-foreground mt-1">Calculated from bird count & daily feed ratio</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase font-medium text-muted-foreground">Recorded Mortality</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                {totalMortality.toLocaleString()} Birds
              </div>
              <p className="text-xs text-muted-foreground mt-1">Tracked for health monitoring</p>
            </CardContent>
          </Card>
        </div>

        {/* Add Modal Form */}
        {showAddModal && (
          <Card className="border-emerald-500/30 bg-card shadow-md animate-in fade-in duration-200">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Register New Livestock / Quail Batch</CardTitle>
              <CardDescription className="text-xs">
                Supports quails, country chickens, and any future poultry business expansions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} noValidate className="space-y-4">
                {formError && (
                  <div className="p-2.5 rounded-md bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Animal / Category</Label>
                    <div className="relative">
                      <select
                        value={animalType}
                        disabled={isCreating}
                        onChange={(e) => setAnimalType(e.target.value)}
                        className="w-full h-9 appearance-none rounded-md border border-input bg-background pl-3 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="Quail">Quail</option>
                        <option value="Country Chicken">Country Chicken</option>
                        <option value="Duck">Duck</option>
                        <option value="Other">Other Livestock</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-semibold">Batch Name / Shed Identifier</Label>
                    <Input
                      placeholder="e.g. North Shed - Batch 01"
                      value={batchName}
                      disabled={isCreating}
                      onChange={(e) => {
                        setBatchName(e.target.value);
                        if (formError) setFormError(null);
                      }}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Live Bird Count</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="e.g. 250"
                      value={currentCount}
                      disabled={isCreating}
                      onChange={(e) => {
                        setCurrentCount(Number(e.target.value));
                        if (formError) setFormError(null);
                      }}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Feed per Bird (Grams / Day)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0.5"
                      placeholder="e.g. 25"
                      value={feedGrams}
                      disabled={isCreating}
                      onChange={(e) => {
                        setFeedGrams(Number(e.target.value));
                        if (formError) setFormError(null);
                      }}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Mortality Count</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="e.g. 0"
                      value={mortalityCount}
                      disabled={isCreating}
                      onChange={(e) => {
                        setMortalityCount(Number(e.target.value));
                        if (formError) setFormError(null);
                      }}
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-3">
                    <Label className="text-xs font-semibold">Notes / Shed Remarks (Optional)</Label>
                    <Input
                      placeholder="e.g. Routine health check completed"
                      value={notes}
                      disabled={isCreating}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isCreating}
                    onClick={() => {
                      setShowAddModal(false);
                      setFormError(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isCreating}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[136px]"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Saving...
                      </>
                    ) : (
                      'Save Flock Batch'
                    )}
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
            <CardDescription className="text-xs">
              Live count updates adjust your automated feed requirements instantly
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {loading && batches.length === 0 ? (
              <div className="flex h-48 items-center justify-center">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary" />
              </div>
            ) : (
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
                    {batches.map((b) => {
                      const liveCount = Number(b.current_count || 0);
                      const mortality = Number(b.mortality_count || 0);
                      const dailyFeedKg = Number(b.calculated_daily_feed_kg || 0);
                      const feedPerBirdGrams = Number(b.avg_daily_feed_per_bird_grams || 0);
                      const isEditingThis = editingId === b.id;
                      const isUpdatingThis = updatingId === b.id;

                      return (
                        <tr key={b.id} className="hover:bg-muted/40 transition-colors">
                          <td className="py-4 px-4 sm:px-0 font-medium">
                            <div className="font-semibold text-sm">{b.batch_name}</div>
                            <div className="text-[11px] text-muted-foreground">
                              {new Date(b.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-4 px-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              <Bird className="h-3 w-3" /> {b.animal_type}
                            </span>
                          </td>
                          <td className="py-4 px-2">
                            {isEditingThis ? (
                              <Input
                                type="number"
                                min="0"
                                placeholder="Count"
                                className="w-24 h-8 text-xs"
                                value={editCount}
                                disabled={isUpdatingThis}
                                onChange={(e) => setEditCount(Number(e.target.value))}
                              />
                            ) : (
                              <span className="font-bold text-base text-foreground">{liveCount.toLocaleString()}</span>
                            )}
                          </td>
                          <td className="py-4 px-2">
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              {dailyFeedKg.toFixed(2)} kg/day
                            </span>
                            <div className="text-[10px] text-muted-foreground">({feedPerBirdGrams}g / bird)</div>
                          </td>
                          <td className="py-4 px-2">
                            {isEditingThis ? (
                              <Input
                                type="number"
                                min="0"
                                placeholder="Mortality"
                                className="w-20 h-8 text-xs"
                                value={editMortality}
                                disabled={isUpdatingThis}
                                onChange={(e) => setEditMortality(Number(e.target.value))}
                              />
                            ) : (
                              <span className="text-amber-600 font-medium text-sm">{mortality}</span>
                            )}
                          </td>
                          <td className="py-4 px-4 sm:px-0 text-right">
                            {isEditingThis ? (
                              <Button
                                size="sm"
                                variant="default"
                                disabled={isUpdatingThis}
                                className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white min-w-[84px]"
                                onClick={() => void handleSaveEdit(b.id)}
                              >
                                {isUpdatingThis ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                                  </>
                                ) : (
                                  <>
                                    <Check className="h-3.5 w-3.5" /> Save
                                  </>
                                )}
                              </Button>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={updatingId !== null}
                                  className="h-8 gap-1 text-xs mr-2"
                                  onClick={() => {
                                    setEditingId(b.id);
                                    setEditCount(liveCount);
                                    setEditMortality(mortality);
                                  }}
                                >
                                  <Edit className="h-3 w-3" /> Quick Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={updatingId !== null}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {deleteConfirmId !== null && (
        <ConfirmDialog
          open={true}
          onOpenChange={() => setDeleteConfirmId(null)}
          title="Delete Livestock Batch"
          description="Are you sure you want to delete this livestock batch? This action cannot be undone."
          onConfirm={() => void handleConfirmDelete(deleteConfirmId)}
        />
      )}
    </AdminLayout>
  );
}