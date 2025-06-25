import { supabase } from '../../supabaseClient';

export async function getBusinessRoles(businessId, isManager = null) {
  try {
    let query = supabase
      .from('roles')
      .select('role_id, role_name, is_manager')
      .or(`business_id.eq.${businessId},business_id.is.null`);

    if (isManager !== null) {
      query = query.eq('is_manager', isManager);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching roles:', error.message);
      throw error;
    }

    return data;
  } catch (err) {
    console.error('Unexpected error fetching roles:', err);
    throw err;
  }
}

export async function getBusinessIdForCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('business')
    .select('business_id')
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching business:', error.message);
    return null;
  }

  return data?.business_id || null;
} 