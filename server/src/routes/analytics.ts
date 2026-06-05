import { Router, Response } from 'express';
import pool from '../db/pool';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// GET /api/analytics/overall?days=30
router.get('/overall', async (req: AuthRequest, res: Response) => {
  const days = parseInt(req.query.days as string) || 30;
  const userId = req.userId!;

  try {
    // Trend: daily overall score
    const { rows: trend } = await pool.query(
      `SELECT de.date, ROUND(AVG(s.score)::numeric, 2) AS overall_score
       FROM daily_entries de
       JOIN scores s ON s.entry_id = de.id
       WHERE de.user_id = $1
         AND de.date >= CURRENT_DATE - ($2 || ' days')::interval
       GROUP BY de.date
       ORDER BY de.date ASC`,
      [userId, days]
    );

    // Averages
    const { rows: avgs } = await pool.query(
      `SELECT
        ROUND(AVG(CASE WHEN de.date = CURRENT_DATE THEN s.score END)::numeric, 2) AS daily_average,
        ROUND(AVG(CASE WHEN de.date >= CURRENT_DATE - INTERVAL '7 days' THEN s.score END)::numeric, 2) AS weekly_average,
        ROUND(AVG(CASE WHEN de.date >= CURRENT_DATE - INTERVAL '30 days' THEN s.score END)::numeric, 2) AS monthly_average
       FROM daily_entries de
       JOIN scores s ON s.entry_id = de.id
       WHERE de.user_id = $1
         AND de.date >= CURRENT_DATE - INTERVAL '30 days'`,
      [userId]
    );

    // Current streak (consecutive days with entries up to today)
    const { rows: streakRows } = await pool.query(
      `WITH dated AS (
         SELECT date,
                date - (ROW_NUMBER() OVER (ORDER BY date))::integer AS grp
         FROM daily_entries
         WHERE user_id = $1
           AND date <= CURRENT_DATE
       )
       SELECT COUNT(*) AS streak
       FROM dated
       WHERE grp = (
         SELECT date - (ROW_NUMBER() OVER (ORDER BY date))::integer
         FROM daily_entries
         WHERE user_id = $1 AND date <= CURRENT_DATE
         ORDER BY date DESC
         LIMIT 1
       )`,
      [userId]
    );

    // Per-category averages (for best/worst)
    const { rows: catStats } = await pool.query(
      `SELECT
        c.id AS category_id,
        c.name AS category_name,
        ROUND(AVG(s.score)::numeric, 2) AS average,
        MAX(s.score) AS highest,
        MIN(s.score) AS lowest,
        ROUND(STDDEV(s.score)::numeric, 2) AS stddev
       FROM scores s
       JOIN categories c ON c.id = s.category_id
       JOIN daily_entries de ON de.id = s.entry_id
       WHERE de.user_id = $1
       GROUP BY c.id, c.name
       ORDER BY average DESC`,
      [userId]
    );

    const best = catStats[0] ?? null;
    const worst = catStats[catStats.length - 1] ?? null;

    res.json({
      data: {
        daily_average: avgs[0]?.daily_average ?? null,
        weekly_average: avgs[0]?.weekly_average ?? null,
        monthly_average: avgs[0]?.monthly_average ?? null,
        current_streak: parseInt(streakRows[0]?.streak ?? '0'),
        best_category: best,
        worst_category: worst,
        trend,
        category_stats: catStats,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/category/:id?days=90
router.get('/category/:id', async (req: AuthRequest, res: Response) => {
  const categoryId = parseInt(req.params.id);
  const days = parseInt(req.query.days as string) || 90;
  const userId = req.userId!;

  try {
    // Verify category belongs to user
    const { rows: catRows } = await pool.query(
      'SELECT * FROM categories WHERE id = $1 AND user_id = $2',
      [categoryId, userId]
    );
    if (catRows.length === 0) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const { rows: stats } = await pool.query(
      `SELECT
        c.id AS category_id,
        c.name AS category_name,
        ROUND(AVG(s.score)::numeric, 2) AS average,
        MAX(s.score) AS highest,
        MIN(s.score) AS lowest,
        ROUND(STDDEV(s.score)::numeric, 2) AS stddev
       FROM scores s
       JOIN categories c ON c.id = s.category_id
       JOIN daily_entries de ON de.id = s.entry_id
       WHERE de.user_id = $1 AND s.category_id = $2`,
      [userId, categoryId]
    );

    const { rows: trend } = await pool.query(
      `SELECT de.date, s.score
       FROM scores s
       JOIN daily_entries de ON de.id = s.entry_id
       WHERE de.user_id = $1
         AND s.category_id = $2
         AND de.date >= CURRENT_DATE - ($3 || ' days')::interval
       ORDER BY de.date ASC`,
      [userId, categoryId, days]
    );

    res.json({
      data: {
        stats: stats[0] ?? null,
        trend,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/heatmap?year=2026
router.get('/heatmap', async (req: AuthRequest, res: Response) => {
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  const userId = req.userId!;

  try {
    const { rows } = await pool.query(
      `SELECT de.date, ROUND(AVG(s.score)::numeric, 2) AS overall_score
       FROM daily_entries de
       JOIN scores s ON s.entry_id = de.id
       WHERE de.user_id = $1
         AND EXTRACT(YEAR FROM de.date) = $2
       GROUP BY de.date
       ORDER BY de.date ASC`,
      [userId, year]
    );
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/comparison?category_ids=1,2,3&days=30
router.get('/comparison', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const days = parseInt(req.query.days as string) || 30;
  const ids = ((req.query.category_ids as string) || '')
    .split(',')
    .map((id) => parseInt(id))
    .filter((id) => !isNaN(id));

  if (ids.length === 0) {
    res.status(400).json({ error: 'category_ids required' });
    return;
  }

  try {
    // Verify all categories belong to user
    const { rows: cats } = await pool.query(
      'SELECT id, name FROM categories WHERE id = ANY($1) AND user_id = $2',
      [ids, userId]
    );
    if (cats.length !== ids.length) {
      res.status(404).json({ error: 'One or more categories not found' });
      return;
    }

    const { rows } = await pool.query(
      `SELECT de.date, s.category_id, c.name AS category_name, s.score
       FROM scores s
       JOIN daily_entries de ON de.id = s.entry_id
       JOIN categories c ON c.id = s.category_id
       WHERE de.user_id = $1
         AND s.category_id = ANY($2)
         AND de.date >= CURRENT_DATE - ($3 || ' days')::interval
       ORDER BY de.date ASC, s.category_id`,
      [userId, ids, days]
    );

    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
