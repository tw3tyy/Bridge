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

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: { message: 'Missing fields' } });
  }

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT id, username, email, password_hash, xp, level FROM users WHERE email = $1', [email]);
    client.release();
    if (result.rowCount === 0) {
      return res.status(401).json({ error: { message: 'Invalid credentials' } });
    }
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: { message: 'Invalid credentials' } });
    }
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(200).json({ token, user: { id: user.id, username: user.username, email: user.email, xp: user.xp, level: user.level } });
  } catch (e) {
    console.error('Login error', e);
    return res.status(500).json({ error: { message: e.message } });
  }
}
