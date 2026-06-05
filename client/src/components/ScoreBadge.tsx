interface Props { score: number | null; size?: 'sm' | 'md' }

export function scoreColor(score: number | null) {
  if (score === null) return 'text-muted-foreground';
  if (score >= 8) return 'text-emerald-400 dark:text-emerald-300';
  if (score >= 6) return 'text-green-600 dark:text-green-500';
  if (score >= 4) return 'text-yellow-500';
  return 'text-red-500';
}

export function scoreBgColor(score: number | null) {
  if (score === null) return 'bg-muted text-muted-foreground border-transparent';
  if (score >= 8) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (score >= 6) return 'bg-green-600/20 text-green-500 border-green-600/30';
  if (score >= 4) return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
  return 'bg-red-500/20 text-red-400 border-red-500/30';
}

export function scoreBarColor(score: number | null) {
  if (score === null) return 'bg-muted';
  if (score >= 8) return 'bg-emerald-400';
  if (score >= 6) return 'bg-green-500';
  if (score >= 4) return 'bg-yellow-500';
  return 'bg-red-500';
}

export default function ScoreBadge({ score, size = 'md' }: Props) {
  return (
    <span className={`font-bold ${scoreColor(score)} ${size === 'sm' ? 'text-sm' : 'text-base'}`}>
      {score ?? '—'}
    </span>
  );
}
