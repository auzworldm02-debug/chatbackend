import { Router } from 'express';
import { twiml } from 'twilio';
import { env } from '../env';

const r = Router();

// Incoming call / default dial rules
r.post('/voice/incoming', (req, res) => {
  const vr = new twiml.VoiceResponse();
  const to = (req.body.To || '').trim();

  if (to) {
    const dial = vr.dial({ callerId: env.TWILIO_NUMBER, record: 'do-not-record' });
    if (/^\+?\d{6,}$/.test(to)) dial.number({}, to);
    else dial.client({}, to);
  } else {
    const dial = vr.dial({ record: 'do-not-record' });
    dial.client({}, 'support'); // default group identity
  }

  res.type('text/xml').send(vr.toString());
});

// Hold music for parked customers
r.post('/voice/hold', (_req, res) => {
  const vr = new twiml.VoiceResponse();
  const p = vr.play();
  p.loop(0);
  // Twilio's sample audio; replace with your own if desired
  p.url('http://com.twilio.sounds.music.s3.amazonaws.com/MARKOVICHAMP-Borghestral.mp3');
  res.type('text/xml').send(vr.toString());
});

// Build TwiML to dial a client identity (used for redirect-based transfer)
r.post('/voice/transfer-to-client', (req, res) => {
  const targetIdentity = String(req.body.targetIdentity || 'agent2');
  const vr = new twiml.VoiceResponse();
  vr.dial({ callerId: env.TWILIO_NUMBER }).client(targetIdentity);
  res.type('text/xml').send(vr.toString());
});

// Conference join (only required if you choose 3-way Connect & Stay)
r.post('/voice/join-conference', (req, res) => {
  const conf = String(req.body.confName || 'xfer-bridge');
  const vr = new twiml.VoiceResponse();
  vr.dial().conference({ endConferenceOnExit: false }, conf);
  res.type('text/xml').send(vr.toString());
});

export default r;
