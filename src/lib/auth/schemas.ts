import { z } from 'zod';

export const SignupSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters long." }),
    email: z.string().email({ message: "Please enter a valid email." }).trim(),
    password: z.string()
        .min(8, { message: "Must be at least 8 characters long, contain a letter, a number, and a special character." })
        .regex(/[a-zA-Z]/, { message: "Must be at least 8 characters long, contain a letter, a number, and a special character." })
        .regex(/[0-9]/, { message: "Must be at least 8 characters long, contain a letter, a number, and a special character." })
        .regex(/[^a-zA-Z0-9]/, { message: "Must be at least 8 characters long, contain a letter, a number, and a special character." })
        .trim(),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
});

export const LoginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const ForgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export const ResetPasswordSchema = z.object({
    token: z.string().min(1, 'Token is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export const VerifyEmailSchema = z.object({
    token: z.string().min(1, 'Token is required'),
});

export const UpdateProfileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    image: z.string().optional(),
});
