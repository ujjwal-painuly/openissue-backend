import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(60),
    email: z.string().trim().email().max(120),
    password: z.string().min(8).max(72).refine(
      (value) => Buffer.byteLength(value, 'utf8') <= 72,
      'Password must be at most 72 bytes when UTF-8 encoded'
    )
  }),
  params: z.object({}),
  query: z.object({})
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email().max(120),
    password: z.string().min(1).max(72)
  }),
  params: z.object({}),
  query: z.object({})
});
