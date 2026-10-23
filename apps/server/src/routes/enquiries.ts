import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { requireAdmin } from '../middleware/auth.js';

const publicEnquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  message: z.string().trim().min(10).max(4000).optional().or(z.literal('')).transform((value) => value || undefined),
  preferredContactMethod: z.enum(['EMAIL', 'PHONE']).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'AWAITING_RESPONSE', 'CONVERTED_TO_CLIENT', 'CLOSED', 'SPAM']),
});

export const publicEnquiriesRouter = Router();
export const adminEnquiriesRouter = Router();

publicEnquiriesRouter.post('/enquiries', async (req, res) => {
  const parsed = publicEnquirySchema.safeParse(req.body ?? {});

  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      message: 'Please provide a valid name, email and message.',
      issues: parsed.error.flatten(),
    });
    return;
  }

  const { name, email, message, preferredContactMethod } = parsed.data;

  const enquiry = await prisma.enquiry.create({
    data: {
      name,
      email,
      message: message ?? null,
      preferredContactMethod: preferredContactMethod ?? undefined,
    },
  });

  res.status(201).json({
    ok: true,
    enquiry,
  });
});

adminEnquiriesRouter.get('/me', requireAdmin, (req, res) => {
  res.json({
    ok: true,
    user: req.admin,
  });
});

adminEnquiriesRouter.get('/dashboard', requireAdmin, async (_req, res) => {
  const [openEnquiries, upcomingSessions, alertCount] = await Promise.all([
    prisma.enquiry.count({ where: { status: { in: ['NEW', 'CONTACTED', 'AWAITING_RESPONSE'] } } }),
    prisma.booking.count({ where: { startsAt: { gte: new Date() }, status: { in: ['PENDING', 'CONFIRMED'] } } }),
    prisma.enquiry.count({ where: { status: 'AWAITING_RESPONSE' } }),
  ]);

  res.json({
    ok: true,
    stats: {
      openEnquiries,
      upcomingSessions,
      alerts: alertCount,
    },
  });
});

adminEnquiriesRouter.get('/enquiries', requireAdmin, async (_req, res) => {
  const enquiries = await prisma.enquiry.findMany({
    orderBy: { receivedAt: 'desc' },
    include: {
      bookings: {
        orderBy: { startsAt: 'asc' },
      },
    },
  });

  res.json({
    ok: true,
    enquiries,
  });
});

adminEnquiriesRouter.patch('/enquiries/:id/status', requireAdmin, async (req, res) => {
  const enquiryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = updateStatusSchema.safeParse(req.body ?? {});

  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      message: 'A valid enquiry status is required.',
      issues: parsed.error.flatten(),
    });
    return;
  }

  const enquiry = await prisma.enquiry.update({
    where: { id: enquiryId },
    data: { status: parsed.data.status },
  });

  res.json({
    ok: true,
    enquiry,
  });
});
