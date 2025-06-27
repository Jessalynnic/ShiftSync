import { supabase } from '../../supabaseClient';
import generateUniqueEmpId from '../business-dashboard/generateUniqueEmpId';

export async function businessSignup({ email, password, businessName }) {

  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    return { success: false, error: signUpError.message };
  }

  const userId = data?.user?.id;
  
  // Insert business into business table
  const { data: businessData, error: businessError } = await supabase.from('business').insert([
    {
      business_name: businessName,
      business_email: email,
      user_id: userId,
    },
  ]).select().single();

  if (businessError) {
    return { success: false, error: businessError.message };
  }

  // Generate unique employee ID for business owner
  const emp_id = await generateUniqueEmpId();

  // Create business owner employee record
  const { error: employeeError } = await supabase.from('employee').insert([
    {
      emp_id,
      user_id: userId,
      business_id: businessData.business_id,
      role_id: 1, // Business Owner role
      first_name: 'Business', // Placeholder - they can update this later
      last_name: 'Owner',
      email_address: email,
      last4ssn: 'XXXX', // Placeholder - they can update this later
      dob: '1900-01-01', // Placeholder - they can update this later
      is_active: true,
      full_time: true,
      password_changed: true, // Mark as changed since they set their own password
      password_changed_at: new Date().toISOString()
    },
  ]);

  if (employeeError) {
    return { success: false, error: employeeError.message };
  }

  return { success: true };
} 