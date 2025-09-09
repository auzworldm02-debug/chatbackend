import express from 'express';
import cors from 'cors';
import { env } from './env';
import token from './routes/token';
import twiml from './routes/twiml';
import transfer from './routes/transfer';
import callbacks from './routes/callbacks';
import { initRedis } from './store';

const app = express();
initRedis(env.REDIS_URL, env.REDIS_TLS);

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.urlencoded({ extended: true })); // Twilio sends form-encoded
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/token', token);
app.use('/twiml', twiml);
app.use('/transfer', transfer);
app.use('/callbacks', callbacks);

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ error: err?.message || 'Server error' });
});

app.listen(env.PORT, () => console.log(`Server listening :${env.PORT}`));
