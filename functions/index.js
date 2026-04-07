/**
 * Sends Expo push notifications when an establishment's `happy_hour_deals` field changes.
 *
 * Uses Cloud Functions **1st gen** Firestore triggers (same stack as your prior deploys) to avoid
 * Gen 2 + Eventarc IAM propagation issues on first setup.
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

/**
 * @param {string[]} tokens
 * @param {{ title: string; body: string; data: Record<string, string> }} payload
 */
async function sendExpoBatch(tokens, payload) {
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
      console.error('[notifyDealUpdate] Expo HTTP error', res.status, text);
      continue;
    }
    try {
      const json = JSON.parse(text);
      if (json.data?.some((row) => row.status === 'error')) {
        console.error('[notifyDealUpdate] Expo ticket errors', json.data);
      }
    } catch (e) {
      console.error('[notifyDealUpdate] Expo parse error', e, text);
    }
  }
}

exports.notifyDealUpdate = functions
  .region('us-central1')
  .runWith({ maxInstances: 10 })
  .firestore.document('establishments/{estId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (snapshotDeals(before) === snapshotDeals(after)) {
      return;
    }

    const estId = context.params.estId;
    const venueName = typeof after.name === 'string' && after.name.length > 0 ? after.name : estId;

    const db = admin.firestore();
    const snap = await db.collection('users').where('dealAlertsOptIn', '==', true).get();

    const tokens = [];
    snap.forEach((doc) => {
      const t = doc.get('expoPushToken');
      if (typeof t === 'string' && t.length > 0) {
        tokens.push(t);
      }
    });

    if (tokens.length === 0) {
      console.log('[notifyDealUpdate] No opted-in tokens', { estId });
      return;
    }

    await sendExpoBatch(tokens, {
      title: 'Happy hour update',
      body: `${venueName} updated their deals.`,
      data: {
        type: 'deal_update',
        establishmentId: String(estId),
      },
    });
  });
