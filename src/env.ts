import 'dotenv/config';

export const env = {
  PORT: parseInt(process.env.PORT || '5001', 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',

  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID!,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN!,
  TWILIO_API_KEY: process.env.TWILIO_API_KEY!,
  TWILIO_API_SECRET: process.env.TWILIO_API_SECRET!,
  TWILIO_TWIML_APP_SID: process.env.TWILIO_TWIML_APP_SID!,
  TWILIO_NUMBER: process.env.TWILIO_NUMBER!,

  REDIS_URL: process.env.REDIS_URL,
  REDIS_TLS: (process.env.REDIS_TLS || 'false').toLowerCase() === 'true',
};
['TWILIO_ACCOUNT_SID','TWILIO_AUTH_TOKEN','TWILIO_API_KEY','TWILIO_API_SECRET','TWILIO_TWIML_APP_SID','TWILIO_NUMBER']
  .forEach(k => { if (!(env as any)[k]) throw new Error(`Missing env: ${k}`); });
