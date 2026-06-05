import { Router, Response } from 'express';
import { PoolClient } from 'pg';
import pool from '../db/pool';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// GET /api/entries?start=YYYY-MM-DD&end=YYYY-MM-DD&category_id=N&min_score=N
router.get('/', async (req: AuthRequest, res: Response) => {
  const { start, end, category_id, min_score } = req.query;
  const params: unknown[] = [req.userId];
  const conditions: string[] = ['de.user_id = $1'];

  if (start) { params.push(start); conditions.push(`de.date >= $${params.length}`); }
  if (end)   { params.push(end);   conditions.push(`de.date <= $${params.length}`); }

  try {
    const { rows: entries } = await pool.query(
      `SELECT de.*,
        ROUND(AVG(s.score)::numeric, 2) AS overall_score
       FROM daily_entries de
       LEFT JOIN scores s ON s.entry_id = de.id
       WHERE ${conditions.join(' AND ')}
       GROUP BY de.id
       ORDER BY de.date DESC`,
      params
    );

    if (!entries.length) {
      res.json({ data: [] });
      return;
    }

    // Apply post-aggregation filters
    let filtered = entries;
    if (min_score) filtered = filtered.filter((e) => e.overall_score >= parseFloat(min_score as string));

    // Fetch scores for each entry (with category filter if requested)
    const entryIds = filtered.map((e) => e.id);
    let scoresQuery = `
      SELECT s.*, c.name AS category_name
      FROM scores s
      JOIN categories c ON c.id = s.category_id
      WHERE s.entry_id = ANY($1)
    `;
    const scoresParams: unknown[] = [entryIds];
    if (category_id) {
      scoresParams.push(parseInt(category_id as string));
      scoresQuery += ` AND s.category_id = $${scoresParams.length}`;
    }

    const { rows: scores } = await pool.query(scoresQuery, scoresParams);

    const scoresByEntry = scores.reduce<Record<number, typeof scores>>((acc, s) => {
      (acc[s.entry_id] ??= []).push(s);
      return acc;
    }, {});

    const result = filtered.map((e) => ({ ...e, scores: scoresByEntry[e.id] ?? [] }));
    res.json({ data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/entries/:date  (YYYY-MM-DD)
router.get('/:date', async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM daily_entries WHERE user_id = $1 AND date = $2',
      [req.userId, req.params.date]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: 'Entry not found' });
      return;
    }
    const entry = rows[0];
    const { rows: scores } = await pool.query(
      `SELECT s.*, c.name AS category_name
       FROM scores s JOIN categories c ON c.id = s.category_id
       WHERE s.entry_id = $1 ORDER BY c.sort_order`,
      [entry.id]
    );
    res.json({ data: { ...entry, scores } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/entries
router.post('/', async (req: AuthRequest, res: Response) => {
  const { date, notes, scores } = req.body as {
    date?: string;
    notes?: string;
    scores?: { category_id: number; score: number }[];
  };

  if (!date) { res.status(400).json({ error: 'date required' }); return; }
  if (!scores?.length) { res.status(400).json({ error: 'scores required' }); return; }

  for (const s of scores) {
    if (s.score < 1 || s.score > 10) {
      res.status(400).json({ error: `Score out of range for category ${s.category_id}` });
      return;
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      'INSERT INTO daily_entries (user_id, date, notes) VALUES ($1, $2, $3) RETURNING *',
      [req.userId, date, notes ?? null]
    );
    const entry = rows[0];

    await insertScores(client, entry.id, scores);

    await client.query('COMMIT');

    const { rows: savedScores } = await pool.query(
      `SELECT s.*, c.name AS category_name
       FROM scores s JOIN categories c ON c.id = s.category_id
       WHERE s.entry_id = $1 ORDER BY c.sort_order`,
      [entry.id]
    );
    res.status(201).json({ data: { ...entry, scores: savedScores } });
  } catch (err: unknown) {
    await client.query('ROLLBACK');
    if ((err as { code?: string }).code === '23505') {
      res.status(409).json({ error: 'Entry already exists for this date' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// PUT /api/entries/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { notes, scores } = req.body as {
    notes?: string;
    scores?: { category_id: number; score: number }[];
  };

  if (scores) {
    for (const s of scores) {
      if (s.score < 1 || s.score > 10) {
        res.status(400).json({ error: `Score out of range for category ${s.category_id}` });
        return;
      }
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      'UPDATE daily_entries SET notes = COALESCE($1, notes) WHERE id = $2 AND user_id = $3 RETURNING *',
      [notes ?? null, id, req.userId]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: 'Entry not found' });
      return;
    }
    const entry = rows[0];

    if (scores?.length) {
      await client.query('DELETE FROM scores WHERE entry_id = $1', [entry.id]);
      await insertScores(client, entry.id, scores);
    }

    await client.query('COMMIT');

    const { rows: savedScores } = await pool.query(
      `SELECT s.*, c.name AS category_name
       FROM scores s JOIN categories c ON c.id = s.category_id
       WHERE s.entry_id = $1 ORDER BY c.sort_order`,
      [entry.id]
    );
    res.json({ data: { ...entry, scores: savedScores } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// DELETE /api/entries/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM daily_entries WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (rowCount === 0) {
      res.status(404).json({ error: 'Entry not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function insertScores(
  client: PoolClient,
  entryId: number,
  scores: { category_id: number; score: number }[]
) {
  const params: (number)[] = [];
  const valueClauses = scores.map((s) => {
    const base = params.length;
    params.push(entryId, s.category_id, s.score);
    return `($${base + 1}, $${base + 2}, $${base + 3})`;
  });
  await client.query(
    `INSERT INTO scores (entry_id, category_id, score) VALUES ${valueClauses.join(', ')}`,
    params
  );
}

export default router;
