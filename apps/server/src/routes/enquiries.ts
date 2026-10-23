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

const bookingSchema = z.object({
  clientId: z.string().min(1),
  enquiryId: z.string().min(1).optional().nullable(),
  startsAt: z.string().trim().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'Start time must be a valid date.',
  }),
  endsAt: z.string().trim().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'End time must be a valid date.',
  }),
  timezone: z.string().trim().min(1).default('Europe/London'),
  status: z.enum(['PENDING', 'CONFIRMED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']).default('PENDING'),
  location: z.string().trim().max(200).optional().nullable().transform((value) => value || null),
  notes: z.string().trim().max(2000).optional().nullable().transform((value) => value || null),
});

function splitFullName(fullName: string): { firstName: string; lastName: string | null } {
  const trimmedName = fullName.trim();

  if (!trimmedName) {
    return { firstName: 'Client', lastName: null };
  }

  const parts = trimmedName.split(/\s+/);
  const firstName = parts.shift() ?? 'Client';
  const lastName = parts.length > 0 ? parts.join(' ') : null;

  return { firstName, lastName };
}

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

adminEnquiriesRouter.get('/clients', requireAdmin, async (_req, res) => {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      bookings: {
        orderBy: { startsAt: 'asc' },
      },
    },
  });

  res.json({
    ok: true,
    clients,
  });
});

adminEnquiriesRouter.post('/enquiries/:id/convert-to-client', requireAdmin, async (req, res) => {
  const enquiryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const enquiry = await prisma.enquiry.findUnique({ where: { id: enquiryId } });

  if (!enquiry) {
    res.status(404).json({
      ok: false,
      message: 'Enquiry not found.',
    });
    return;
  }

  const { firstName, lastName } = splitFullName(enquiry.name);
  const existingClient = await prisma.client.findFirst({
    where: {
      email: enquiry.email,
    },
  });

  const client = existingClient
    ? await prisma.client.update({
        where: { id: existingClient.id },
        data: {
          firstName: existingClient.firstName || firstName,
          lastName: existingClient.lastName ?? lastName,
          email: existingClient.email ?? enquiry.email,
          preferredContactMethod: enquiry.preferredContactMethod ?? existingClient.preferredContactMethod,
        },
      })
    : await prisma.client.create({
        data: {
          firstName,
          lastName,
          email: enquiry.email,
          preferredContactMethod: enquiry.preferredContactMethod ?? undefined,
          notes: `Converted from enquiry received ${new Date(enquiry.receivedAt).toISOString()}`,
        },
      });

  const updatedEnquiry = await prisma.enquiry.update({
    where: { id: enquiry.id },
    data: {
      clientId: client.id,
      status: 'CONVERTED_TO_CLIENT',
    },
  });

  res.json({
    ok: true,
    client,
    enquiry: updatedEnquiry,
  });
});

adminEnquiriesRouter.get('/bookings', requireAdmin, async (_req, res) => {
  const bookings = await prisma.booking.findMany({
    orderBy: { startsAt: 'asc' },
    include: {
      client: true,
      enquiry: true,
    },
  });

  res.json({
    ok: true,
    bookings,
  });
});

adminEnquiriesRouter.post('/bookings', requireAdmin, async (req, res) => {
  const parsed = bookingSchema.safeParse(req.body ?? {});

  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      message: 'Please provide a valid booking.',
      issues: parsed.error.flatten(),
    });
    return;
  }

  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = new Date(parsed.data.endsAt);

  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    res.status(400).json({
      ok: false,
      message: 'The booking start and end times must be valid and the end time must be later than the start time.',
    });
    return;
  }

  const client = await prisma.client.findUnique({ where: { id: parsed.data.clientId } });

  if (!client) {
    res.status(404).json({
      ok: false,
      message: 'Client not found.',
    });
    return;
  }

  const booking = await prisma.booking.create({
    data: {
      clientId: client.id,
      enquiryId: parsed.data.enquiryId ?? null,
      startsAt,
      endsAt,
      timezone: parsed.data.timezone,
      status: parsed.data.status,
      location: parsed.data.location,
      notes: parsed.data.notes,
    },
    include: {
      client: true,
      enquiry: true,
    },
  });

  res.status(201).json({
    ok: true,
    booking,
  });
});
