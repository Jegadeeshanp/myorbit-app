// lib/firebase-admin.ts — Server-only Firebase Admin SDK helpers.
// NEVER import this file in client components or lib/firebase.ts.
import * as admin from 'firebase-admin';
import type { Message, MulticastMessage } from 'firebase-admin/messaging';

// ── Singleton initialisation ───────────────────────────────────────────────

function getAdminApp(): admin.app.App {
  if (admin.apps.length) return admin.apps[0]!;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_JSON env var is missing. ' +
      'Download it from Firebase Console → Project Settings → Service Accounts.'
    );
  }

  let credential: admin.ServiceAccount;
  try {
    credential = JSON.parse(raw) as admin.ServiceAccount;
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.');
  }

  return admin.initializeApp({ credential: admin.credential.cert(credential) });
}

// ── Types ─────────────────────────────────────────────────────────────────

export interface NotificationPayload {
  title:  string;
  body:   string;
  icon?:  string;
  /** Deep-link inside the PWA, e.g. '/orbit/tasks' */
  url?:   string;
  /** Notification tag — prevents duplicate banners for the same topic */
  tag?:   string;
  /** Extra key-value pairs forwarded to the SW / app */
  data?:  Record<string, string>;
}

// ── Core send helpers ──────────────────────────────────────────────────────

/** Send a notification to a single FCM registration token. */
export async function sendToToken(
  token: string,
  payload: NotificationPayload
): Promise<void> {
  const app = getAdminApp();
  const message: Message = {
    token,
    notification: { title: payload.title, body: payload.body },
    webpush: {
      notification: {
        title:  payload.title,
        body:   payload.body,
        icon:   payload.icon  ?? '/icons/icon-192.png',
        badge:  '/icons/icon-72.png',
        tag:    payload.tag,
      },
      fcmOptions: { link: payload.url ?? '/orbit/tasks' },
    },
    data: {
      ...(payload.url  ? { url:  payload.url  } : {}),
      ...(payload.tag  ? { tag:  payload.tag  } : {}),
      ...(payload.data ?? {}),
    },
  };
  await app.messaging().send(message);
}

/**
 * Send a notification to up to 500 FCM tokens at once.
 * Logs individual failures but does not throw.
 */
export async function sendToTokens(
  tokens: string[],
  payload: NotificationPayload
): Promise<void> {
  if (!tokens.length) return;

  const app = getAdminApp();
  const message: MulticastMessage = {
    tokens,
    notification: { title: payload.title, body: payload.body },
    webpush: {
      notification: {
        title:  payload.title,
        body:   payload.body,
        icon:   payload.icon  ?? '/icons/icon-192.png',
        badge:  '/icons/icon-72.png',
        tag:    payload.tag,
      },
      fcmOptions: { link: payload.url ?? '/orbit/tasks' },
    },
    data: {
      ...(payload.url  ? { url:  payload.url  } : {}),
      ...(payload.tag  ? { tag:  payload.tag  } : {}),
      ...(payload.data ?? {}),
    },
  };

  const response = await app.messaging().sendEachForMulticast(message);
  if (response.failureCount > 0) {
    response.responses.forEach((r, i) => {
      if (!r.success) {
        console.error(`[FCM] Token index ${i} failed:`, r.error?.message);
      }
    });
  }
}

/**
 * Send a notification to every registered device of a user.
 * Pass in the prisma client to avoid circular imports.
 */
export async function sendToUser(
  userId: string,
  payload: NotificationPayload,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prismaClient: any
): Promise<void> {
  const rows: { token: string }[] = await prismaClient.pushToken.findMany({
    where:  { userId },
    select: { token: true },
  });
  const tokens = rows.map(r => r.token);
  await sendToTokens(tokens, payload);
}

// ── Convenience notification builders ────────────────────────────────────

/** Remind a user to check in on a habit. */
export async function sendHabitReminder(
  userId: string,
  habitName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prismaClient: any
): Promise<void> {
  await sendToUser(
    userId,
    {
      title: '🔥 Habit Check-in',
      body:  `Time to log: ${habitName}`,
      url:   '/orbit/habits',
      tag:   `habit-${userId}`,
    },
    prismaClient
  );
}

/** Remind a user about an upcoming or overdue task. */
export async function sendTaskReminder(
  userId: string,
  taskTitle: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prismaClient: any
): Promise<void> {
  await sendToUser(
    userId,
    {
      title: '📋 Task Due',
      body:  taskTitle,
      url:   '/orbit/tasks',
      tag:   `task-${userId}`,
    },
    prismaClient
  );
}
