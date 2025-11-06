import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'ANALYST', 'USER']).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  mfaCode: z.string().optional(),
  fingerprint: z.string().optional(),
});

export const MfaEnableSchema = z.object({
  code: z.string().min(6).max(6),
});

