import { z } from 'zod';

const repositoryBody = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional().default(''),
  visibility: z.enum(['public', 'private']).optional().default('private')
});

export const createRepositorySchema = z.object({
  body: repositoryBody,
  params: z.object({}),
  query: z.object({})
});

export const updateRepositorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80).optional(),
    description: z.string().trim().max(500).optional(),
    visibility: z.enum(['public', 'private']).optional()
  }).refine((value) => Object.keys(value).length > 0, {
    message: 'At least one repository field must be supplied'
  }),
  params: z.object({ repositoryId: z.string().regex(/^[a-f\d]{24}$/i) }),
  query: z.object({})
});

export const repositoryIdSchema = z.object({
  body: z.object({}),
  params: z.object({ repositoryId: z.string().regex(/^[a-f\d]{24}$/i) }),
  query: z.object({})
});
