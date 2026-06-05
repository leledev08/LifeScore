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
  const { name } = req.body as { name?: string };
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
      'INSERT INTO categories (user_id, name, sort_order) VALUES ($1, $2, $3) RETURNING *',
      [req.userId, name.trim(), sort_order]
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
  const { name } = req.body as { name?: string };
  if (!name?.trim()) {
    res.status(400).json({ error: 'Name required' });
    return;
  }

  try {
    const { rows } = await pool.query(
      'UPDATE categories SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [name.trim(), id, req.userId]
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

export default router;
