import api from './client';
import type { Goal, CreateGoalRequest } from '@lifescore/shared';

export async function fetchGoals(): Promise<Goal[]> {
  const res = await api.get<{ data: Goal[] }>('/goals');
  return res.data.data;
}

export async function createGoal(data: CreateGoalRequest): Promise<Goal> {
  const res = await api.post<{ data: Goal }>('/goals', data);
  return res.data.data;
}

export async function deleteGoal(id: number): Promise<void> {
  await api.delete(`/goals/${id}`);
}
