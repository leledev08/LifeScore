import api from './client';
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '@lifescore/shared';

export async function fetchCategories(): Promise<Category[]> {
  const res = await api.get<{ data: Category[] }>('/categories');
  return res.data.data;
}

export async function createCategory(data: CreateCategoryRequest): Promise<Category> {
  const res = await api.post<{ data: Category }>('/categories', data);
  return res.data.data;
}

export async function updateCategory(id: number, data: UpdateCategoryRequest): Promise<Category> {
  const res = await api.put<{ data: Category }>(`/categories/${id}`, data);
  return res.data.data;
}

export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/categories/${id}`);
}
