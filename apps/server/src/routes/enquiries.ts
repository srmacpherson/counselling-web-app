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
  status: z.enum(['NEW', 'AWAITING_RESPONSE', 'CONVERTED_TO_CLIENT', 'CLOSED', 'SPAM']),
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
  status: z.enum(['SCHEDULED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']).default('SCHEDULED'),
  location: z.string().trim().max(200).optional().nullable().transform((value) => value || null),
  notes: z.string().trim().max(2000).optional().nullable().transform((value) => value || null),
});

const bookingUpdateSchema = z.object({
  startsAt: z.string().trim().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'Start time must be a valid date.',
  }).optional(),
  endsAt: z.string().trim().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'End time must be a valid date.',
  }).optional(),
  timezone: z.string().trim().min(1).optional(),
  status: z.enum(['SCHEDULED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']).optional(),
  location: z.string().trim().max(200).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
});

async function createAuditEvent(input: {
  entityType: 'ADMIN_USER' | 'ENQUIRY' | 'CLIENT' | 'BOOKING';
  entityId: string;
  action: string;
  details?: string | null;
  adminUserId?: string | null;
  enquiryId?: string | null;
  clientId?: string | null;
  bookingId?: string | null;
}) {
  await prisma.auditEvent.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      details: input.details ?? null,
      adminUserId: input.adminUserId ?? null,
      enquiryId: input.enquiryId ?? null,
      clientId: input.clientId ?? null,
      bookingId: input.bookingId ?? null,
    },
  });
}

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
  const [openEnquiries, upcomingSessions] = await Promise.all([
    prisma.enquiry.count({ where: { status: { in: ['NEW', 'AWAITING_RESPONSE'] } } }),
    prisma.booking.count({ where: { startsAt: { gte: new Date() }, status: 'SCHEDULED' } }),
  ]);

  res.json({
    ok: true,
    stats: {
      openEnquiries,
      upcomingSessions,
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

  await createAuditEvent({
    entityType: 'ENQUIRY',
    entityId: enquiry.id,
    action: 'STATUS_UPDATED',
    details: `Status updated to ${parsed.data.status}`,
    adminUserId: req.admin?.id ?? null,
    enquiryId: enquiry.id,
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

adminEnquiriesRouter.get('/clients/:id', requireAdmin, async (req, res) => {
  const clientId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      bookings: {
        orderBy: { startsAt: 'asc' },
        include: {
          enquiry: true,
        },
      },
    },
  });

  if (!client) {
    res.status(404).json({
      ok: false,
      message: 'Client not found.',
    });
    return;
  }

  res.json({
    ok: true,
    client,
  });
});

adminEnquiriesRouter.delete('/clients/:id', requireAdmin, async (req, res) => {
  const clientId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const existingClient = await prisma.client.findUnique({
    where: { id: clientId },
  });

  if (!existingClient) {
    res.status(404).json({
      ok: false,
      message: 'Client not found.',
    });
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.deleteMany({
      where: { clientId },
    });

    await tx.enquiry.updateMany({
      where: { clientId },
      data: { clientId: null },
    });

    await tx.auditEvent.create({
      data: {
        entityType: 'CLIENT',
        entityId: clientId,
        action: 'CLIENT_DELETED',
        details: `Deleted client ${existingClient.firstName} ${existingClient.lastName ?? ''}`.trim(),
        adminUserId: req.admin?.id ?? null,
        clientId,
      },
    });

    await tx.client.delete({
      where: { id: clientId },
    });
  });

  res.json({
    ok: true,
    deletedClientId: clientId,
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

  await createAuditEvent({
    entityType: 'CLIENT',
    entityId: client.id,
    action: 'CLIENT_CREATED_FROM_ENQUIRY',
    details: `Converted from enquiry ${enquiry.id}`,
    adminUserId: req.admin?.id ?? null,
    enquiryId: enquiry.id,
    clientId: client.id,
  });

  await createAuditEvent({
    entityType: 'ENQUIRY',
    entityId: enquiry.id,
    action: 'CONVERTED_TO_CLIENT',
    details: `Converted to client ${client.id}`,
    adminUserId: req.admin?.id ?? null,
    enquiryId: enquiry.id,
    clientId: client.id,
  });

  res.json({
    ok: true,
    client,
    enquiry: updatedEnquiry,
  });
});

adminEnquiriesRouter.get('/activity', requireAdmin, async (_req, res) => {
  const [auditEvents, notifications] = await Promise.all([
    prisma.auditEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.emailNotification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        enquiry: true,
        client: true,
      },
    }),
  ]);

  res.json({
    ok: true,
    auditEvents,
    notifications,
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

adminEnquiriesRouter.patch('/bookings/:id', requireAdmin, async (req, res) => {
  const bookingId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = bookingUpdateSchema.safeParse(req.body ?? {});

  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      message: 'Please provide valid booking updates.',
      issues: parsed.error.flatten(),
    });
    return;
  }

  const existingBooking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      client: true,
    },
  });

  if (!existingBooking) {
    res.status(404).json({
      ok: false,
      message: 'Booking not found.',
    });
    return;
  }

  const nextStartsAt = parsed.data.startsAt ? new Date(parsed.data.startsAt) : existingBooking.startsAt;
  const nextEndsAt = parsed.data.endsAt ? new Date(parsed.data.endsAt) : existingBooking.endsAt;

  if (Number.isNaN(nextStartsAt.getTime()) || Number.isNaN(nextEndsAt.getTime()) || nextEndsAt <= nextStartsAt) {
    res.status(400).json({
      ok: false,
      message: 'The booking start and end times must be valid and the end time must be later than the start time.',
    });
    return;
  }

  const nextStatus = parsed.data.status ?? existingBooking.status;
  const didReschedule =
    parsed.data.startsAt !== undefined || parsed.data.endsAt !== undefined || parsed.data.timezone !== undefined;

  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      startsAt: nextStartsAt,
      endsAt: nextEndsAt,
      timezone: parsed.data.timezone ?? existingBooking.timezone,
      status: nextStatus,
      location: parsed.data.location ?? existingBooking.location,
      notes: parsed.data.notes ?? existingBooking.notes,
      cancelledAt: existingBooking.cancelledAt,
    },
    include: {
      client: true,
    },
  });

  await createAuditEvent({
    entityType: 'BOOKING',
    entityId: booking.id,
    action: didReschedule ? 'BOOKING_RESCHEDULED' : 'BOOKING_UPDATED',
    details: didReschedule
      ? `Rescheduled booking for ${existingBooking.client.firstName}`
      : `Updated booking for ${existingBooking.client.firstName}`,
    adminUserId: req.admin?.id ?? null,
    clientId: booking.clientId,
    bookingId: booking.id,
    enquiryId: booking.enquiryId ?? null,
  });

  res.json({
    ok: true,
    booking,
  });
});

adminEnquiriesRouter.post('/bookings/:id/cancel', requireAdmin, async (req, res) => {
  const bookingId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      client: true,
      enquiry: true,
    },
  });

  if (!booking) {
    res.status(404).json({
      ok: false,
      message: 'Booking not found.',
    });
    return;
  }

  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
    },
    include: {
      client: true,
      enquiry: true,
    },
  });

  await createAuditEvent({
    entityType: 'BOOKING',
    entityId: updatedBooking.id,
    action: 'BOOKING_CANCELLED',
    details: `Cancelled booking for ${updatedBooking.client.firstName}`,
    adminUserId: req.admin?.id ?? null,
    clientId: updatedBooking.clientId,
    bookingId: updatedBooking.id,
    enquiryId: updatedBooking.enquiryId ?? null,
  });

  res.json({
    ok: true,
    booking: updatedBooking,
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

  await createAuditEvent({
    entityType: 'BOOKING',
    entityId: booking.id,
    action: 'BOOKING_CREATED',
    details: `Booking scheduled for ${booking.startsAt.toISOString()}`,
    adminUserId: req.admin?.id ?? null,
    clientId: booking.clientId,
    bookingId: booking.id,
    enquiryId: booking.enquiryId ?? null,
  });

  res.status(201).json({
    ok: true,
    booking,
  });
});
