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
    // Parse date more explicitly to avoid timezone issues
    const [year, month, day] = dob.split('-').map(Number);
    const tempPassword = `${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}${String(year).slice(-2)}${ssn}`;

    // Fetch business name
    const { data: businessData } = await supabase
      .from('business')
      .select('business_name')
      .eq('business_id', businessId)
      .single();
    const business_name = businessData?.business_name || 'ShiftSync';

    // Create user in Supabase Auth with all metadata and set password
    const { data: user, error: signUpError } = await supabase.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm the email
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
        password_changed: false,
        password_changed_at: null
      }
    });
    
    if (signUpError) {
      console.error('Error creating user:', signUpError);
      return NextResponse.json({ 
        success: false, 
        error: signUpError.message 
      }, { status: 500 });
    }

    // Add employee to the employee table
    const { data: employeeData, error: employeeError } = await supabase
      .from('employee')
      .insert({
        emp_id,
        user_id: user?.user?.id,
        business_id: businessId,
        role_id: role,
        first_name: firstName,
        last_name: lastName,
        email_address: email,
        last4ssn: ssn,
        dob,
        is_active: true,
        full_time: employmentType === 'Full-Time',
        password_changed: false,
        password_changed_at: null
      });
    
    if (employeeError) {
      console.error('Error adding employee to table:', employeeError);
      return NextResponse.json({ 
        success: false, 
        error: `Failed to add employee to database: ${employeeError.message}` 
      }, { status: 500 });
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
            role_id: role,
            default_password_set: !!user?.user?.id
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

    return NextResponse.json({ 
      success: true, 
      emp_id,
      defaultPassword: tempPassword,
      userCreated: !!user?.user?.id
    });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message || 'Failed to add employee.' 
    }, { status: 500 });
  }
} 