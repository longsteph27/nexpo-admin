import { NextRequest, NextResponse } from 'next/server';

const SERVICES_URL = process.env.NEXT_PUBLIC_SERVICES_URL ?? 'https://services.nexpo.vn';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const resp = await fetch(`${SERVICES_URL}/generate-email-template`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await resp.json();

    if (!resp.ok) {
      return NextResponse.json(data, { status: resp.status });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
