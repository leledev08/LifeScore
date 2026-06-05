import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import pool from '../db/pool';
import { seedDefaultCategories, seedDefaultGroups } from '../db/seed';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Invalid email' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 12);
    const { rows } = await client.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, password_hash]
    );
    const user = rows[0];

    await seedDefaultGroups(user.id, client);
    await seedDefaultCategories(user.id, client);

    await client.query('COMMIT');

    const signOptions: SignOptions = { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'] };
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, signOptions);

    res.status(201).json({ data: { token, user } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, email, password_hash, created_at FROM users WHERE email = $1',
      [email]
    );

    if (rows.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const signOptions: SignOptions = { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'] };
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, signOptions);

    res.json({
      data: {
        token,
        user: { id: user.id, email: user.email, created_at: user.created_at },
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
