import { NextResponse } from 'next/server';
import { supabase } from '../../../supabaseClient';

export async function POST(request) {
  try {
    const { businessId, weekStartDate, format = 'csv' } = await request.json();

    if (!businessId || !weekStartDate) {
      return NextResponse.json(
        { error: 'Business ID and week start date are required' },
        { status: 400 }
      );
    }

    // Fetch schedule data
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedule')
      .select('schedule_id')
      .eq('business_id', businessId)
      .eq('week_start_date', weekStartDate)
      .single();

    if (scheduleError || !schedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

    // Fetch all shifts for this schedule
    const { data: shifts, error: shiftsError } = await supabase
      .from('shift')
      .select(`
        shift_id, 
        employee_id, 
        date, 
        start_time, 
        end_time, 
        row_index, 
        title,
        employee:employee_id (
          emp_id, 
          first_name, 
          last_name, 
          role_id, 
          roles(role_name)
        )
      `)
      .eq('schedule_id', schedule.schedule_id);

    if (shiftsError) {
      return NextResponse.json(
        { error: 'Failed to fetch shifts' },
        { status: 500 }
      );
    }

    // Generate CSV content
    if (format === 'csv') {
      const csvData = [];
      
      // Add header row
      const header = ['Employee', 'Role', 'Date', 'Day', 'Start Time', 'End Time', 'Hours', 'Shift Title'];
      csvData.push(header.join(','));
      
      // Add data rows
      shifts.forEach((shift) => {
        const date = new Date(shift.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        
        // Calculate hours
        const startTime = shift.start_time;
        const endTime = shift.end_time;
        const hours = calculateHours(startTime, endTime);
        
        const row = [
          `${shift.employee.first_name} ${shift.employee.last_name}`,
          shift.employee.roles?.role_name || 'Unknown Role',
          date.toLocaleDateString('en-US'),
          dayName,
          formatTime(startTime),
          formatTime(endTime),
          hours.toFixed(2),
          shift.title || ''
        ];
        csvData.push(row.join(','));
      });

      const csvContent = csvData.join('\n');
      
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="schedule_${weekStartDate}.csv"`
        }
      });
    }

    return NextResponse.json(
      { error: 'Unsupported format' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
function formatTime(time) {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

function calculateHours(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  let diff = endHour * 60 + endMin - (startHour * 60 + startMin);
  if (diff < 0) diff += 24 * 60; // Handle overnight shifts
  return Math.round((diff / 60) * 100) / 100;
} 