import { NextRequest, NextResponse } from 'next/server';
import { directusHelpers } from '@/lib/directus';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing event id' }, { status: 400 });
  const result = await directusHelpers.getFormByEvent(id);
  if (!result.success || !result.data) return NextResponse.json({}, { status: 200 });
  return NextResponse.json(result.data, { status: 200 });
}


