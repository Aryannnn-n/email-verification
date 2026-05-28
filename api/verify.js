// Vercel serverless handler - imports core logic from src/utils
import { verifyEmail } from '../src/utils/verifyEmail.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: 'Missing "email" field in request body.' });
  }

  try {
    const result = await verifyEmail(email);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({
      email,
      result: 'unknown',
      resultcode: 3,
      subresult: 'server_error',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
}
