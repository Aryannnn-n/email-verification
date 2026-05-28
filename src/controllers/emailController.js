import { verifyEmail } from '../utils/verifyEmail.js';

// Handler for email validation request
export const verifyEmailController = async (req, res) => {
  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: 'Missing "email" field in request body.' });
  }

  try {
    const result = await verifyEmail(email);
    return res.status(200).json(result);
  } catch (err) {
    console.error('Verification controller error:', err);
    return res.status(500).json({
      email,
      result: 'unknown',
      resultcode: 3,
      subresult: 'server_error',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
};
