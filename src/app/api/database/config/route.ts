import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/actions';
import { getUserDatabaseConfig, saveUserDatabaseConfig } from '@/lib/server-db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const config = await getUserDatabaseConfig(session.userId);

    if (!config) {
      // Return default empty config if not found
      return NextResponse.json({
        databases: {
          default: { uri: "", dbName: "postpipe" }
        },
        rules: [],
        defaultTarget: "default"
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Failed to read config:', error);
    return NextResponse.json({ error: 'Failed to read config' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await saveUserDatabaseConfig(session.userId, body);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save config:', error);
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
}
