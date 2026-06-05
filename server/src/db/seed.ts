import { PoolClient } from 'pg';

export const DEFAULT_CATEGORIES = [
  { name: 'Nutrition', sort_order: 0 },
  { name: 'Hydration', sort_order: 1 },
  { name: 'Sleep', sort_order: 2 },
  { name: 'Workout', sort_order: 3 },
  { name: 'Motivation', sort_order: 4 },
  { name: 'Discipline', sort_order: 5 },
  { name: 'Learning', sort_order: 6 },
];

export async function seedDefaultCategories(userId: number, client: PoolClient) {
  const params: (number | string)[] = [];
  const valueClauses = DEFAULT_CATEGORIES.map((c) => {
    const base = params.length;
    params.push(userId, c.name, c.sort_order);
    return `($${base + 1}, $${base + 2}, $${base + 3}, TRUE)`;
  });

  await client.query(
    `INSERT INTO categories (user_id, name, sort_order, is_default)
     VALUES ${valueClauses.join(', ')}
     ON CONFLICT DO NOTHING`,
    params
  );
}
