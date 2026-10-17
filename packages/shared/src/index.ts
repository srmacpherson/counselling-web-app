import { z } from 'zod';

export const enquiryStatusSchema = z.enum([
  'NEW',
  'CONTACTED',
  'AWAITING_RESPONSE',
  'CONVERTED_TO_CLIENT',
  'CLOSED',
  'SPAM',
]);

export const contactFormSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  message: z.string().trim().max(2000).optional().or(z.literal('')),
  preferredContactMethod: z.enum(['email', 'phone']).optional(),
});

export type EnquiryStatus = z.infer<typeof enquiryStatusSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
