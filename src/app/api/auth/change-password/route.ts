import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/auth/mongodb';
import User from '@/lib/auth/User';
import { getSession } from '@/lib/auth/actions';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: NextRequest) {
    try {
        let userId = null;
        
        // 1. Try to get token from Authorization header
        const authHeader = req.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, JWT_SECRET) as any;
                userId = decoded.userId;
            } catch (err) {
                // Ignore invalid
            }
        }

        // 2. Fallback to session cookie
        if (!userId) {
            const session = await getSession();
            if (session) {
                userId = session.userId;
            }
        }

        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await req.json();
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'currentPassword and newPassword are required' }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findById(userId);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (!user.password) {
            return NextResponse.json({ error: 'User does not have a password set (e.g. OAuth user)' }, { status: 400 });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return NextResponse.json({ error: 'Invalid current password' }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        return NextResponse.json({ message: 'Password changed successfully' }, { status: 200 });
    } catch (error) {
        console.error('API /auth/change-password Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
