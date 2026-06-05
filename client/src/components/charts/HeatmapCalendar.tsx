import type { HeatmapEntry } from '@lifescore/shared';

interface Props { data: HeatmapEntry[]; year: number }

function scoreToOpacity(score: number): number {
  return 0.15 + ((score - 1) / 9) * 0.85;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['','M','','W','','F',''];

export default function HeatmapCalendar({ data, year }: Props) {
  const byDate: Record<string, number> = {};
  for (const e of data) byDate[e.date.slice(0, 10)] = Number(e.overall_score);

  // Build week columns for the year
  const start = new Date(year, 0, 1);
  // Align to Sunday
  const startDay = start.getDay();
  const cells: { date: string | null; score: number | null }[][] = [];
  let week: { date: string | null; score: number | null }[] = Array(startDay).fill({ date: null, score: null });

  const end = new Date(year, 11, 31);
  const cur = new Date(year, 0, 1);
  while (cur <= end) {
    const iso = cur.toISOString().slice(0, 10);
    week.push({ date: iso, score: byDate[iso] ?? null });
    if (week.length === 7) { cells.push(week); week = []; }
    cur.setDate(cur.getDate() + 1);
  }
  if (week.length) {
    while (week.length < 7) week.push({ date: null, score: null });
    cells.push(week);
  }

  // Month label positions
  const monthLabels: { label: string; col: number }[] = [];
  for (let m = 0; m < 12; m++) {
    const d = new Date(year, m, 1);
    const dayOfYear = Math.floor((d.getTime() - new Date(year, 0, 1).getTime()) / 86400000);
    const col = Math.floor((dayOfYear + startDay) / 7);
    monthLabels.push({ label: MONTHS[m], col });
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1 min-w-max">
        {/* Month labels */}
        <div className="flex gap-1 pl-6">
          {cells.map((_, ci) => {
            const ml = monthLabels.find((m) => m.col === ci);
            return (
              <div key={ci} className="w-3 text-[9px] text-muted-foreground">
                {ml?.label ?? ''}
              </div>
            );
          })}
        </div>
        {/* Grid rows = days of week */}
        {Array.from({ length: 7 }).map((_, row) => (
          <div key={row} className="flex items-center gap-1">
            <span className="w-5 text-[9px] text-muted-foreground text-right">{DAYS[row]}</span>
            {cells.map((week, ci) => {
              const cell = week[row];
              if (!cell?.date) return <div key={ci} className="w-3 h-3" />;
              const score = cell.score;
              return (
                <div
                  key={ci}
                  title={`${cell.date}: ${score !== null ? score.toFixed(1) : 'no entry'}`}
                  className="w-3 h-3 rounded-sm"
                  style={
                    score !== null
                      ? { backgroundColor: `hsl(var(--primary))`, opacity: scoreToOpacity(score) }
                      : { backgroundColor: 'hsl(var(--muted))', opacity: 0.4 }
                  }
                />
              );
            })}
          </div>
        ))}
        {/* Score legend */}
        <div className="flex items-center gap-1.5 mt-1 pl-6 text-[9px] text-muted-foreground">
          <span>Less</span>
          {[1, 3, 5, 7, 9, 10].map((s) => (
            <div
              key={s}
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: 'hsl(var(--primary))', opacity: scoreToOpacity(s) }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
