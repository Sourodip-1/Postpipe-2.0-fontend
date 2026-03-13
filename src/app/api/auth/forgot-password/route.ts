import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/auth/mongodb';
import User from '@/lib/auth/User';
import { sendPasswordResetEmail } from '@/lib/auth/email';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        await dbConnect();
        
        const user = await User.findOne({ email });
        if (!user) {
            // Do not reveal if email exists or not
            return NextResponse.json({ message: 'If the account exists, a reset email has been sent' }, { status: 200 });
        }

        // Generate secure random reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        
        // Expiry 1 hour
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

        user.resetTokenHash = resetTokenHash;
        user.resetTokenExpiry = resetTokenExpiry;
        await user.save();

        // Send email with reset token
        // Fallback to older mechanism if sendPasswordResetEmail expects specific behaviour
        await sendPasswordResetEmail(email, resetToken);

        return NextResponse.json({ message: 'If the account exists, a reset email has been sent' }, { status: 200 });
    } catch (error) {
        console.error('API /auth/forgot-password Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
