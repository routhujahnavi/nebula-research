import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const hasOpenaiKey = Boolean(process.env.OPENAI_API_KEY);
  return NextResponse.json({ hasOpenaiKey });
}
