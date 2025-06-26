import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, emp_id } = body;

    if (!email || !emp_id) {
      return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get employee data
    const { data: employeeData, error: employeeError } = await supabase
      .from('employee')
      .select(`
        *,
        business(business_name)
      `)
      .eq('emp_id', emp_id)
      .single();

    if (employeeError) {
      return NextResponse.json({ success: false, error: 'Employee not found.' }, { status: 404 });
    }

    // Generate temp password
    const dobDigits = employeeData.dob.replace(/\D/g, '');
    const tempPassword = `${dobDigits.slice(2, 4)}${dobDigits.slice(0, 2)}${dobDigits.slice(4, 6)}${employeeData.last4ssn}`;

    // Resend invitation email
    const { data: user, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        first_name: employeeData.first_name,
        last_name: employeeData.last_name,
        dob: employeeData.dob,
        emp_id: employeeData.emp_id,
        business_id: employeeData.business_id,
        role_id: employeeData.role_id,
        last4ssn: employeeData.last4ssn,
        employmentType: employeeData.full_time ? 'Full-Time' : 'Part-Time',
        business_name: employeeData.business?.business_name || 'ShiftSync',
        temp_password: tempPassword,
      }
    });

    if (inviteError) {
      return NextResponse.json({ success: false, error: inviteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Invitation email sent successfully.' });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to resend invitation.' }, { status: 500 });
  }
} 