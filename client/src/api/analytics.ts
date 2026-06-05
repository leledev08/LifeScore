import api from './client';
import type { OverallAnalytics, CategoryAnalytics, HeatmapEntry } from '@lifescore/shared';

export async function fetchOverallAnalytics(days = 30): Promise<OverallAnalytics> {
  const res = await api.get<{ data: OverallAnalytics }>('/analytics/overall', { params: { days } });
  return res.data.data;
}

export async function fetchCategoryAnalytics(categoryId: number, days = 90): Promise<CategoryAnalytics> {
  const res = await api.get<{ data: CategoryAnalytics }>(`/analytics/category/${categoryId}`, { params: { days } });
  return res.data.data;
}

export async function fetchHeatmap(year?: number): Promise<HeatmapEntry[]> {
  const res = await api.get<{ data: HeatmapEntry[] }>('/analytics/heatmap', { params: { year } });
  return res.data.data;
}

export async function fetchComparison(categoryIds: number[], days = 30) {
  const res = await api.get<{ data: { date: string; category_id: number; category_name: string; score: number }[] }>(
    '/analytics/comparison',
    { params: { category_ids: categoryIds.join(','), days } }
  );
  return res.data.data;
}
