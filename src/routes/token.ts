import { Router } from 'express';
import { createAccessToken } from '../twilio';

const router = Router();

router.get('/', (req, res) => {
  const identity = String(req.query.identity || 'anonymous');
  const token = createAccessToken(identity);
  res.json({ token, identity });
});

export default router;
