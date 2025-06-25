import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { first_name, email_address, emp_id, temp_password, business_name } = body;

    if (!first_name || !email_address || !emp_id) {
      return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch the actual business name from the database
    const { data: employeeData, error: employeeError } = await supabase
      .from('employee')
      .select(`
        business_id,
        business(business_name)
      `)
      .eq('emp_id', emp_id)
      .single();

    if (employeeError) {
      console.error('Error fetching employee data:', employeeError);
      return NextResponse.json({ success: false, error: 'Failed to fetch employee data.' }, { status: 500 });
    }

    const actualBusinessName = employeeData.business?.business_name || business_name || 'ShiftSync';

    // Call the Supabase Edge Function
    const res = await fetch(
      `https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF}.functions.supabase.co/send-onboarding-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ 
          first_name, 
          email_address, 
          emp_id, 
          temp_password, 
          business_name: actualBusinessName 
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ success: false, error: data.error || 'Failed to send onboarding email.' }, { status: 500 });
    }

    // Record that the onboarding email was sent
    const { error: updateError } = await supabase
      .from('employee')
      .update({ onboarding_email_sent_at: new Date().toISOString() })
      .eq('emp_id', emp_id);

    if (updateError) {
      console.error('Error updating onboarding email status:', updateError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to send onboarding email.' }, { status: 500 });
  }
} 