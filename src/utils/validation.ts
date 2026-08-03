import { z } from 'zod';

export const emailSchema = z.string().trim().email('Enter a valid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Include at least one uppercase letter')
  .regex(/[a-z]/, 'Include at least one lowercase letter')
  .regex(/[0-9]/, 'Include at least one number');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Enter your full name'),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const workspaceSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
  description: z.string().max(280).optional(),
});

export const projectSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
  description: z.string().max(280).optional(),
  workspaceId: z.string().uuid('Select a workspace'),
});

export const inviteMembersSchema = z.object({
  emails: z.string().trim().min(1, 'Enter at least one email'),
  role: z.enum(['editor', 'viewer']),
});

export const shareLinkSchema = z.object({
  customSlug: z.string().trim().max(64).optional(),
  password: z.string().max(64).optional(),
  expiresInDays: z.number().int().min(0).max(365).optional(),
  maxDownloads: z.number().int().min(0).optional(),
  requireLogin: z.boolean(),
  permission: z.enum(['view', 'download']),
});

export const permissionRequestSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const createFolderSchema = z.object({
  name: z.string().trim().min(1, 'Folder name is required').max(100),
});

export const renameSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(150),
});
