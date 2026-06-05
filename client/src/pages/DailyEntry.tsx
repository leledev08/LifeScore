import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { fetchCategories } from '../api/categories';
import { fetchEntryByDate, createEntry, updateEntry } from '../api/entries';
import ScoreSlider from '../components/ScoreSlider';
import { useToast } from '../components/Toast';
import type { Category } from '@lifescore/shared';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function groupBySection(categories: Category[]) {
  const sections: Record<string, Category[]> = {};
  for (const cat of categories) {
    const key = cat.group_name ?? 'Custom';
    (sections[key] ??= []).push(cat);
  }
  return sections;
}

export default function DailyEntry() {
  const [searchParams] = useSearchParams();
  const [date, setDate] = useState(searchParams.get('date') ?? todayISO());
  const [scores, setScores] = useState<Record<number, number>>({});
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();
  const [activeIds, setActiveIds] = useState<Set<number>>(new Set());

  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const { data: existingEntry, isLoading: entryLoading } = useQuery({
    queryKey: ['entry', date],
    queryFn: () => fetchEntryByDate(date),
  });

  // Initialise sliders when categories or existing entry loads
  useEffect(() => {
    if (!categories.length) return;
    const initScores: Record<number, number> = {};
    const initActive = new Set<number>();
    for (const cat of categories) {
      const existing = existingEntry?.scores?.find((s) => s.category_id === cat.id);
      initScores[cat.id] = existing?.score ?? 5;
      // if editing existing entry: active only if score exists; new entry: all active by default
      if (existingEntry ? existing !== undefined : true) initActive.add(cat.id);
    }
    setScores(initScores);
    setActiveIds(initActive);
    setNotes(existingEntry?.notes ?? '');
    setSaved(false);
  }, [categories, existingEntry]);

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => {
      const scorePayload = Object.entries(scores)
        .filter(([id]) => activeIds.has(Number(id)))
        .map(([id, score]) => ({ category_id: Number(id), score }));
      if (existingEntry) {
        return updateEntry(existingEntry.id, { notes: notes || undefined, scores: scorePayload });
      }
      return createEntry({ date, notes: notes || undefined, scores: scorePayload });
    },
    onSuccess: () => {
      setSaved(true);
      toast(existingEntry ? 'Entry updated' : 'Entry saved');
      qc.invalidateQueries({ queryKey: ['entry', date] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      qc.invalidateQueries({ queryKey: ['entries'] });
    },
    onError: () => toast('Failed to save entry', 'error'),
  });

  const isLoading = catsLoading || entryLoading;
  const sections = groupBySection(categories);
  const activeScores = Object.entries(scores).filter(([id]) => activeIds.has(Number(id))).map(([, v]) => v);
  const overall = activeScores.length > 0
    ? (activeScores.reduce((a, b) => a + b, 0) / activeScores.length).toFixed(1)
    : null;

  const errorMsg = error
    ? (error as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Save failed'
    : null;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Daily Entry</h1>
        {overall && (
          <span className="text-sm text-muted-foreground">
            Overall: <span className="text-foreground font-bold">{overall}</span> / 10
          </span>
        )}
      </div>

      {/* Date picker */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-foreground">Date</label>
        <input
          type="date"
          value={date}
          max={todayISO()}
          onChange={(e) => { setDate(e.target.value); setSaved(false); }}
          className="px-3 py-1.5 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {existingEntry && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Editing existing entry</span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-muted rounded" />)}
        </div>
      ) : (
        <>
          {/* Score sections */}
          {Object.entries(sections).map(([section, cats]) => (
            <div key={section} className="bg-card border border-border rounded-lg p-5 space-y-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{section}</h2>
              {cats.map((cat) => (
                <ScoreSlider
                  key={cat.id}
                  label={cat.name}
                  value={scores[cat.id] ?? 5}
                  active={activeIds.has(cat.id)}
                  onChange={(v) => { setScores((s) => ({ ...s, [cat.id]: v })); setSaved(false); }}
                  onToggle={(on) => {
                    setActiveIds((prev) => { const next = new Set(prev); on ? next.add(cat.id) : next.delete(cat.id); return next; });
                    setSaved(false);
                  }}
                />
              ))}
            </div>
          ))}

          {/* Notes */}
          <div className="bg-card border border-border rounded-lg p-5 space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Notes & Reflections
            </label>
            <textarea
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
              placeholder="How was your day? Any observations…"
              rows={4}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => mutate()}
              disabled={isPending}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Saving…' : existingEntry ? 'Update Entry' : 'Save Entry'}
            </button>
            {saved && <span className="text-sm text-green-500">Saved!</span>}
            {errorMsg && <span className="text-sm text-red-500">{errorMsg}</span>}
          </div>
        </>
      )}
    </div>
  );
}
