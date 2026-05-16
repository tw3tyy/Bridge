import { Pool } from 'pg';
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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { message: 'Method Not Allowed' } });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    return res.status(401).json({ error: { message: 'Missing token' } });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const client = await pool.connect();
    const result = await client.query('SELECT id, username, email, xp, level, created_at FROM users WHERE id = $1', [payload.id]);
    client.release();
    if (result.rowCount === 0) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }
    const user = result.rows[0];
    return res.status(200).json({ 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        xp: user.xp,
        level: user.level,
        createdAt: user.created_at 
      } 
    });
  } catch (e) {
    console.error('Auth me error', e);
    return res.status(401).json({ error: { message: e.message } });
  }
}
