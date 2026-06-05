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
}

export default function ComparisonChart({ data, categoryIds }: Props) {
  // Pivot: [{ date, [catId]: score }]
  const byDate: Record<string, Record<string, number | string>> = {};
  for (const row of data) {
    const d = row.date.slice(0, 10).slice(5);
    byDate[d] ??= { date: d };
    byDate[d][String(row.category_id)] = row.score;
  }

  // Get category names from data
  const catNames: Record<number, string> = {};
  for (const row of data) catNames[row.category_id] = row.category_name;

  const chartData = Object.values(byDate).sort((a, b) => (a.date > b.date ? 1 : -1));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
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
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
