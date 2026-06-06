import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from 'recharts';

const COLORS = [
  '#a78bfa', '#34d399', '#fbbf24', '#f87171', '#60a5fa',
  '#fb923c', '#e879f9', '#2dd4bf', '#facc15', '#818cf8',
];

interface Props {
  data: { date: string; category_id: number; category_name: string; score: number }[];
  categoryIds: number[];
  pastDays?: number;
}

function formatLabel(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
}

export default function ComparisonChart({ data, categoryIds, pastDays }: Props) {
  const catNames: Record<number, string> = {};
  for (const row of data) catNames[row.category_id] = row.category_name;

  const lookup: Record<string, Record<string, number>> = {};
  for (const row of data) {
    const iso = row.date.slice(0, 10);
    lookup[iso] ??= {};
    lookup[iso][String(row.category_id)] = row.score;
  }

  const days = pastDays ?? 30;
  const half = Math.floor(days / 2);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (days - half));
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + half);

  const chartData: Record<string, number | string | null>[] = [];
  const cur = new Date(startDate);
  while (cur <= endDate) {
    const iso = cur.toISOString().slice(0, 10);
    const row: Record<string, number | string | null> = { date: formatLabel(iso) };
    for (const id of categoryIds) row[String(id)] = lookup[iso]?.[String(id)] ?? null;
    chartData.push(row);
    cur.setDate(cur.getDate() + 1);
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={Math.max(1, Math.floor(chartData.length / 15))} />
        <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {categoryIds.map((id, i) => (
          <Line
            key={id}
            type="monotone"
            dataKey={String(id)}
            name={catNames[id] ?? String(id)}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
