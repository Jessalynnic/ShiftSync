import { supabase } from '../../supabaseClient';
import generateUniqueEmpId from './generateUniqueEmpId';

export async function addEmployee({ firstName, lastName, dob, email, ssn, role, employmentType, businessId }) {
  try {
    const response = await fetch('/api/add-employee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName,
        lastName,
        dob,
        email,
        ssn,
        role,
        employmentType,
        businessId,
      }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to add employee.');
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || 'Failed to add employee.' };
  }
} 