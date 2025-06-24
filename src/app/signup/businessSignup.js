import { supabase } from '../../supabaseClient';

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
  const { error: businessError } = await supabase.from('business').insert([
    {
      business_name: businessName,
      business_email: email,
      user_id: userId,
    },
  ]);
  if (businessError) {
    return { success: false, error: businessError.message };
  }
  return { success: true };
} 