import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine,
} from 'recharts';

interface Point { date: string; score: number | null }
interface Props {
  data: { date: string; score: number }[];
  color?: string;
  height?: number;
  referenceY?: number;
  pastDays?: number;
  futureDays?: number;
}

function fillDateRange(data: { date: string; score: number }[], pastDays: number, futureDays: number): Point[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - pastDays);

  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + futureDays);

  const scoreByDate: Record<string, number> = {};
  for (const d of data) scoreByDate[d.date.slice(0, 10)] = d.score;

  const result: Point[] = [];
  const cur = new Date(startDate);
  while (cur <= endDate) {
    const iso = cur.toISOString().slice(0, 10);
    const [y, m, day] = iso.split('-');
    result.push({ date: `${day}-${m}-${y}`, score: scoreByDate[iso] ?? null });
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

export default function TrendChart({ data, color = 'hsl(var(--primary))', height = 180, referenceY, pastDays = 30, futureDays }: Props) {
  const half = Math.floor(pastDays / 2);
  const filled = fillDateRange(data, pastDays - half, futureDays ?? half);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={filled} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={Math.max(1, Math.floor(filled.length / 15))} />
        <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            fontSize: 12,
          }}
          formatter={(val) => val !== null ? [val, 'Score'] : ['—', 'No entry']}
        />
        {referenceY !== undefined && (
          <ReferenceLine y={referenceY} stroke="hsl(var(--primary))" strokeDasharray="4 2" strokeOpacity={0.5} />
        )}
        <Line
          type="monotone"
          dataKey="score"
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
