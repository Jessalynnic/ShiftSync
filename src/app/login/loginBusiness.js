import { supabase } from '../../supabaseClient';

export async function loginBusiness(email, password) {
  // Sign in business with email + password
  const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (loginError) {
    return {
      success: false,
      message: loginError.message
    };
  }

  // Get user ID
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  if (!userId) {
    return {
      success: false,
      message: 'Failed to retrieve user after login'
    };
  }

  // Check if business record exists
  const { data: existingBusiness, error: businessError } = await supabase
    .from('business')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (businessError) {
    return {
      success: false,
      message: businessError.message
    };
  }

  if (!existingBusiness) {
    return {
      success: false,
      message: 'No business record found for this user.'
    };
  }

  return {
    success: true,
    message: 'Login successful',
    business: existingBusiness
  };
} 