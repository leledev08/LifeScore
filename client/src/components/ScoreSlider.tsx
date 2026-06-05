interface Props {
  label: string;
  value: number;
  onChange: (v: number) => void;
}

function scoreColor(v: number) {
  if (v >= 8) return 'text-green-500';
  if (v >= 6) return 'text-yellow-500';
  return 'text-red-500';
}

export default function ScoreSlider({ label, value, onChange }: Props) {
  return (
    <div className="flex items-center gap-4">
      <span className="w-28 text-sm text-foreground shrink-0">{label}</span>
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-primary h-2 cursor-pointer"
      />
      <span className={`w-6 text-center text-sm font-bold tabular-nums ${scoreColor(value)}`}>
        {value}
      </span>
    </div>
  );
}
