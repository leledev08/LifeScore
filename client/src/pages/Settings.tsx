import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../api/categories';
import { useAuthStore } from '../store/authStore';
import type { Category } from '@lifescore/shared';

export default function Settings() {
  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      <CategoriesSection />
      <AccountSection />
    </div>
  );
}

function CategoriesSection() {
  const qc = useQueryClient();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState('');

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const createMutation = useMutation({
    mutationFn: () => createCategory({ name: newName.trim() }),
    onSuccess: () => {
      setNewName('');
      setError('');
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err: unknown) => {
      setError(
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Failed to create'
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => updateCategory(id, { name }),
    onSuccess: () => {
      setEditingId(null);
      setError('');
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err: unknown) => {
      setError(
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Failed to update'
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['goals'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setError('');
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    createMutation.mutate();
  }

  function handleUpdate(id: number) {
    if (!editName.trim()) return;
    updateMutation.mutate({ id, name: editName.trim() });
  }

  const defaults = categories.filter((c) => c.is_default);
  const custom   = categories.filter((c) => !c.is_default);

  return (
    <div className="bg-card border border-border rounded-lg p-5 space-y-5">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Categories</h2>

      {/* Default categories (read-only names) */}
      {defaults.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Default (built-in)</p>
          <div className="space-y-1">
            {defaults.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between px-3 py-2 rounded-md bg-muted/50">
                <span className="text-sm text-foreground">{cat.name}</span>
                <span className="text-xs text-muted-foreground">default</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom categories */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Custom</p>
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2].map((i) => <div key={i} className="h-10 bg-muted rounded" />)}
          </div>
        ) : custom.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No custom categories yet.</p>
        ) : (
          <div className="space-y-1">
            {custom.map((cat) => (
              <div key={cat.id} className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50">
                {editingId === cat.id ? (
                  <>
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(cat.id); if (e.key === 'Escape') cancelEdit(); }}
                      className="flex-1 px-2 py-1 rounded border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                      onClick={() => handleUpdate(cat.id)}
                      disabled={updateMutation.isPending}
                      className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
                    >Save</button>
                    <button onClick={cancelEdit} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-foreground">{cat.name}</span>
                    <button
                      onClick={() => startEdit(cat)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
                    >Edit</button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${cat.name}"? This removes all its scores.`)) {
                          deleteMutation.mutate(cat.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="text-xs text-muted-foreground hover:text-red-500 transition-colors px-1 disabled:opacity-50"
                    >Delete</button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add new */}
      <form onSubmit={handleCreate} className="flex gap-2 pt-1">
        <input
          value={newName}
          onChange={(e) => { setNewName(e.target.value); setError(''); }}
          placeholder="New category name…"
          maxLength={100}
          className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={!newName.trim() || createMutation.isPending}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </form>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

function AccountSection() {
  const { user, clearAuth } = useAuthStore();

  return (
    <div className="bg-card border border-border rounded-lg p-5 space-y-4">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Account</h2>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Email</p>
        <p className="text-sm text-foreground font-medium">{user?.email}</p>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Member since</p>
        <p className="text-sm text-foreground">
          {user?.created_at
            ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            : '—'}
        </p>
      </div>
      <div className="pt-2 border-t border-border">
        <button
          onClick={() => {
            if (confirm('Sign out?')) clearAuth();
          }}
          className="px-4 py-2 text-sm text-red-500 border border-red-500/30 rounded-md hover:bg-red-500/10 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
