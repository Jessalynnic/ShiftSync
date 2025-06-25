import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import generateUniqueEmpId from '../../business-dashboard/generateUniqueEmpId';

export async function POST(request) {
  try {
    const body = await request.json();
    const { firstName, lastName, dob, email, ssn, role, employmentType, businessId } = body;

    // Validate required fields
    if (!firstName || !lastName || !dob || !email || !ssn || !role || !employmentType || !businessId) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Generate unique emp_id
    const emp_id = await generateUniqueEmpId();

    // 2. Generate temp password (MMDD + YY + last4ssn)
    const dobDigits = dob.replace(/\D/g, '');
    const tempPassword = `${dobDigits.slice(2, 4)}${dobDigits.slice(0, 2)}${dobDigits.slice(4, 6)}${ssn}`;

    // 3. Fetch business name
    const { data: businessData } = await supabase
      .from('business')
      .select('business_name')
      .eq('business_id', businessId)
      .single();
    const business_name = businessData?.business_name || 'ShiftSync';

    // 4. Create user in Supabase Auth (admin) with all metadata
    const { data: user, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: false,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        dob,
        emp_id,
        business_id: businessId,
        role_id: role,
        last4ssn: ssn,
        employmentType,
        business_name,
        temp_password: tempPassword,
      }
    });
    if (signUpError) throw new Error(signUpError.message);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to add employee.' }, { status: 500 });
  }
} 