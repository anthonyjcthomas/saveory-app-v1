/**
 * Deal-update pushes + manual broadcast pushes (Expo Push API).
 *
 * Manual send:
 * - Callable `sendManualBroadcast`: `adminPushSenders/{uid}` (optional `active: false` to disable), OR `businessOwners/{uid}` (owners cannot spoof another venue’s establishmentId).
 * - HTTPS `sendManualBroadcastHttp` (POST JSON + secret). Configure: `firebase functions:config:set manualpush.secret="YOUR_LONG_SECRET"`
 *
 * Deploy: `firebase deploy --only functions`
 */
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

admin.initializeApp();

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

function snapshotDeals(data) {
  return JSON.stringify(data?.happy_hour_deals ?? null);
}

/** Expo requires string values in `data`. */
function stringifyPushData(obj) {
  if (!obj || typeof obj !== 'object') return {};
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[String(k)] = v == null ? '' : String(v);
  }
  return out;
}

/** Same logic as app `businessOwner.ts` — IDs must match `establishments` document IDs. */
function normalizeOwnerEstablishmentIds(data) {
  if (!data || typeof data !== 'object') return [];
  const multi = data.establishmentIds;
  if (Array.isArray(multi)) {
    const ids = multi.map((x) => String(x).trim()).filter(Boolean);
    return [...new Set(ids)];
  }
  const single = data.establishmentId;
  if (typeof single === 'string' && single.trim()) {
    return [single.trim()];
  }
  return [];
}

/**
 * @returns {Promise<{ ok: boolean, role?: 'admin' | 'owner', ownerEstablishmentIds?: string[] }>}
 */
async function authorizeManualBroadcast(uid) {
  const adminSnap = await admin.firestore().doc(`adminPushSenders/${uid}`).get();
  if (adminSnap.exists && adminSnap.get('active') !== false) {
    return { ok: true, role: 'admin' };
  }
  const ownerSnap = await admin.firestore().doc(`businessOwners/${uid}`).get();
  if (!ownerSnap.exists) {
    return { ok: false };
  }
  const ownerEstablishmentIds = normalizeOwnerEstablishmentIds(ownerSnap.data());
  return { ok: true, role: 'owner', ownerEstablishmentIds };
}

/**
 * @param {string[]} tokens
 * @param {{ title: string; body: string; data: Record<string, string> }} payload
 * @param {string} logTag
 */
async function sendExpoBatch(tokens, payload, logTag) {
  const tag = logTag || 'sendExpoBatch';
  const chunkSize = 100;
  for (let i = 0; i < tokens.length; i += chunkSize) {
    const chunk = tokens.slice(i, i + chunkSize);
    const messages = chunk.map((to) => ({
      to,
      sound: 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data,
    }));
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });
    const text = await res.text();
    if (!res.ok) {
      console.error(`[${tag}] Expo HTTP error`, res.status, text);
      continue;
    }
    try {
      const json = JSON.parse(text);
      if (json.data?.some((row) => row.status === 'error')) {
        console.error(`[${tag}] Expo ticket errors`, json.data);
      }
    } catch (e) {
      console.error(`[${tag}] Expo parse error`, e, text);
    }
  }
}

/**
 * @param {FirebaseFirestore.Firestore} db
 * @returns {Promise<string[]>}
 */
async function collectOptedInExpoTokens(db) {
  const snap = await db.collection('users').where('dealAlertsOptIn', '==', true).get();
  const tokens = [];
  snap.forEach((doc) => {
    const t = doc.get('expoPushToken');
    if (typeof t === 'string' && t.length > 0) {
      tokens.push(t);
    }
  });
  return tokens;
}

exports.notifyDealUpdate = functions
  .region('us-central1')
  .runWith({ maxInstances: 10 })
  .firestore.document('establishments/{estId}')
  .onUpdate(async (change, context) => {
    const estId = context.params.estId;
    console.log('[notifyDealUpdate] triggered', { estId });

    const before = change.before.data();
    const after = change.after.data();
    if (snapshotDeals(before) === snapshotDeals(after)) {
      console.log('[notifyDealUpdate] skip: happy_hour_deals unchanged', { estId });
      return;
    }

    const venueName = typeof after.name === 'string' && after.name.length > 0 ? after.name : estId;
    console.log('[notifyDealUpdate] happy_hour_deals changed', { estId, venueName });

    const db = admin.firestore();
    const tokens = await collectOptedInExpoTokens(db);

    if (tokens.length === 0) {
      console.log('[notifyDealUpdate] No opted-in tokens', { estId });
      return;
    }

    console.log('[notifyDealUpdate] sending Expo push', { estId, recipientCount: tokens.length });
    await sendExpoBatch(
      tokens,
      {
        title: 'Happy hour update',
        body: `${venueName} updated their deals.`,
        data: stringifyPushData({
          type: 'deal_update',
          establishmentId: String(estId),
        }),
      },
      'notifyDealUpdate'
    );
  });

/**
 * Signed-in: `adminPushSenders/{uid}` OR Firestore `businessOwners/{uid}` (same as app portal).
 * Owners may only set `establishmentId` to a venue they manage (deep link target).
 */
exports.sendManualBroadcast = functions
  .region('us-central1')
  .runWith({ maxInstances: 5 })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
    }
    const uid = context.auth.uid;
    const authz = await authorizeManualBroadcast(uid);
    if (!authz.ok) {
      throw new functions.https.HttpsError('permission-denied', 'Not authorized to send broadcast pushes.');
    }

    const title = typeof data.title === 'string' ? data.title.trim() : '';
    const body = typeof data.body === 'string' ? data.body.trim() : '';
    if (!title || !body) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Fields title and body are required (non-empty strings).'
      );
    }

    let establishmentId =
      typeof data.establishmentId === 'string' ? data.establishmentId.trim() : '';
    if (authz.role === 'owner') {
      const allowed = authz.ownerEstablishmentIds || [];
      if (establishmentId) {
        if (allowed.length === 0) {
          throw new functions.https.HttpsError(
            'failed-precondition',
            'Link a venue in businessOwners (establishmentId or establishmentIds) before sending a listing deep link.'
          );
        }
        if (!allowed.includes(establishmentId)) {
          throw new functions.https.HttpsError(
            'invalid-argument',
            'establishmentId must be one of your managed listings.'
          );
        }
      }
    }

    const pushData = { type: 'manual_broadcast' };
    if (establishmentId) {
      pushData.establishmentId = establishmentId;
    }

    const db = admin.firestore();
    const tokens = await collectOptedInExpoTokens(db);
    if (tokens.length === 0) {
      return { recipientCount: 0, message: 'No opted-in devices with push tokens.' };
    }

    console.log('[sendManualBroadcast]', {
      uid,
      role: authz.role,
      recipientCount: tokens.length,
      title,
    });
    await sendExpoBatch(
      tokens,
      {
        title,
        body,
        data: stringifyPushData(pushData),
      },
      'sendManualBroadcast'
    );
    return { recipientCount: tokens.length };
  });

/**
 * POST JSON: { "secret": "...", "title": "...", "body": "...", "establishmentId": "optional" }
 * or header: Authorization: Bearer <secret>
 *
 * firebase functions:config:set manualpush.secret="your-long-random-string"
 */
exports.sendManualBroadcastHttp = functions
  .region('us-central1')
  .runWith({ maxInstances: 5 })
  .https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    if (req.method !== 'POST') {
      res.status(405).send('POST only');
      return;
    }

    const cfg = functions.config().manualpush || {};
    const expectedSecret = cfg.secret;
    if (!expectedSecret || typeof expectedSecret !== 'string') {
      console.error('[sendManualBroadcastHttp] Set manualpush.secret via firebase functions:config:set');
      res.status(503).send('manualpush.secret not configured');
      return;
    }

    const authHeader = req.get('Authorization') || '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const body = req.body || {};
    const secret = bearer || body.secret;
    if (secret !== expectedSecret) {
      res.status(403).send('Forbidden');
      return;
    }

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const bodyText = typeof body.body === 'string' ? body.body.trim() : '';
    if (!title || !bodyText) {
      res.status(400).send('title and body required');
      return;
    }

    const establishmentId =
      typeof body.establishmentId === 'string' ? body.establishmentId.trim() : '';
    const pushData = { type: 'manual_broadcast' };
    if (establishmentId) {
      pushData.establishmentId = establishmentId;
    }

    const db = admin.firestore();
    const tokens = await collectOptedInExpoTokens(db);
    if (tokens.length === 0) {
      res.status(200).json({ recipientCount: 0, message: 'No opted-in devices with push tokens.' });
      return;
    }

    console.log('[sendManualBroadcastHttp]', { recipientCount: tokens.length, title });
    await sendExpoBatch(
      tokens,
      {
        title,
        body: bodyText,
        data: stringifyPushData(pushData),
      },
      'sendManualBroadcastHttp'
    );
    res.status(200).json({ recipientCount: tokens.length });
  });
