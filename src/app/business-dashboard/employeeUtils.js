import { supabase } from '../../supabaseClient';
import generateUniqueEmpId from './generateUniqueEmpId';

export async function addEmployee({ firstName, lastName, dob, email, ssn, role, employmentType, businessId }) {
  try {
    // Convert MM/DD/YYYY to YYYY-MM-DD format
    const convertDateFormat = (dateString) => {
      if (!dateString) return '';
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const [month, day, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      return dateString; // Return as-is if not in expected format
    };

    const response = await fetch('/api/add-employee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName,
        lastName,
        dob: convertDateFormat(dob),
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