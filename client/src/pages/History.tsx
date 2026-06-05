import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchEntries } from '../api/entries';
import { fetchCategories } from '../api/categories';
import type { DailyEntry } from '@lifescore/shared';
import ScoreBadge from '../components/ScoreBadge';

type View = 'list' | 'calendar';

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}
function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function overallScore(entry: DailyEntry): number | null {
  if (!entry.scores?.length) return null;
  const sum = entry.scores.reduce((a, s) => a + s.score, 0);
  return Math.round((sum / entry.scores.length) * 10) / 10;
}
function heatColor(score: number | null) {
  if (score === null) return 'bg-muted text-muted-foreground';
  if (score >= 8) return 'bg-green-500/20 text-green-400 border-green-500/30';
  if (score >= 6) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  return 'bg-red-500/20 text-red-400 border-red-500/30';
}

export default function History() {
  const [view, setView] = useState<View>('list');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [minScore, setMinScore] = useState('');
  const [calMonth, setCalMonth] = useState(new Date());

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['entries', start, end, categoryId, minScore],
    queryFn: () =>
      fetchEntries({
        start: start || undefined,
        end: end || undefined,
        category_id: categoryId ? Number(categoryId) : undefined,
        min_score: minScore ? Number(minScore) : undefined,
      }),
  });

  const entryByDate = Object.fromEntries(entries.map((e) => [e.date.slice(0, 10), e]));

  function resetFilters() {
    setStart(''); setEnd(''); setCategoryId(''); setMinScore('');
  }

  const hasFilters = start || end || categoryId || minScore;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">History</h1>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(['list', 'calendar'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                view === v ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">From</label>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)}
            className="px-2 py-1.5 rounded border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">To</label>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)}
            className="px-2 py-1.5 rounded border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Category</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
            className="px-2 py-1.5 rounded border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">All</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Min score</label>
          <select value={minScore} onChange={(e) => setMinScore(e.target.value)}
            className="px-2 py-1.5 rounded border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Any</option>
            {[5, 6, 7, 8, 9].map((n) => <option key={n} value={n}>{n}+</option>)}
          </select>
        </div>
        {hasFilters && (
          <button onClick={resetFilters}
            className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Clear
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-muted rounded-lg" />)}
        </div>
      ) : view === 'list' ? (
        <ListView entries={entries} entryByDate={entryByDate} />
      ) : (
        <CalendarView
          month={calMonth}
          setMonth={setCalMonth}
          entryByDate={entryByDate}
          heatColor={heatColor}
          overallScore={overallScore}
        />
      )}
    </div>
  );
}

function ListView({ entries }: { entries: DailyEntry[]; entryByDate: Record<string, DailyEntry> }) {
  if (entries.length === 0)
    return <p className="text-center py-12 text-muted-foreground">No entries found.</p>;

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const score = overallScore(entry);
        const date = entry.date.slice(0, 10);
        return (
          <Link
            key={entry.id}
            to={`/entry?date=${date}`}
            className="block bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
                {entry.notes && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">{entry.notes}</p>
                )}
                {entry.scores && entry.scores.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {entry.scores.map((s) => (
                      <span key={s.id} className="text-xs text-muted-foreground">
                        {s.category_name}: <ScoreBadge score={s.score} size="sm" />
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="text-2xl font-bold text-foreground">{score ?? '—'}</span>
                <p className="text-xs text-muted-foreground">overall</p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function CalendarView({
  month, setMonth, entryByDate, heatColor, overallScore,
}: {
  month: Date;
  setMonth: (d: Date) => void;
  entryByDate: Record<string, DailyEntry>;
  heatColor: (s: number | null) => string;
  overallScore: (e: DailyEntry) => number | null;
}) {
  const firstDay = startOfMonth(month).getDay();
  const days = daysInMonth(month);
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];

  function prevMonth() { setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1)); }
  function nextMonth() { setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1)); }

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground">‹</button>
        <span className="text-sm font-semibold text-foreground">
          {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={nextMonth} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground">›</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-xs text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const dateStr = isoDate(new Date(month.getFullYear(), month.getMonth(), day));
          const entry = entryByDate[dateStr];
          const score = entry ? overallScore(entry) : null;
          const today = dateStr === isoDate(new Date());

          return (
            <Link
              key={dateStr}
              to={`/entry?date=${dateStr}`}
              className={`aspect-square flex flex-col items-center justify-center rounded-md border text-xs transition-colors
                ${entry ? heatColor(score) : 'border-transparent text-muted-foreground hover:bg-muted'}
                ${today ? 'ring-2 ring-primary ring-offset-1 ring-offset-card' : ''}
              `}
            >
              <span className="font-medium">{day}</span>
              {score !== null && <span className="text-[10px] leading-none opacity-80">{score}</span>}
            </Link>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-4 justify-end">
        {[['≥8', 'bg-green-500/20 border-green-500/30'], ['≥6', 'bg-yellow-500/20 border-yellow-500/30'], ['<6', 'bg-red-500/20 border-red-500/30']].map(([label, cls]) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className={`w-3 h-3 rounded border ${cls}`} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
