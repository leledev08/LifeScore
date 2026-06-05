import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchGoals, createGoal, deleteGoal } from '../api/goals';
import { fetchCategories } from '../api/categories';
import type { Goal } from '@lifescore/shared';

function progressColor(pct: number) {
  if (pct >= 100) return 'bg-green-500';
  if (pct >= 70)  return 'bg-yellow-500';
  return 'bg-red-500';
}

export default function Goals() {
  const [selectedCat, setSelectedCat] = useState('');
  const [targetScore, setTargetScore] = useState(7);
  const [formError, setFormError] = useState('');
  const qc = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: fetchGoals,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const goalCategoryIds = new Set((goals as Goal[]).map((g) => g.category_id));
  const availableCategories = categories.filter((c) => !goalCategoryIds.has(c.id));

  const createMutation = useMutation({
    mutationFn: () => createGoal({ category_id: Number(selectedCat), target_score: targetScore }),
    onSuccess: () => {
      setSelectedCat('');
      setTargetScore(7);
      setFormError('');
      qc.invalidateQueries({ queryKey: ['goals'] });
    },
    onError: (err: unknown) => {
      setFormError(
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Failed to create goal'
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCat) { setFormError('Select a category'); return; }
    createMutation.mutate();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Goals</h1>

      {/* Add goal form */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">New Goal</h2>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Category</label>
            <select
              value={selectedCat}
              onChange={(e) => { setSelectedCat(e.target.value); setFormError(''); }}
              className="px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select…</option>
              {availableCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Target ≥</label>
            <div className="flex items-center gap-2">
              <input
                type="range" min={1} max={10} step={1}
                value={targetScore}
                onChange={(e) => setTargetScore(Number(e.target.value))}
                className="w-28 accent-primary cursor-pointer"
              />
              <span className="text-sm font-bold text-foreground w-4 tabular-nums">{targetScore}</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Add Goal
          </button>
        </form>
        {formError && <p className="mt-2 text-sm text-red-500">{formError}</p>}
        {availableCategories.length === 0 && categories.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">All categories have goals.</p>
        )}
      </div>

      {/* Goals list */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1,2,3].map((i) => <div key={i} className="h-20 bg-muted rounded-lg" />)}
        </div>
      ) : (goals as Goal[]).length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">No goals yet. Add one above.</p>
      ) : (
        <div className="space-y-3">
          {(goals as Goal[]).map((goal) => {
            const avg = goal.current_average ? Number(goal.current_average) : null;
            const pct = avg !== null ? Math.min(100, Math.round((avg / goal.target_score) * 100)) : 0;
            const met = avg !== null && avg >= goal.target_score;

            return (
              <div key={goal.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-foreground">{goal.category_name}</span>
                      <span className="text-xs text-muted-foreground">≥ {goal.target_score}</span>
                      {met && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-500 font-medium">
                          Met
                        </span>
                      )}
                    </div>
                    {/* Progress bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${progressColor(pct)}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-20 text-right shrink-0">
                        {avg !== null ? (
                          <>avg <span className="text-foreground font-medium">{avg.toFixed(1)}</span> / {goal.target_score}</>
                        ) : 'No data'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Based on last 30 days</p>
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(goal.id)}
                    disabled={deleteMutation.isPending}
                    className="text-muted-foreground hover:text-red-500 transition-colors text-lg leading-none shrink-0 mt-0.5"
                    title="Delete goal"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
