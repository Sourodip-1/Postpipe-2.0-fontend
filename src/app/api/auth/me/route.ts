import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/actions';
import dbConnect from '@/lib/auth/mongodb';
import User from '@/lib/auth/User';

export async function GET() {
    try {
        const session = await getSession();
        
        if (!session) {
            return NextResponse.json({ user: null }, { status: 401 });
        }

        await dbConnect();
        const user = await User.findById(session.userId).select('-password -__v');

        if (!user) {
            return NextResponse.json({ user: null }, { status: 404 });
        }

        return NextResponse.json({ 
            user: {
                name: user.name,
                email: user.email,
                image: user.image,
                // Add any other fields you want to expose to the frontend context
            }
        });

    } catch (error) {
        console.error('API /auth/me Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
