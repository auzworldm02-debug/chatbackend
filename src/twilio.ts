import twilio, { Twilio, jwt } from 'twilio';
import { env } from './env';

export const client: Twilio = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

export function createAccessToken(identity: string) {
  const token = new jwt.AccessToken(
    env.TWILIO_ACCOUNT_SID,
    env.TWILIO_API_KEY,
    env.TWILIO_API_SECRET,
    { identity, ttl: 60 * 60 }
  );
  const grant = new jwt.AccessToken.VoiceGrant({
    outgoingApplicationSid: env.TWILIO_TWIML_APP_SID,
    incomingAllow: true,
  });
  token.addGrant(grant);
  return token.toJwt();
}
