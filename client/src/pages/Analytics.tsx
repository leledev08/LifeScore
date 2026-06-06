import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchOverallAnalytics, fetchCategoryAnalytics, fetchHeatmap, fetchComparison } from '../api/analytics';
import { fetchCategories } from '../api/categories';
import { fetchEntryByDate } from '../api/entries';
import { PieChart, Pie, Cell } from 'recharts';
import TrendChart from '../components/charts/TrendChart';
import ComparisonChart from '../components/charts/ComparisonChart';
import RadarChart from '../components/charts/RadarChart';
import HeatmapCalendar from '../components/charts/HeatmapCalendar';
import StatCard from '../components/StatCard';

const DAYS_OPTIONS = [7, 14, 30, 60, 90];
const COLORS = ['#a78bfa','#34d399','#fbbf24','#f87171','#60a5fa','#fb923c','#e879f9','#2dd4bf'];

export default function Analytics() {
  const [days] = useState(30);
  const [heatYear, setHeatYear] = useState(new Date().getFullYear());
  const [compIds, setCompIds] = useState<number[]>([]);
  const [compDays, setCompDays] = useState(30);
  const [radarDate, setRadarDate] = useState(new Date().toISOString().slice(0, 10));
  const [trendDays, setTrendDays] = useState(30);

  const { data: overall, isLoading: overallLoading } = useQuery({
    queryKey: ['analytics', 'overall', days],
    queryFn: () => fetchOverallAnalytics(days),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const { data: heatmap = [] } = useQuery({
    queryKey: ['analytics', 'heatmap', heatYear],
    queryFn: () => fetchHeatmap(heatYear),
  });

  const { data: compData = [] } = useQuery({
    queryKey: ['analytics', 'comparison', compIds, compDays],
    queryFn: () => fetchComparison(compIds, compDays),
    enabled: compIds.length > 0,
  });

  const { data: radarEntry } = useQuery({
    queryKey: ['entry', radarDate],
    queryFn: () => fetchEntryByDate(radarDate),
  });

  const radarData = radarEntry?.scores?.map((s) => ({
    category: s.category_name ?? '',
    score: s.score,
  })) ?? [];

  function toggleCompCategory(id: number) {
    setCompIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 8 ? [...prev, id] : prev
    );
  }

  return (
    <div className="max-w-5xl space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Analytics</h1>

      {/* Summary stats */}
      {overall && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Daily avg" value={overall.daily_average ? Number(overall.daily_average).toFixed(1) : '—'} />
          <StatCard label="Weekly avg" value={overall.weekly_average ? Number(overall.weekly_average).toFixed(1) : '—'} />
          <StatCard label="Monthly avg" value={overall.monthly_average ? Number(overall.monthly_average).toFixed(1) : '—'} />
          <StatCard label="Streak" value={overall.current_streak} sub="days" />
        </div>
      )}

      {/* Radar chart */}
      <Section title="Daily Snapshot">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => {
              const d = new Date(radarDate + 'T12:00:00');
              d.setDate(d.getDate() - 1);
              setRadarDate(d.toISOString().slice(0, 10));
            }}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors text-lg leading-none"
          >‹</button>
          <input
            type="date"
            value={radarDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setRadarDate(e.target.value)}
            className="px-2 py-1 rounded border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={() => {
              const today = new Date().toISOString().slice(0, 10);
              if (radarDate >= today) return;
              const d = new Date(radarDate + 'T12:00:00');
              d.setDate(d.getDate() + 1);
              setRadarDate(d.toISOString().slice(0, 10));
            }}
            disabled={radarDate >= new Date().toISOString().slice(0, 10)}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors text-lg leading-none disabled:opacity-30"
          >›</button>
          <span className="text-xs text-muted-foreground ml-1">
            {new Date(radarDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>
        {radarData.length > 0 ? (
          <RadarChart data={radarData} />
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No entry for this date.</p>
        )}
      </Section>

      {/* Overall trend */}
      <Section title="Overall Score Trend">
        <div className="flex justify-end mb-3">
          <select value={trendDays} onChange={(e) => setTrendDays(Number(e.target.value))}
            className="px-2 py-1 rounded border border-input bg-background text-foreground text-xs focus:outline-none">
            {DAYS_OPTIONS.map((d) => <option key={d} value={d}>{d} days</option>)}
          </select>
        </div>
        {overallLoading ? <ChartSkeleton /> : overall?.trend.length ? (
          <TrendChart
            data={overall.trend.map((t) => ({ date: t.date, score: Number(t.overall_score) }))}
            height={220}
            pastDays={trendDays}
          />
        ) : <Empty />}
      </Section>

      {/* Comparison chart */}
      <Section title="Multi-Category Comparison">
        <div className="mb-4 flex flex-wrap gap-2">
          {categories.map((cat, i) => (
            <button
              key={cat.id}
              onClick={() => toggleCompCategory(cat.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                compIds.includes(cat.id)
                  ? 'text-white border-transparent'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
              style={compIds.includes(cat.id) ? { backgroundColor: COLORS[i % COLORS.length] } : {}}
            >
              {cat.name}
            </button>
          ))}
          <select
            value={compDays}
            onChange={(e) => setCompDays(Number(e.target.value))}
            className="ml-auto px-2 py-1 rounded border border-input bg-background text-foreground text-xs focus:outline-none"
          >
            {DAYS_OPTIONS.map((d) => <option key={d} value={d}>{d} days</option>)}
          </select>
        </div>
        {compIds.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Select categories above to compare.</p>
        ) : compData.length === 0 ? (
          <Empty />
        ) : (
          <ComparisonChart data={compData} categoryIds={compIds} pastDays={compDays} />
        )}
      </Section>

      {/* Per-category charts */}
      {categories.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Category Trends</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat, i) => (
              <CategoryChart key={cat.id} categoryId={cat.id} name={cat.name} days={days} color={COLORS[i % COLORS.length]} />
            ))}
          </div>
        </div>
      )}

      {/* Heatmap */}
      <Section title="Activity Heatmap">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setHeatYear((y) => y - 1)}
            className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors"
          >‹</button>
          <span className="text-sm font-medium text-foreground w-12 text-center">{heatYear}</span>
          <button
            onClick={() => setHeatYear((y) => y + 1)}
            className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors"
          >›</button>
        </div>
        <HeatmapCalendar data={heatmap} year={heatYear} />
      </Section>
    </div>
  );
}

function CategoryChart({ categoryId, name, days, color }: { categoryId: number; name: string; days: number; color: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'category', categoryId, days],
    queryFn: () => fetchCategoryAnalytics(categoryId, days),
  });

  const avg = data?.stats ? Number(data.stats.average) : null;
  const pct = avg !== null ? Math.round((avg / 10) * 100) : 0;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">{name}</h3>
      {isLoading ? (
        <div className="h-[160px] bg-muted rounded animate-pulse" />
      ) : (
        <div className="flex gap-4 items-center">
          {/* Donut */}
          <div className="shrink-0 flex flex-col items-center">
            <PieChart width={100} height={100}>
              <Pie
                data={[{ value: avg ?? 0 }, { value: 10 - (avg ?? 0) }]}
                cx={50} cy={50}
                innerRadius={32} outerRadius={46}
                startAngle={90} endAngle={-270}
                dataKey="value" strokeWidth={0}
              >
                <Cell fill={color} />
                <Cell fill="hsl(var(--muted))" />
              </Pie>
            </PieChart>
            <p className="text-lg font-bold text-foreground -mt-6">{avg !== null ? avg.toFixed(1) : '—'}</p>
            <p className="text-xs text-muted-foreground mt-1">{avg !== null ? `${pct}%` : ''}</p>
            {data?.stats && (
              <p className="text-xs text-muted-foreground">↑{data.stats.highest} ↓{data.stats.lowest}</p>
            )}
          </div>
          {/* Trend */}
          <div className="flex-1 min-w-0">
            {data?.trend.length ? (
              <TrendChart
                data={data.trend.map((t) => ({ date: t.date, score: t.score }))}
                color={color}
                height={130}
                pastDays={days}
              />
            ) : (
              <div className="h-[130px] flex items-center justify-center text-xs text-muted-foreground">No data</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">{title}</h2>
      {children}
    </div>
  );
}

function ChartSkeleton() {
  return <div className="h-[220px] bg-muted rounded animate-pulse" />;
}

function Empty() {
  return <p className="text-sm text-muted-foreground text-center py-8">No data for this period.</p>;
}
