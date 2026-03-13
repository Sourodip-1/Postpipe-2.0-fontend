import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dbConnect from '@/lib/auth/mongodb';
import User from '@/lib/auth/User';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { token, newPassword } = body;

        if (!token || !newPassword) {
            return NextResponse.json({ error: 'Token and newPassword are required' }, { status: 400 });
        }

        await dbConnect();

        // Hash incoming token
        const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // Find user with matching resetTokenHash
        const user = await User.findOne({
            resetTokenHash,
            resetTokenExpiry: { $gt: Date.now() },
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        
        // Clear tokens
        user.resetTokenHash = undefined;
        user.resetTokenExpiry = undefined;
        // Optionally clear older forgot password tokens to be safe
        user.forgotPasswordToken = undefined;
        user.forgotPasswordTokenExpiry = undefined;

        await user.save();

        return NextResponse.json({ message: 'Password updated successfully' }, { status: 200 });
    } catch (error) {
        console.error('API /auth/reset-password Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
