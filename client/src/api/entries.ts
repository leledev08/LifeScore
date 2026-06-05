import api from './client';
import type { DailyEntry, CreateEntryRequest, UpdateEntryRequest } from '@lifescore/shared';

export async function fetchEntries(params?: {
  start?: string;
  end?: string;
  category_id?: number;
  min_score?: number;
}): Promise<DailyEntry[]> {
  const res = await api.get<{ data: DailyEntry[] }>('/entries', { params });
  return res.data.data;
}

export async function fetchEntryByDate(date: string): Promise<DailyEntry | null> {
  try {
    const res = await api.get<{ data: DailyEntry }>(`/entries/${date}`);
    return res.data.data;
  } catch (err: unknown) {
    if ((err as { response?: { status?: number } }).response?.status === 404) return null;
    throw err;
  }
}

export async function createEntry(data: CreateEntryRequest): Promise<DailyEntry> {
  const res = await api.post<{ data: DailyEntry }>('/entries', data);
  return res.data.data;
}

export async function updateEntry(id: number, data: UpdateEntryRequest): Promise<DailyEntry> {
  const res = await api.put<{ data: DailyEntry }>(`/entries/${id}`, data);
  return res.data.data;
}

export async function deleteEntry(id: number): Promise<void> {
  await api.delete(`/entries/${id}`);
}
