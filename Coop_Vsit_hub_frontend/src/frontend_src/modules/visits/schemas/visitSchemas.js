import { z } from 'zod';

/**
 * Zod validation schema for Visit Status transitions (approvals, reviews, cancellations).
 */
export const statusTransitionSchema = z.object({
  targetStatus: z.enum([
    'APPROVED',
    'REJECTED',
    'UNDER_REVIEW',
    'CANCELLED',
    'IN_PROGRESS',
    'COMPLETED',
  ]),
  decisionNotes: z.string().trim().min(3, 'Feedback decision notes are required'),
  assignedRoom: z.string().optional(),
});

export const visitStatusTransitionSchema = statusTransitionSchema;
