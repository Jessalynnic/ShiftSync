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

    // Generate unique emp_id
    const emp_id = await generateUniqueEmpId();

    // Generate temp password (MMDD + YY + last4ssn)
    const dobDigits = dob.replace(/\D/g, '');
    const tempPassword = `${dobDigits.slice(2, 4)}${dobDigits.slice(0, 2)}${dobDigits.slice(4, 6)}${ssn}`;

    // Fetch business name
    const { data: businessData } = await supabase
      .from('business')
      .select('business_name')
      .eq('business_id', businessId)
      .single();
    const business_name = businessData?.business_name || 'ShiftSync';

    // Create user in Supabase Auth (admin) with all metadata
    const createUserResponse = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
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
    const { data: user, error: signUpError } = createUserResponse;
    
    if (signUpError) {
      // Check if it's an email invitation error
      if (signUpError.message.includes('invitation') || signUpError.message.includes('email')) {
        console.error('Email invitation error:', signUpError);
        // Still create the employee record, but note the email issue
        console.log('Creating employee record despite email invitation error...');
      } else {
        throw new Error(signUpError.message);
      }
    }

    // Add employee to the employee table
    const { data: employeeData, error: employeeError } = await supabase
      .from('employee')
      .insert({
        emp_id,
        user_id: user?.user?.id || null, // Handle case where user creation failed
        business_id: businessId,
        role_id: role,
        first_name: firstName,
        last_name: lastName,
        email_address: email,
        last4ssn: ssn,
        dob,
        is_active: true,
        full_time: employmentType === 'Full-Time',
      });
    
    if (employeeError) {
      console.error('Error adding employee to table:', employeeError);
      throw new Error(`Failed to add employee to database: ${employeeError.message}`);
    }

    // Log activity: employee added
    try {
      const { data: activityData, error: activityError } = await supabase
        .from('activity_log')
        .insert({
          business_id: businessId,
          user_id: null,
          type: 'add',
          description: `Added new employee: ${firstName} ${lastName} (${emp_id})`,
          employee_id: emp_id,
          metadata: { 
            action: 'employee_created',
            employment_type: employmentType,
            role_id: role
          }
        })
        .select();

      if (activityError) {
        console.error('Activity logging error:', activityError);
      }
    } catch (err) {
      // Log but don't block the response
      console.error('Failed to log activity:', err);
    }

    // If there was an email invitation error, return a warning but still success
    if (signUpError) {
      return NextResponse.json({ 
        success: true, 
        warning: 'Employee added successfully, but email invitation failed. You may need to resend the invitation.',
        emp_id,
        needsEmailResend: true
      });
    }

    return NextResponse.json({ success: true, emp_id });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to add employee.' }, { status: 500 });
  }
} 