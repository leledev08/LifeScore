import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine,
} from 'recharts';

interface Point { date: string; score: number }
interface Props {
  data: Point[];
  color?: string;
  height?: number;
  referenceY?: number;
}

export default function TrendChart({ data, color = 'hsl(var(--primary))', height = 180, referenceY }: Props) {
  const formatted = data.map((d) => ({ ...d, date: d.date.slice(5) }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={formatted} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
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
        {referenceY !== undefined && (
          <ReferenceLine y={referenceY} stroke="hsl(var(--primary))" strokeDasharray="4 2" strokeOpacity={0.5} />
        )}
        <Line type="monotone" dataKey="score" stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
