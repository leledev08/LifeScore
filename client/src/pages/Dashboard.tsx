import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchOverallAnalytics } from '../api/analytics';
import { fetchGoals } from '../api/goals';
import { fetchEntryByDate } from '../api/entries';
import ScoreBadge, { scoreBarColor } from '../components/ScoreBadge';
import RadarChart from '../components/charts/RadarChart';
import TrendChart from '../components/charts/TrendChart';
import type { Goal } from '@lifescore/shared';

const DAYS_OPTIONS = [7, 14, 30, 60, 90];

export default function Dashboard() {
  const [trendDays, setTrendDays] = useState(30);

  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', 'overall', trendDays],
    queryFn: () => fetchOverallAnalytics(trendDays),
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: fetchGoals,
  });

  const todayISO = new Date().toISOString().slice(0, 10);
  const [radarDate, setRadarDate] = useState(todayISO);

  const { data: radarEntry } = useQuery({
    queryKey: ['entry', radarDate],
    queryFn: () => fetchEntryByDate(radarDate),
  });

  if (isLoading) return <Skeleton />;
  if (error || !data) return <ErrorState />;

  const trendData = data.trend.map((t) => ({
    date: t.date.slice(0, 10),
    score: Number(t.overall_score),
  }));

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <Link
          to="/entry"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + Today's Entry
        </Link>
      </div>

      {/* Daily Radar */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Daily Snapshot</h2>
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => { const d = new Date(radarDate + 'T12:00:00'); d.setDate(d.getDate() - 1); setRadarDate(d.toISOString().slice(0, 10)); }}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors text-lg leading-none"
          >‹</button>
          <input
            type="date"
            value={radarDate}
            max={todayISO}
            onChange={(e) => setRadarDate(e.target.value)}
            className="px-2 py-1 rounded border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={() => { if (radarDate >= todayISO) return; const d = new Date(radarDate + 'T12:00:00'); d.setDate(d.getDate() + 1); setRadarDate(d.toISOString().slice(0, 10)); }}
            disabled={radarDate >= todayISO}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors text-lg leading-none disabled:opacity-30"
          >›</button>
          <span className="text-xs text-muted-foreground">
            {new Date(radarDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>
        {radarEntry?.scores?.length ? (
          <RadarChart data={radarEntry.scores.map((s) => ({ category: s.category_name ?? '', score: s.score }))} />
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No entry for this date. <Link to="/entry" className="text-primary hover:underline">Add one</Link></p>
        )}
      </div>

      {/* Category breakdown */}
      {data.category_stats.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Category Averages
          </h2>
          <div className="space-y-3">
            {data.category_stats.map((cat) => (
              <div key={cat.category_id} className="flex items-center gap-3">
                <span className="w-28 text-sm text-foreground truncate">{cat.category_name}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${scoreBarColor(Number(cat.average))}`}
                    style={{ width: `${(Number(cat.average) / 10) * 100}%` }}
                  />
                </div>
                <ScoreBadge score={Number(cat.average)} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overall trend */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Overall Score Trend</h2>
          <select value={trendDays} onChange={(e) => setTrendDays(Number(e.target.value))}
            className="px-2 py-1 rounded border border-input bg-background text-foreground text-xs focus:outline-none">
            {DAYS_OPTIONS.map((d) => <option key={d} value={d}>{d} days</option>)}
          </select>
        </div>
        <TrendChart
          data={trendData}
          height={220}
          pastDays={trendDays}
        />
      </div>

      {/* Goals progress */}
      {(goals as Goal[]).length > 0 && (
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Goals</h2>
            <Link to="/goals" className="text-xs text-primary hover:underline">Manage</Link>
          </div>
          <div className="space-y-3">
            {(goals as Goal[]).map((goal) => {
              const avg = goal.current_average ? Number(goal.current_average) : null;
              const pct = avg !== null ? Math.min(100, Math.round((avg / goal.target_score) * 100)) : 0;
              const met = avg !== null && avg >= goal.target_score;
              return (
                <div key={goal.id} className="flex items-center gap-3">
                  <span className="w-28 text-sm text-foreground truncate">{goal.category_name}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${scoreBarColor(avg)}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-16 text-right shrink-0">
                    {avg !== null ? <><span className={met ? 'text-green-500 font-bold' : 'text-foreground font-medium'}>{avg.toFixed(1)}</span> / {goal.target_score}</> : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data.category_stats.length === 0 && trendData.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No data yet</p>
          <p className="text-sm mt-1">
            <Link to="/entry" className="text-primary hover:underline">Add today's entry</Link> to get started.
          </p>
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-8 max-w-5xl animate-pulse">
      <div className="h-8 w-40 bg-muted rounded" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-lg" />
        ))}
      </div>
      <div className="h-64 bg-muted rounded-lg" />
    </div>
  );
}

function ErrorState() {
  return (
    <div className="text-center py-16 text-muted-foreground">
      <p>Failed to load dashboard data.</p>
    </div>
  );
}
