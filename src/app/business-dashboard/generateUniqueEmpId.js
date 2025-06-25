import { supabase } from '../../supabaseClient';

export default async function generateUniqueEmpId() {
  let isUnique = false;
  let emp_id;

  while (!isUnique) {
    // Generate a random 7-digit number (1000000 to 9999999)
    emp_id = Math.floor(1000000 + Math.random() * 9000000);

    // Check if emp_id already exists
    const { data, error } = await supabase
      .from('employee')
      .select('emp_id')
      .eq('emp_id', emp_id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // Not found error is expected if the ID is unique
      throw error;
    }

    if (!data) {
      isUnique = true;
    }
  }

  return emp_id;
} 