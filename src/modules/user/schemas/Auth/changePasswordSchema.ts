import { z } from 'zod';

export const changePasswordSchema = z
    .object({
        password: z
            .string()
            .min(8, 'At least 8 characters')
            .regex(/[A-Z]/, 'At least 1 uppercase')
            .regex(/[0-9]/, 'At least 1 number'),
        confirmPassword: z.string()
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword']
    });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
