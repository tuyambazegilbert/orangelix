import { generatePasswordResetLink } from '../src/server/password-reset';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { email, continueUrl } = req.body || {};
    const result = await generatePasswordResetLink(email, continueUrl);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Password reset link generation failed',
    });
  }
}