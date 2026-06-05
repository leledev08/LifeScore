interface Props { score: number | null; size?: 'sm' | 'md' }

function scoreColor(score: number | null) {
  if (score === null) return 'text-muted-foreground';
  if (score >= 8) return 'text-green-500';
  if (score >= 6) return 'text-yellow-500';
  return 'text-red-500';
}

export default function ScoreBadge({ score, size = 'md' }: Props) {
  return (
    <span className={`font-bold ${scoreColor(score)} ${size === 'sm' ? 'text-sm' : 'text-base'}`}>
      {score ?? '—'}
    </span>
  );
}
