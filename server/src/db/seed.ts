import { PoolClient } from 'pg';

export const DEFAULT_GROUPS = [
  { name: 'Health',  sort_order: 0 },
  { name: 'Fitness', sort_order: 1 },
  { name: 'Work',    sort_order: 2 },
  { name: 'Mindset', sort_order: 3 },
];

export const DEFAULT_CATEGORIES = [
  { name: 'Nutrition',  sort_order: 0, group_name: 'Health'  },
  { name: 'Hydration',  sort_order: 1, group_name: 'Health'  },
  { name: 'Sleep',      sort_order: 2, group_name: 'Health'  },
  { name: 'Workout',    sort_order: 3, group_name: 'Fitness' },
  { name: 'Motivation', sort_order: 4, group_name: 'Mindset' },
  { name: 'Discipline', sort_order: 5, group_name: 'Mindset' },
  { name: 'Learning',   sort_order: 6, group_name: 'Work'    },
];

export async function seedDefaultCategories(userId: number, client: PoolClient) {
  const params: (number | string)[] = [];
  const valueClauses = DEFAULT_CATEGORIES.map((c) => {
    const base = params.length;
    params.push(userId, c.name, c.sort_order, c.group_name);
    return `($${base + 1}, $${base + 2}, $${base + 3}, TRUE, $${base + 4})`;
  });

  await client.query(
    `INSERT INTO categories (user_id, name, sort_order, is_default, group_name)
     VALUES ${valueClauses.join(', ')}
     ON CONFLICT DO NOTHING`,
    params
  );
}

export async function seedDefaultGroups(userId: number, client: PoolClient) {
  const params: (number | string)[] = [];
  const valueClauses = DEFAULT_GROUPS.map((g) => {
    const base = params.length;
    params.push(userId, g.name, g.sort_order);
    return `($${base + 1}, $${base + 2}, $${base + 3})`;
  });
  await client.query(
    `INSERT INTO groups (user_id, name, sort_order) VALUES ${valueClauses.join(', ')} ON CONFLICT DO NOTHING`,
    params
  );
}
