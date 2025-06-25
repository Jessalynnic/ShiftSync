import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    const { first_name, email_address, emp_id, temp_password, business_name } = data;
    
    if (!first_name || !email_address || !emp_id || !temp_password) {
      return NextResponse.json(
        { error: 'Missing required fields: first_name, email_address, emp_id, temp_password' },
        { status: 400 }
      );
    }

    // Call the Supabase Edge Function
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-onboarding-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        first_name,
        email_address,
        emp_id,
        temp_password,
        business_name: business_name || 'ShiftSync'
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Email function error:', result);
      return NextResponse.json(
        { error: result.error || 'Failed to send onboarding email' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data: result.data });

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 