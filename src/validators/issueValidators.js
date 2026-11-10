import { z } from 'zod';

const issueFields = {
  title: z.string().trim().min(4).max(120),
  body: z.string().trim().max(10000).optional().default(''),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional().default('MEDIUM'),
  labels: z.array(z.string().trim().min(1).max(30)).max(10).optional().default([]),
  assignee: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional()
};

export const createIssueSchema = z.object({
  body: z.object(issueFields),
  params: z.object({ repositoryId: z.string().regex(/^[a-f\d]{24}$/i) }),
  query: z.object({})
});

export const updateIssueSchema = z.object({
  body: z.object({
    title: z.string().trim().min(4).max(120).optional(),
    body: z.string().trim().max(10000).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    labels: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
    assignee: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional(),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional()
  }).refine((value) => Object.keys(value).length > 0, {
    message: 'At least one issue field must be supplied'
  }),
  params: z.object({ issueId: z.string().regex(/^[a-f\d]{24}$/i) }),
  query: z.object({})
});

export const issueIdSchema = z.object({
  body: z.object({}),
  params: z.object({ issueId: z.string().regex(/^[a-f\d]{24}$/i) }),
  query: z.object({})
});

export const listIssuesSchema = z.object({
  body: z.object({}),
  params: z.object({ repositoryId: z.string().regex(/^[a-f\d]{24}$/i) }),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    assignee: z.string().regex(/^[a-f\d]{24}$/i).optional(),
    label: z.string().trim().min(1).max(30).optional(),
    q: z.string().trim().max(100).optional(),
    sort: z.enum(['newest', 'oldest', 'recently-updated']).default('recently-updated')
  })
});
