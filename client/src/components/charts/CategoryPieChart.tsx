import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { scoreColor } from '../ScoreBadge';

interface Props {
  name: string;
  average: number;
  highest: number;
  lowest: number;
}

export default function CategoryPieChart({ name, average, highest, lowest }: Props) {
  const pct = Math.round((average / 10) * 100);
  const filled = average;
  const empty = 10 - average;
  const color = scoreColor(average).includes('emerald') ? '#34d399'
    : scoreColor(average).includes('green-6') ? '#22c55e'
    : scoreColor(average).includes('yellow') ? '#eab308'
    : '#ef4444';

  return (
    <div className="bg-card border border-border rounded-lg p-4 flex flex-col items-center">
      <p className="text-sm font-medium text-foreground mb-1">{name}</p>
      <ResponsiveContainer width={120} height={120}>
        <PieChart>
          <Pie
            data={[{ value: filled }, { value: empty }]}
            cx="50%"
            cy="50%"
            innerRadius={38}
            outerRadius={52}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            strokeWidth={0}
          >
            <Cell fill={color} />
            <Cell fill="hsl(var(--muted))" />
          </Pie>
          <Tooltip
            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: 11 }}
            formatter={(_val, _name, props) => (props as { dataIndex?: number }).dataIndex === 0 ? [`${pct}%`, name] : null}
          />
        </PieChart>
      </ResponsiveContainer>
      <p className={`text-xl font-bold -mt-8 ${scoreColor(average)}`}>{average.toFixed(1)}</p>
      <p className="text-xs text-muted-foreground mt-1">{pct}%</p>
      <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
        <span>↑ {highest}</span>
        <span>↓ {lowest}</span>
      </div>
    </div>
  );
}
