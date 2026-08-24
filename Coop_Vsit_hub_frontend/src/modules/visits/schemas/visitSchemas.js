import { z } from 'zod';

export const createVisitSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Visit title must be at least 3 characters')
      .max(200, 'Visit title is too long'),
    requestingDepartment: z
      .string()
      .trim()
      .min(1, 'Requesting department is required'),
    visitType: z.enum(['EXTERNAL', 'INTERNAL', 'VIP_DELEGATION']),
    priorityLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    guestCategory: z.enum(['ORGANIZATION', 'INDIVIDUAL']),

    // Organization or Individual Guest ID
    guestOrganizationId: z.string().optional().nullable(),
    individualGuestId: z.string().optional().nullable(),

    // Inline Individual Guest Details (if creating on the fly)
    individualGuestFirstName: z.string().optional(),
    individualGuestMiddleName: z.string().optional(),
    individualGuestLastName: z.string().optional(),
    individualGuestEmail: z.string().optional(),
    individualGuestPhone: z.string().optional(),
    individualGuestTitle: z.string().optional(),
    individualGuestIdNumber: z.string().optional(),

    locationRoom: z
      .string()
      .trim()
      .min(1, 'Location meeting room is required'),
    visitorCount: z
      .number({ invalid_type_error: 'Visitor count must be a number' })
      .min(1, 'Must have at least 1 visitor')
      .default(1),

    scheduledStartTime: z
      .string()
      .min(1, 'Start date and time are required'),
    scheduledEndTime: z
      .string()
      .min(1, 'End date and time are required'),

    visitObjective: z
      .string()
      .trim()
      .min(5, 'Visit objective must be at least 5 characters'),
    expectedOutcome: z.string().optional(),
    presentationTheme: z.string().optional(),
    sensitiveTopics: z.string().optional(),
    opportunityValue: z.number().min(0).optional().nullable(),
    currency: z.string().default('USD'),

    isDraft: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.scheduledStartTime && data.scheduledEndTime) {
        return new Date(data.scheduledEndTime) > new Date(data.scheduledStartTime);
      }
      return true;
    },
    {
      message: 'End time must be later than start time',
      path: ['scheduledEndTime'],
    }
  );

export const statusTransitionSchema = z.object({
  targetStatus: z.enum(['APPROVED', 'REJECTED', 'UNDER_REVIEW', 'CANCELLED']),
  approverComments: z
    .string()
    .trim()
    .min(3, 'Approver decision notes or feedback are mandatory'),
});

export const checkInSchema = z.object({
  customBadgeNumber: z.string().optional(),
  verifiedIdNumber: z.string().optional(),
  visitorCount: z.number().min(1).optional(),
  notes: z.string().optional(),
});

export const checkOutSchema = z.object({
  departureNotes: z.string().optional(),
});
