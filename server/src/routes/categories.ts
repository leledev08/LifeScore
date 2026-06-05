import { Router, Response } from 'express';
import pool from '../db/pool';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM categories WHERE user_id = $1 ORDER BY sort_order, id',
      [req.userId]
    );
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { name, group_name } = req.body as { name?: string; group_name?: string | null };
  if (!name?.trim()) {
    res.status(400).json({ error: 'Name required' });
    return;
  }

  try {
    const { rows: existing } = await pool.query(
      'SELECT id FROM categories WHERE user_id = $1',
      [req.userId]
    );
    const sort_order = existing.length;

    const { rows } = await pool.query(
      'INSERT INTO categories (user_id, name, sort_order, group_name) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.userId, name.trim(), sort_order, group_name ?? null]
    );
    res.status(201).json({ data: rows[0] });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23505') {
      res.status(409).json({ error: 'Category name already exists' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { name, group_name } = req.body as { name?: string; group_name?: string | null };
  if (!name?.trim()) {
    res.status(400).json({ error: 'Name required' });
    return;
  }

  try {
    const { rows } = await pool.query(
      'UPDATE categories SET name = $1, group_name = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
      [name.trim(), group_name ?? null, id, req.userId]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.json({ data: rows[0] });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23505') {
      res.status(409).json({ error: 'Category name already exists' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (rowCount === 0) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/categories/reorder  — batch update sort_order + group_name
router.patch('/reorder', async (req: AuthRequest, res: Response) => {
  const items = req.body as { id: number; sort_order: number; group_name: string | null }[];
  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'items array required' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const item of items) {
      await client.query(
        'UPDATE categories SET sort_order = $1, group_name = $2 WHERE id = $3 AND user_id = $4',
        [item.sort_order, item.group_name, item.id, req.userId]
      );
    }
    await client.query('COMMIT');
    res.status(204).send();
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

export default router;
