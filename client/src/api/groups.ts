import api from './client';
import type { Group } from '@lifescore/shared';

export async function fetchGroups(): Promise<Group[]> {
  const res = await api.get<{ data: Group[] }>('/groups');
  return res.data.data;
}

export async function createGroup(name: string): Promise<Group> {
  const res = await api.post<{ data: Group }>('/groups', { name });
  return res.data.data;
}

export async function renameGroup(id: number, name: string): Promise<Group> {
  const res = await api.put<{ data: Group }>(`/groups/${id}`, { name });
  return res.data.data;
}

export async function deleteGroup(id: number): Promise<void> {
  await api.delete(`/groups/${id}`);
}

export async function reorderGroups(items: { id: number; sort_order: number }[]): Promise<void> {
  await api.patch('/groups/reorder', items);
}
