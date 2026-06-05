import { Router, Response } from 'express';
import pool from '../db/pool';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT g.*, c.name AS category_name,
        ROUND(AVG(s.score)::numeric, 2) AS current_average
       FROM goals g
       JOIN categories c ON c.id = g.category_id
       LEFT JOIN scores s ON s.category_id = g.category_id
       LEFT JOIN daily_entries de ON de.id = s.entry_id AND de.user_id = $1
         AND de.date >= CURRENT_DATE - INTERVAL '30 days'
       WHERE g.user_id = $1
       GROUP BY g.id, c.name
       ORDER BY g.created_at DESC`,
      [req.userId]
    );
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { category_id, target_score } = req.body as { category_id?: number; target_score?: number };

  if (!category_id || !target_score) {
    res.status(400).json({ error: 'category_id and target_score required' });
    return;
  }
  if (target_score < 1 || target_score > 10) {
    res.status(400).json({ error: 'target_score must be 1–10' });
    return;
  }

  try {
    const { rows: catRows } = await pool.query(
      'SELECT id FROM categories WHERE id = $1 AND user_id = $2',
      [category_id, req.userId]
    );
    if (catRows.length === 0) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const { rows } = await pool.query(
      `INSERT INTO goals (user_id, category_id, target_score)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, category_id) DO UPDATE SET target_score = EXCLUDED.target_score
       RETURNING *`,
      [req.userId, category_id, target_score]
    );
    res.status(201).json({ data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM goals WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (rowCount === 0) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
