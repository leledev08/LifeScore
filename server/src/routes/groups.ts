import { Router, Response } from 'express';
import pool from '../db/pool';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM groups WHERE user_id = $1 ORDER BY sort_order, id',
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
  if (!name?.trim()) { res.status(400).json({ error: 'Name required' }); return; }
  try {
    const { rows: existing } = await pool.query('SELECT COUNT(*) FROM groups WHERE user_id = $1', [req.userId]);
    const sort_order = parseInt(existing[0].count);
    const { rows } = await pool.query(
      'INSERT INTO groups (user_id, name, sort_order) VALUES ($1, $2, $3) RETURNING *',
      [req.userId, name.trim(), sort_order]
    );
    res.status(201).json({ data: rows[0] });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23505') { res.status(409).json({ error: 'Group already exists' }); return; }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Rename — also updates all categories in this group
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { name } = req.body as { name?: string };
  if (!name?.trim()) { res.status(400).json({ error: 'Name required' }); return; }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'UPDATE groups SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [name.trim(), id, req.userId]
    );
    if (rows.length === 0) { res.status(404).json({ error: 'Group not found' }); return; }
    const oldName = rows[0].name;
    // rename categories that belong to this group
    await client.query(
      'UPDATE categories SET group_name = $1 WHERE user_id = $2 AND group_name = $3',
      [name.trim(), req.userId, oldName]
    );
    await client.query('COMMIT');
    res.json({ data: rows[0] });
  } catch (err: unknown) {
    await client.query('ROLLBACK');
    if ((err as { code?: string }).code === '23505') { res.status(409).json({ error: 'Group already exists' }); return; }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Delete — categories move to Custom
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'DELETE FROM groups WHERE id = $1 AND user_id = $2 RETURNING name',
      [id, req.userId]
    );
    if (rows.length === 0) { res.status(404).json({ error: 'Group not found' }); return; }
    await client.query(
      'UPDATE categories SET group_name = NULL WHERE user_id = $1 AND group_name = $2',
      [req.userId, rows[0].name]
    );
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

// Batch reorder
router.patch('/reorder', async (req: AuthRequest, res: Response) => {
  const items = req.body as { id: number; sort_order: number }[];
  if (!Array.isArray(items)) { res.status(400).json({ error: 'items array required' }); return; }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const item of items) {
      await client.query(
        'UPDATE groups SET sort_order = $1 WHERE id = $2 AND user_id = $3',
        [item.sort_order, item.id, req.userId]
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
