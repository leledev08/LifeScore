// Auth
export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Models
export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface Category {
  id: number;
  user_id: number;
  name: string;
  is_default: boolean;
  created_at: string;
}

export interface DailyEntry {
  id: number;
  user_id: number;
  date: string; // ISO date string YYYY-MM-DD
  notes: string | null;
  created_at: string;
  scores?: Score[];
}

export interface Score {
  id: number;
  entry_id: number;
  category_id: number;
  score: number; // 1–10
  category?: Category;
  category_name?: string;
}

// Requests
export interface CreateEntryRequest {
  date: string;
  notes?: string;
  scores: { category_id: number; score: number }[];
}

export interface UpdateEntryRequest {
  notes?: string;
  scores?: { category_id: number; score: number }[];
}

export interface CreateCategoryRequest {
  name: string;
}

export interface UpdateCategoryRequest {
  name: string;
}

export interface CreateGoalRequest {
  category_id: number;
  target_score: number;
}

export interface Goal {
  id: number;
  user_id: number;
  category_id: number;
  target_score: number;
  created_at: string;
  category?: Category;
  category_name?: string;
  current_average?: string | null;
}

// Analytics
export interface CategoryStats {
  category_id: number;
  category_name: string;
  average: number;
  highest: number;
  lowest: number;
  stddev: number;
}

export interface OverallAnalytics {
  daily_average: number;
  weekly_average: number;
  monthly_average: number;
  current_streak: number;
  best_category: CategoryStats;
  worst_category: CategoryStats;
  trend: { date: string; overall_score: number }[];
  category_stats: CategoryStats[];
}

export interface CategoryAnalytics {
  stats: CategoryStats;
  trend: { date: string; score: number }[];
}

export interface HeatmapEntry {
  date: string;
  overall_score: number;
}

// API response wrapper
export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: string;
}
