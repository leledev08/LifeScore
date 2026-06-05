import { scoreColor } from './ScoreBadge';

interface Props {
  label: string;
  value: number;
  active: boolean;
  onChange: (v: number) => void;
  onToggle: (active: boolean) => void;
}

export default function ScoreSlider({ label, value, active, onChange, onToggle }: Props) {
  return (
    <div className={`flex items-center gap-3 transition-opacity ${active ? '' : 'opacity-40'}`}>
      <button
        type="button"
        onClick={() => onToggle(!active)}
        title={active ? 'Skip this category today' : 'Track this category today'}
        className={`w-5 h-5 rounded border-2 shrink-0 transition-colors flex items-center justify-center ${
          active ? 'bg-primary border-primary' : 'border-muted-foreground bg-transparent'
        }`}
      >
        {active && <span className="text-primary-foreground text-xs leading-none">✓</span>}
      </button>
      <span className="w-24 text-sm text-foreground shrink-0">{label}</span>
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={value}
        disabled={!active}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-primary h-2 cursor-pointer disabled:cursor-default"
      />
      <span className={`w-6 text-center text-sm font-bold tabular-nums ${active ? scoreColor(value) : 'text-muted-foreground'}`}>
        {active ? value : '—'}
      </span>
    </div>
  );
}
