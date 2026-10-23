import crypto from 'node:crypto';

import * as argon2 from 'argon2';
import { Router } from 'express';

import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();
const sessionDurationMs = 1000 * 60 * 60 * 24 * 7;

function setSessionCookie(res: { cookie: (...args: any[]) => any }, sessionToken: string): void {
  res.cookie(env.COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: sessionDurationMs,
  });
}

router.post('/login', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required.' });
    return;
  }

  const adminUser = await prisma.adminUser.findUnique({
    where: { email },
  });

  if (!adminUser) {
    res.status(401).json({ message: 'Invalid email or password.' });
    return;
  }

  const passwordMatches = await argon2.verify(adminUser.passwordHash, password).catch(() => false);

  if (!passwordMatches) {
    res.status(401).json({ message: 'Invalid email or password.' });
    return;
  }

  const rawSessionToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = await argon2.hash(rawSessionToken);
  const expiresAt = new Date(Date.now() + sessionDurationMs);

  await prisma.session.create({
    data: {
      tokenHash,
      expiresAt,
      adminUserId: adminUser.id,
      lastSeenAt: new Date(),
    },
  });

  setSessionCookie(res, rawSessionToken);

  res.json({
    ok: true,
    user: {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
    },
  });
});

router.post('/logout', requireAdmin, async (req, res) => {
  const sessionToken = req.cookies?.[env.COOKIE_NAME];

  if (sessionToken) {
    const activeSessions = await prisma.session.findMany({
      where: {
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    for (const session of activeSessions) {
      const matches = await argon2.verify(session.tokenHash, sessionToken).catch(() => false);
      if (matches) {
        await prisma.session.update({
          where: { id: session.id },
          data: { revokedAt: new Date() },
        });
        break;
      }
    }
  }

  res.clearCookie(env.COOKIE_NAME, { path: '/' });
  res.json({ ok: true, message: 'Logged out successfully.' });
});

router.get('/me', requireAdmin, (req, res) => {
  res.json({
    ok: true,
    user: req.admin,
  });
});

export const authRouter = router;
