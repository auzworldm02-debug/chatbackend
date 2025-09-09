import { Router } from 'express';
import { setState, getState } from '../store';

const r = Router();

/**
 * This endpoint records call lifecycle events. Configure your TwiML App (or Number)
 * Status Callback URL to POST here with events: initiated, ringing, answered, completed.
 * We'll store enough state to know when Agent 2 has answered the consult.
 */

// Map consult CallSid -> transferId
const consultIndex = new Map<string, string>();

r.post('/voice', async (req, res) => {
  const {
    CallSid, ParentCallSid, CallStatus, From, To, Direction, Called, Caller
  } = req.body;

  // If we were told which transferId this consult maps to, persist it:
  const xferId = req.query.transferId ? String(req.query.transferId) : consultIndex.get(CallSid);

  if (xferId) {
    // Update state machine
    const st = (await getState<any>(`xfer:${xferId}`)) || {};
    st.consultSid = st.consultSid || CallSid;
    st.lastStatus = CallStatus;
    if (['answered', 'in-progress'].includes(String(CallStatus || '').toLowerCase())) {
      st.state = 'agent2-answered';
    }
    if (String(CallStatus || '').toLowerCase() === 'completed') {
      st.state = 'consult-ended';
    }
    await setState(`xfer:${xferId}`, st);
    consultIndex.set(CallSid, xferId);
  }

  res.sendStatus(204);
});

export default r;
