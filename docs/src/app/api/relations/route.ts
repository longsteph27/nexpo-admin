import { NextResponse } from 'next/server';
import { getRelations } from '@/services/directus';

export async function GET() {
  try {
    const relations = await getRelations();
    return NextResponse.json(relations);
  } catch (error) {
    console.error('Error fetching relations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch relations' },
      { status: 500 }
    );
  }
} 