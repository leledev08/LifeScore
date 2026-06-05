import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import categoryRoutes from './routes/categories';
import entryRoutes from './routes/entries';
import analyticsRoutes from './routes/analytics';
import goalRoutes from './routes/goals';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/entries', entryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/goals', goalRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
