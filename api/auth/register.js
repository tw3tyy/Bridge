import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const config = {
  api: {
    bodyParser: true,
  },
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_me';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method Not Allowed' } });
  }

  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: { message: 'Missing fields' } });
  }

  try {
    const client = await pool.connect();
    const hashed = await bcrypt.hash(password, 10);
    const result = await client.query(
      'INSERT INTO users (username, email, password_hash, xp, level) VALUES ($1, $2, $3, 0, 1) RETURNING id, username, email, xp, level, created_at',
      [username, email, hashed]
    );
    client.release();
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({ token, user: { id: user.id, username: user.username, email: user.email, xp: user.xp, level: user.level } });
  } catch (e) {
    console.error('Register error', e);
    return res.status(500).json({ error: { message: e.message } });
  }
}
