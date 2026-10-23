import * as argon2 from 'argon2';
import type { NextFunction, Request, Response } from 'express';

import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';

export type AdminSessionUser = {
  id: string;
  email: string;
  name: string | null;
};

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const sessionToken = req.cookies?.[env.COOKIE_NAME];

  if (!sessionToken) {
    res.clearCookie(env.COOKIE_NAME, { path: '/' });
    res.status(401).json({ message: 'Authentication required.' });
    return;
  }

  try {
    const activeSessions = await prisma.session.findMany({
      where: {
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        adminUser: true,
      },
    });

    for (const session of activeSessions) {
      const isValidToken = await argon2.verify(session.tokenHash, sessionToken).catch(() => false);

      if (!isValidToken) {
        continue;
      }

      req.admin = {
        id: session.adminUser.id,
        email: session.adminUser.email,
        name: session.adminUser.name,
      } satisfies AdminSessionUser;

      await prisma.session.update({
        where: { id: session.id },
        data: { lastSeenAt: new Date() },
      });

      next();
      return;
    }

    await prisma.session.updateMany({
      where: {
        tokenHash: {
          not: '',
        },
      },
      data: {
        revokedAt: new Date(),
      },
    });

    res.clearCookie(env.COOKIE_NAME, { path: '/' });
    res.status(401).json({ message: 'Your session has expired or is invalid.' });
  } catch (error) {
    console.error('Authentication middleware failed', error);
    res.clearCookie(env.COOKIE_NAME, { path: '/' });
    res.status(500).json({ message: 'Authentication failed.' });
  }
}
