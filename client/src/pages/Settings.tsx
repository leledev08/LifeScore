import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  DragOverlay, useDroppable,
} from '@dnd-kit/core';
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { fetchCategories, createCategory, updateCategory, deleteCategory, reorderCategories } from '../api/categories';
import { fetchGroups, createGroup, renameGroup, deleteGroup, reorderGroups } from '../api/groups';
import { useAuthStore } from '../store/authStore';
import type { Category, Group } from '@lifescore/shared';

export default function Settings() {
  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      <CategoriesSection />
      <GroupsSection />
      <AccountSection />
    </div>
  );
}

// ─── Droppable empty group container ─────────────────────────────────────────

function DroppableGroup({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[44px] rounded-lg border-2 border-dashed p-2 transition-colors ${
        isOver ? 'border-primary bg-primary/5' : 'border-border'
      }`}
    >
      {children}
    </div>
  );
}

// ─── Shared drag handle item ──────────────────────────────────────────────────

function SortableRow({ id, children }: { id: number | string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 group"
    >
      <span {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground px-1 touch-none select-none">⠿</span>
      {children}
    </div>
  );
}

// ─── Groups section ───────────────────────────────────────────────────────────

function GroupsSection() {
  const qc = useQueryClient();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState<number | null>(null);
  const [local, setLocal] = useState<Group[]>([]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const { data: fetched = [], isLoading } = useQuery({ queryKey: ['groups'], queryFn: fetchGroups });
  useEffect(() => { setLocal(fetched); }, [fetched]);
  const groups = local.length ? local : fetched;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['groups'] });
    qc.invalidateQueries({ queryKey: ['categories'] });
  };

  const createMutation = useMutation({
    mutationFn: () => createGroup(newName.trim()),
    onSuccess: () => { setNewName(''); setError(''); invalidate(); },
    onError: (err: unknown) => setError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Failed'),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => renameGroup(id, name),
    onSuccess: () => { setEditingId(null); setError(''); invalidate(); },
    onError: (err: unknown) => setError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGroup,
    onSuccess: invalidate,
  });

  const reorderMutation = useMutation({ mutationFn: reorderGroups });

  function handleDragStart(e: DragStartEvent) { setActiveId(e.active.id as number); }
  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    setLocal((prev) => {
      const from = prev.findIndex((g) => g.id === active.id);
      const to   = prev.findIndex((g) => g.id === over.id);
      const next = arrayMove(prev, from, to);
      reorderMutation.mutate(next.map((g, i) => ({ id: g.id, sort_order: i })));
      return next;
    });
  }

  const activeGroup = activeId !== null ? groups.find((g) => g.id === activeId) : null;

  return (
    <div className="bg-card border border-border rounded-lg p-5 space-y-4">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Groups</h2>
      {isLoading ? (
        <div className="space-y-2 animate-pulse">{[1,2,3].map((i) => <div key={i} className="h-10 bg-muted rounded" />)}</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <SortableContext items={groups.map((g) => g.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {groups.map((g) =>
                editingId === g.id ? (
                  <div key={g.id} className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50">
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') renameMutation.mutate({ id: g.id, name: editName.trim() });
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-1 px-2 py-1 rounded border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button onClick={() => renameMutation.mutate({ id: g.id, name: editName.trim() })} disabled={renameMutation.isPending} className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50">Save</button>
                    <button onClick={() => setEditingId(null)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                  </div>
                ) : (
                  <SortableRow key={g.id} id={g.id}>
                    <span className="flex-1 text-sm text-foreground">{g.name}</span>
                    <button onClick={() => { setEditingId(g.id); setEditName(g.name); setError(''); }} className="text-xs text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 px-1">Edit</button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete group "${g.name}"? Categories will move to Custom.`)) deleteMutation.mutate(g.id);
                      }}
                      disabled={deleteMutation.isPending}
                      className="text-xs text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 px-1 disabled:opacity-30"
                    >Delete</button>
                  </SortableRow>
                )
              )}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeGroup && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-card border border-primary shadow-lg text-sm text-foreground">
                <span className="text-muted-foreground">⠿</span>{activeGroup.name}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
      <form onSubmit={(e) => { e.preventDefault(); if (newName.trim()) createMutation.mutate(); }} className="flex gap-2 pt-1 border-t border-border">
        <input
          value={newName}
          onChange={(e) => { setNewName(e.target.value); setError(''); }}
          placeholder="New group name…"
          maxLength={50}
          className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
        />
        <button type="submit" disabled={!newName.trim() || createMutation.isPending} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">Add</button>
      </form>
    </div>
  );
}

// ─── Categories section ───────────────────────────────────────────────────────

function CategoriesSection() {
  const qc = useQueryClient();
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editGroup, setEditGroup] = useState('');
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState<number | null>(null);
  const [localCats, setLocalCats] = useState<Category[]>([]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const { data: fetchedCats = [], isLoading: catsLoading } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const { data: groups = [] } = useQuery({ queryKey: ['groups'], queryFn: fetchGroups });

  useEffect(() => { setLocalCats(fetchedCats); }, [fetchedCats]);
  const cats = localCats.length ? localCats : fetchedCats;
  const allGroupNames = groups.map((g) => g.name);

  const grouped: Record<string, Category[]> = {};
  for (const g of allGroupNames) grouped[g] = [];
  const ungrouped: Category[] = [];
  for (const cat of cats) {
    if (cat.group_name && allGroupNames.includes(cat.group_name)) {
      grouped[cat.group_name].push(cat);
    } else {
      ungrouped.push(cat);
    }
  }

  const invalidate = () => { qc.invalidateQueries({ queryKey: ['categories'] }); };

  const createMutation = useMutation({
    mutationFn: () => createCategory({ name: newName.trim(), group_name: newGroup || null }),
    onSuccess: () => { setNewName(''); setNewGroup(''); setError(''); invalidate(); },
    onError: (err: unknown) => setError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name, group_name }: { id: number; name: string; group_name: string | null }) =>
      updateCategory(id, { name, group_name }),
    onSuccess: () => { setEditingCat(null); setError(''); invalidate(); },
    onError: (err: unknown) => setError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => { invalidate(); qc.invalidateQueries({ queryKey: ['goals'] }); qc.invalidateQueries({ queryKey: ['analytics'] }); },
  });

  const reorderMutation = useMutation({ mutationFn: reorderCategories });

  function handleDragStart(e: DragStartEvent) { setActiveId(e.active.id as number); }

  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const activeGroup = cats.find((c) => c.id === active.id)?.group_name ?? null;
    const overCat = cats.find((c) => c.id === (over.id as number));
    // over.id is a group name string when hovering over DroppableGroup
    const overGroup = overCat ? (overCat.group_name ?? null) : (typeof over.id === 'string' ? over.id : null);
    if (activeGroup !== overGroup) {
      setLocalCats((prev) => prev.map((c) => c.id === (active.id as number) ? { ...c, group_name: overGroup } : c));
    }
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) { setLocalCats(fetchedCats); return; }

    setLocalCats((prev) => {
      const from = prev.findIndex((c) => c.id === active.id);
      const toCat = prev.findIndex((c) => c.id === (over.id as number));
      // if dropped on a group container (string id), just keep current order
      const next = toCat >= 0 && active.id !== over.id ? arrayMove(prev, from, toCat) : prev;
      const byGroup: Record<string, Category[]> = {};
      for (const c of next) { const g = c.group_name ?? '__none__'; (byGroup[g] ??= []).push(c); }
      const payload: { id: number; sort_order: number; group_name: string | null }[] = [];
      for (const g of Object.keys(byGroup)) byGroup[g].forEach((c, i) => payload.push({ id: c.id, sort_order: i, group_name: c.group_name ?? null }));
      reorderMutation.mutate(payload);
      return next;
    });
  }

  const activeCat = activeId !== null ? cats.find((c) => c.id === activeId) : null;

  function renderCatRow(cat: Category) {
    if (editingCat?.id === cat.id) {
      return (
        <div key={cat.id} className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50">
          <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') updateMutation.mutate({ id: cat.id, name: editName.trim(), group_name: editGroup || null }); if (e.key === 'Escape') setEditingCat(null); }}
            className="flex-1 min-w-0 px-2 py-1 rounded border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <select value={editGroup} onChange={(e) => setEditGroup(e.target.value)}
            className="px-2 py-1 rounded border border-input bg-background text-foreground text-xs focus:outline-none">
            <option value="">— no group —</option>
            {allGroupNames.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <button onClick={() => updateMutation.mutate({ id: cat.id, name: editName.trim(), group_name: editGroup || null })} disabled={updateMutation.isPending} className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50">Save</button>
          <button onClick={() => setEditingCat(null)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
        </div>
      );
    }
    return (
      <SortableRow key={cat.id} id={cat.id}>
        <span className="flex-1 text-sm text-foreground">{cat.name}</span>
        <button onClick={() => { setEditingCat(cat); setEditName(cat.name); setEditGroup(cat.group_name ?? ''); setError(''); }} className="text-xs text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 px-1">Edit</button>
        <button onClick={() => { if (confirm(`Delete "${cat.name}"?`)) deleteMutation.mutate(cat.id); }} disabled={deleteMutation.isPending} className="text-xs text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 px-1 disabled:opacity-30">Delete</button>
      </SortableRow>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-5 space-y-5">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Categories</h2>
      {catsLoading ? (
        <div className="space-y-2 animate-pulse">{[1,2,3].map((i) => <div key={i} className="h-10 bg-muted rounded" />)}</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div className="space-y-5">
            {allGroupNames.map((group) => {
              const items = grouped[group] ?? [];
              return (
                <div key={group}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">{group}</p>
                  <SortableContext items={items.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                    {items.length === 0 ? (
                      <DroppableGroup id={group}>
                        <p className="text-xs text-muted-foreground text-center py-1">Drop here</p>
                      </DroppableGroup>
                    ) : null}
                    <div className="space-y-1">
                      {items.map((cat) => renderCatRow(cat))}
                    </div>
                  </SortableContext>
                </div>
              );
            })}

            {/* Ungrouped — categories whose group was deleted */}
            {ungrouped.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Ungrouped</p>
                <SortableContext items={ungrouped.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1">
                    {ungrouped.map((cat) => renderCatRow(cat))}
                  </div>
                </SortableContext>
              </div>
            )}
          </div>
          <DragOverlay>
            {activeCat && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-card border border-primary shadow-lg text-sm text-foreground">
                <span className="text-muted-foreground">⠿</span>{activeCat.name}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
      <form onSubmit={(e) => { e.preventDefault(); if (newName.trim()) createMutation.mutate(); }} className="flex flex-wrap gap-2 pt-1 border-t border-border">
        <input value={newName} onChange={(e) => { setNewName(e.target.value); setError(''); }} placeholder="New category name…" maxLength={100}
          className="flex-1 min-w-32 px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
        />
        <select value={newGroup} onChange={(e) => setNewGroup(e.target.value)}
          className="px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Custom</option>
          {allGroupNames.filter((g) => g !== 'Custom').map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <button type="submit" disabled={!newName.trim() || createMutation.isPending} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">Add</button>
      </form>
    </div>
  );
}

// ─── Account section ──────────────────────────────────────────────────────────

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
          {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
        </p>
      </div>
      <div className="pt-2 border-t border-border">
        <button onClick={() => { if (confirm('Sign out?')) clearAuth(); }} className="px-4 py-2 text-sm text-red-500 border border-red-500/30 rounded-md hover:bg-red-500/10 transition-colors">Sign out</button>
      </div>
    </div>
  );
}
