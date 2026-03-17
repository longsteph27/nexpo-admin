import { NextRequest, NextResponse } from 'next/server';
import { directusHelpers } from '@/lib/directus';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; registrationId: string }> }
) {
  try {
    const { registrationId } = await params;

    // Get registration details
    const registrationResult = await directusHelpers.getRegistrationById(registrationId);
    
    if (!registrationResult.success || !registrationResult.data) {
      return NextResponse.json({
        success: false,
        message: 'Registration not found'
      }, { status: 404 });
    }

    const registration = registrationResult.data;

    // Check if already checked in
    if (registration.checkin_status === true) {
      return NextResponse.json({
        success: false,
        message: 'Registration already checked in'
      }, { status: 400 });
    }

    // Update registration status to checked_in
    const updateResult = await directusHelpers.updateRegistration(registrationId, {
      checkin_status: true,
    });

    if (!updateResult.success) {
      return NextResponse.json({
        success: false,
        message: 'Failed to update registration status'
      }, { status: 500 });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Check-in successful',
      registration: {
        id: registration.id,
        name: registration.full_name,
        email: registration.email,
        status: 'checked_in'
      }
    });

  } catch (error) {
    console.error('Checkin API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
