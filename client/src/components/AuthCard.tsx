import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  title: string;
  submitLabel: string;
  onSubmit: (email: string, password: string) => void;
  isPending: boolean;
  error: string | null;
  footer: { text: string; linkTo: string; linkLabel: string };
}

export default function AuthCard({ title, submitLabel, onSubmit, isPending, error, footer }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit(email, password);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-lg p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-foreground mb-6">{title}</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Password</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Please wait…' : submitLabel}
          </button>
        </form>

        <p className="mt-4 text-sm text-muted-foreground text-center">
          {footer.text}{' '}
          <Link to={footer.linkTo} className="text-primary hover:underline">
            {footer.linkLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}
