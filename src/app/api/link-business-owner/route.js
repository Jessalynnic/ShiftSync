import { NextResponse } from 'next/server';
import { linkBusinessOwnerToBusiness } from '../../business-dashboard/roleUtils';

export async function POST(request) {
  try {
    const body = await request.json();
    const { employeeId, businessId } = body;

    if (!employeeId || !businessId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Employee ID and Business ID are required.' 
      }, { status: 400 });
    }

    const result = await linkBusinessOwnerToBusiness(employeeId, businessId);

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: result.message 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 400 });
    }

  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message || 'Failed to link business owner.' 
    }, { status: 500 });
  }
} 