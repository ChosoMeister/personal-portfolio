import { z } from 'zod';

export const usernameSchema = z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'نام کاربری فقط شامل حروف، اعداد و _ باشد');
export const passwordSchema = z.string().min(6).max(100);

export const loginSchema = z.object({
    username: usernameSchema,
    password: passwordSchema
});

export const registerSchema = z.object({
    username: usernameSchema,
    password: passwordSchema,
    displayName: z.string().max(100).optional(),
    securityQuestion: z.string().min(5).max(200),
    securityAnswer: z.string().min(2).max(100)
});

export const resetPasswordSchema = z.object({
    username: usernameSchema,
    securityAnswer: z.string().min(2).max(100),
    newPassword: passwordSchema
});
