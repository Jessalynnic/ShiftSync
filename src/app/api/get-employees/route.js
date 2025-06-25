import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required.' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get employees with their auth status
    const { data: employeeData, error: employeeError } = await supabase
      .from('employee')
      .select(`
        emp_id,
        first_name,
        last_name,
        email_address,
        last4ssn,
        dob,
        is_active,
        full_time,
        created_at,
        role_id,
        user_id,
        onboarding_email_sent_at,
        roles(role_name)
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (employeeError) throw employeeError;

    // Get auth user data for email confirmation status
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;

    // Combine the data
    const employeesWithAuth = employeeData.map(emp => {
      const authUser = authData.users.find(user => user.id === emp.user_id);
      return {
        ...emp,
        email_confirmed: authUser?.email_confirmed_at ? true : false,
        onboarding_sent: !!emp.onboarding_email_sent_at
      };
    });

    return NextResponse.json({ success: true, employees: employeesWithAuth });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch employees.' }, { status: 500 });
  }
} 