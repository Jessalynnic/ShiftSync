import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required.' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get the count of employees for this business
    const { count, error } = await supabase
      .from('employee')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId);

    if (error) {
      console.error('Error fetching employee count:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: count || 0 });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch employee count.' }, { status: 500 });
  }
} 