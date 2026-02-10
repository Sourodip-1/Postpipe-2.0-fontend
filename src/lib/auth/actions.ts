'use server';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import dbConnect from './mongodb';
import User from './User';
import { SignupSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema, UpdateProfileSchema } from './schemas';
import { sendVerificationEmail, sendPasswordResetEmail } from './email';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthState {
    success: boolean;
    message: string;
    errors?: Record<string, string[]>;
}

export async function signup(prevState: any, formData: FormData): Promise<AuthState> {
    const rawData = Object.fromEntries(formData.entries());
    const validated = SignupSchema.safeParse(rawData);

    if (!validated.success) {
        return { success: false, message: 'Validation failed', errors: validated.error.flatten().fieldErrors };
    }

    const { name, email, password } = validated.data;

    try {
        await dbConnect();

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return { success: false, message: 'User already exists' };
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verifyToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '24h' });
        const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            verifyToken,
            verifyTokenExpiry,
        });

        await newUser.save();
        await sendVerificationEmail(email, verifyToken);

        // Set client-readable cookie for AuthProvider (optional for signup, but good if auto-login logic exists. 
        // Actually, signup usually requires verification first, so maybe NO cookie yet? 
        // The implementation says "User created. Please check your email". So NO LOGIN on signup. 
        // I will NOT add cookie here, as user is NOT logged in until verification.)
        // formatting consistency only.
        return { success: true, message: 'User created. Please check your email to verify your account.' };
    } catch (error) {
        console.error('Signup error:', error);
        return { success: false, message: 'Internal server error' };
    }
}

export async function login(prevState: any, formData: FormData): Promise<AuthState> {
    const rawData = Object.fromEntries(formData.entries());
    const validated = LoginSchema.safeParse(rawData);

    if (!validated.success) {
        return { success: false, message: 'Validation failed', errors: validated.error.flatten().fieldErrors };
    }

    const { email, password } = validated.data;

    try {
        await dbConnect();

        const user = await User.findOne({ email });
        if (!user) {
            return { success: false, message: 'Invalid credentials' };
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return { success: false, message: 'Invalid credentials' };
        }

        if (!user.isVerified) {
            return { success: false, message: 'Please verify your email first' };
        }

        const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

        (await cookies()).set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
        });

        // Set client-readable cookie for AuthProvider
        (await cookies()).set('postpipe_auth', encodeURIComponent(user.email), {
            httpOnly: false, // Explicitly false so client can read it
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
        });

        return { success: true, message: 'Logged in successfully' };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Internal server error' };
    }
}

export async function logout(prevState: any, formData: FormData): Promise<AuthState> {
    (await cookies()).delete('token');
    (await cookies()).delete('postpipe_auth');
    return { success: true, message: 'Logged out successfully' };
}

export async function signOut() {
    'use server';
    (await cookies()).delete('token');
    (await cookies()).delete('postpipe_auth');
}

export async function forgotPassword(prevState: any, formData: FormData): Promise<AuthState> {
    const rawData = Object.fromEntries(formData.entries());
    const validated = ForgotPasswordSchema.safeParse(rawData);

    if (!validated.success) {
        return { success: false, message: 'Validation failed', errors: validated.error.flatten().fieldErrors };
    }

    const { email } = validated.data;

    try {
        await dbConnect();

        const user = await User.findOne({ email });
        if (!user) {
            return { success: true, message: 'If an account exists, a reset link has been sent.' };
        }

        const forgotPasswordToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
        const forgotPasswordTokenExpiry = new Date(Date.now() + 3600000);

        user.forgotPasswordToken = forgotPasswordToken;
        user.forgotPasswordTokenExpiry = forgotPasswordTokenExpiry;
        await user.save();

        await sendPasswordResetEmail(email, forgotPasswordToken);

        return { success: true, message: 'If an account exists, a reset link has been sent.' };
    } catch (error) {
        console.error('Forgot Password error:', error);
        return { success: false, message: 'Internal server error' };
    }
}

export async function resetPassword(prevState: any, formData: FormData): Promise<AuthState> {
    const rawData = Object.fromEntries(formData.entries());
    const validated = ResetPasswordSchema.safeParse(rawData);

    if (!validated.success) {
        return { success: false, message: 'Validation failed', errors: validated.error.flatten().fieldErrors };
    }

    const { token, password } = validated.data;

    try {
        await dbConnect();

        const user = await User.findOne({
            forgotPasswordToken: token,
            forgotPasswordTokenExpiry: { $gt: Date.now() },
        });

        if (!user) {
            return { success: false, message: 'Invalid or expired token' };
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.forgotPasswordToken = undefined;
        user.forgotPasswordTokenExpiry = undefined;
        await user.save();

        return { success: true, message: 'Password reset successfully. You can now login.' };
    } catch (error) {
        console.error('Reset Password error:', error);
        return { success: false, message: 'Internal server error' };
    }
}

export async function verifyEmail(token: string) {
    if (!token) {
        return { success: false, message: "Token is required" };
    }

    try {
        await dbConnect();

        const user = await User.findOne({
            verifyToken: token,
            verifyTokenExpiry: { $gt: Date.now() },
        });

        if (!user) {
            return { success: false, message: 'Invalid or expired token' };
        }

        user.isVerified = true;
        user.verifyToken = undefined;
        user.verifyTokenExpiry = undefined;
        await user.save();

        return { success: true, message: 'Email verified successfully. You can now login.' };

    } catch (error) {
        console.error("Verify Email error:", error);
        return { success: false, message: "Internal server error" };
    }
}

export async function resendVerification(prevState: any, formData: FormData): Promise<AuthState> {
    const rawData = Object.fromEntries(formData.entries());
    const email = rawData.email as string;

    if (!email) {
        return { success: false, message: 'Email is required' };
    }

    try {
        await dbConnect();

        const user = await User.findOne({ email });
        if (!user) {
            return { success: false, message: 'User not found' };
        }

        if (user.isVerified) {
            return { success: false, message: 'Email already verified' };
        }

        const verifyToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '24h' });
        const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        user.verifyToken = verifyToken;
        user.verifyTokenExpiry = verifyTokenExpiry;
        await user.save();

        await sendVerificationEmail(email, verifyToken);

        return { success: true, message: 'Verification email sent' };
    } catch (error) {
        console.error('Resend Verification error:', error);
        return { success: false, message: 'Internal server error' };
    }
}

export async function getSession() {
    const token = (await cookies()).get('token')?.value;

    if (!token) {
        return null;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        return {
            userId: decoded.userId,
            email: decoded.email,
            exp: decoded.exp
        };
    } catch (error) {
        return null;
    }
}

export async function updateProfile(prevState: any, formData: FormData): Promise<AuthState> {
    const rawData = Object.fromEntries(formData.entries());
    const validated = UpdateProfileSchema.safeParse(rawData);

    if (!validated.success) {
        return { success: false, message: 'Validation failed', errors: validated.error.flatten().fieldErrors };
    }

    const { name, image } = validated.data;

    try {
        const session = await getSession();
        if (!session) {
            return { success: false, message: 'Unauthorized' };
        }

        await dbConnect();

        const updateData: any = { name };
        if (image) {
            updateData.image = image;
        }

        const user = await User.findByIdAndUpdate(
            session.userId,
            updateData,
            { new: true }
        );

        if (!user) {
            return { success: false, message: 'User not found' };
        }

        return { success: true, message: 'Profile updated successfully' };

    } catch (error) {
        console.error('Update Profile error:', error);
        return { success: false, message: 'Internal server error' };
    }
}
