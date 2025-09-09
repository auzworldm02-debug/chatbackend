import { Router } from 'express';
import { client } from '../twilio';
import { env } from '../env';
import { setState, getState } from '../store';
import crypto from 'crypto';

const r = Router();

/**
 * Redirect-based transfer flows.
 * Requires you to know: customerCallSid, agent1CallSid, and agent2 identity.
 * Optionally uses a small state machine keyed by transferId.
 */

// Start "announce & transfer" (consult). Park customer, dial Agent 2, track status.
r.post('/announce/start', async (req, res, next) => {
  try {
    const { customerCallSid, agent1CallSid, agent2Identity } = req.body as {
      customerCallSid: string; agent1CallSid: string; agent2Identity: string;
    };

    // 1) Park customer on hold
    await client.calls(customerCallSid).update({
      method: 'POST',
      url: `${req.protocol}://${req.get('host')}/twiml/voice/hold`
    });

    // 2) Originate consult call to Agent 2 with status callbacks
    const transferId = crypto.randomUUID();
    const consult = await client.calls.create({
      from: env.TWILIO_NUMBER,
      to: `client:${agent2Identity}`,
      statusCallback: `${req.protocol}://${req.get('host')}/callbacks/voice?transferId=${transferId}`,
      statusCallbackMethod: 'POST',
      statusCallbackEvent: ['initiated','ringing','answered','completed'],
      // A simple greeting so Agent 2 knows it's a consult
      twiml: `<Response><Say>Consult call from ${agent1CallSid}.</Say></Response>`
    });

    await setState(`xfer:${transferId}`, {
      state: 'dialing',
      customerCallSid,
      agent1CallSid,
      agent2Identity,
      consultSid: consult.sid
    });

    res.json({ transferId, consultSid: consult.sid });
  } catch (e) { next(e); }
});

// Poll transfer state (Agent 1 UI polls until agent2-answered)
r.get('/state/:transferId', async (req, res) => {
  const st = await getState<any>(`xfer:${req.params.transferId}`);
  res.json(st || { state: 'unknown' });
});

// Direct (cold) transfer: move customer to Agent 2, hang up Agent 1
r.post('/direct', async (req, res, next) => {
  try {
    const { customerCallSid, agent1CallSid, agent2Identity } = req.body as {
      customerCallSid: string; agent1CallSid: string; agent2Identity: string;
    };

    await client.calls(customerCallSid).update({
      twiml: `<Response><Dial callerId="${env.TWILIO_NUMBER}"><Client>${agent2Identity}</Client></Dial></Response>`
    });

    await client.calls(agent1CallSid).update({ status: 'completed' });

    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Announce complete: Connect & Leave
r.post('/announce/complete/leave', async (req, res, next) => {
  try {
    const { transferId } = req.body as { transferId: string };
    const st = await getState<any>(`xfer:${transferId}`);
    if (!st) return res.status(400).json({ error: 'invalid transferId' });

    await client.calls(st.customerCallSid).update({
      twiml: `<Response><Dial callerId="${env.TWILIO_NUMBER}"><Client>${st.agent2Identity}</Client></Dial></Response>`
    });

    await client.calls(st.agent1CallSid).update({ status: 'completed' });

    await setState(`xfer:${transferId}`, { ...st, state: 'completed-leave' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Announce complete: Connect & Stay (3-way requires a conference)
r.post('/announce/complete/stay', async (req, res, next) => {
  try {
    const { transferId } = req.body as { transferId: string };
    const st = await getState<any>(`xfer:${transferId}`);
    if (!st) return res.status(400).json({ error: 'invalid transferId' });

    const joinUrl = `${req.protocol}://${req.get('host')}/twiml/voice/join-conference`;
    // Redirect customer + Agent1 + consult leg (Agent2) into same conf
    await Promise.all([
      client.calls(st.customerCallSid).update({ method: 'POST', url: joinUrl, twiml: undefined }),
      client.calls(st.agent1CallSid).update({ method: 'POST', url: joinUrl, twiml: undefined }),
      client.calls(st.consultSid).update({ method: 'POST', url: joinUrl, twiml: undefined }),
    ]);

    await setState(`xfer:${transferId}`, { ...st, state: 'completed-stay' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default r;
