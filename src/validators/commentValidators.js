import { z } from 'zod';

export const createCommentSchema = z.object({
  body: z.object({ body: z.string().trim().min(1).max(4000) }),
  params: z.object({ issueId: z.string().regex(/^[a-f\d]{24}$/i) }),
  query: z.object({})
});

export const commentIdSchema = z.object({
  body: z.object({}),
  params: z.object({ issueId: z.string().regex(/^[a-f\d]{24}$/i), commentId: z.string().regex(/^[a-f\d]{24}$/i) }),
  query: z.object({})
});

export const updateCommentSchema = z.object({
  body: z.object({ body: z.string().trim().min(1).max(4000) }),
  params: z.object({ issueId: z.string().regex(/^[a-f\d]{24}$/i), commentId: z.string().regex(/^[a-f\d]{24}$/i) }),
  query: z.object({})
});
