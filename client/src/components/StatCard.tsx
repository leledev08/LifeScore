interface Props {
  label: string;
  value: string | number | null;
  sub?: string;
  accent?: boolean;
}

export default function StatCard({ label, value, sub, accent }: Props) {
  return (
    <div className={`bg-card border rounded-lg p-5 flex flex-col gap-1 ${accent ? 'border-primary/50' : 'border-border'}`}>
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className={`text-3xl font-bold ${accent ? 'text-primary' : 'text-foreground'}`}>
        {value ?? '—'}
      </span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}
