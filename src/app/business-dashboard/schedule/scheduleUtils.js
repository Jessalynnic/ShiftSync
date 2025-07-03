// Utility functions for schedule management

export const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

export const getWeekDates = (date) => {
  const start = getStartOfWeek(date);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const newDate = new Date(start);
    newDate.setDate(start.getDate() + i);
    dates.push(newDate);
  }
  return dates;
};

export const isToday = (date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const formatTime = (time) => {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

export const convertTo24HourFormat = (time12h) => {
  if (!time12h) return "";
  const [time, modifier] = time12h.split(" ");
  let [hours, minutes] = time.split(":");
  hours = parseInt(hours);
  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, "0")}:${minutes}`;
};

export const calculateHoursDifference = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);
  let diff = endHour * 60 + endMin - (startHour * 60 + startMin);
  if (diff < 0) diff += 24 * 60; // Handle overnight shifts
  return Math.round((diff / 60) * 100) / 100;
};

export const getTotalHoursColor = (totalHours, maxHours) => {
  const percentage = (totalHours / maxHours) * 100;
  if (percentage >= 90) return "text-red-600";
  if (percentage >= 75) return "text-yellow-600";
  return "text-green-600";
};

export const checkAvailabilityConflict = (employee, shiftTime, dayOfWeek) => {
  if (!employee.availability || employee.availability.length === 0) {
    return { hasConflict: false, message: null };
  }

  // Find availability for the specific day
  const dayAvailability = employee.availability.find(
    (avail) => avail.day_of_week === dayOfWeek,
  );

  if (!dayAvailability) {
    return {
      hasConflict: true,
      message: `${employee.first_name} is not available on ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek]}`,
    };
  }

  // Parse shift times
  let shiftStart, shiftEnd;
  if (typeof shiftTime === "string") {
    // Handle "9:00 AM - 5:00 PM" format
    [shiftStart, shiftEnd] = shiftTime.split(" - ").map(convertTo24HourFormat);
  } else if (shiftTime.startTime && shiftTime.endTime) {
    // Handle object format
    shiftStart = shiftTime.startTime;
    shiftEnd = shiftTime.endTime;
  } else {
    return { hasConflict: false, message: null };
  }

  // Parse availability times
  const availStart = dayAvailability.start_time;
  const availEnd = dayAvailability.end_time;

  // Check if shift is within availability window
  const shiftStartMinutes =
    parseInt(shiftStart.split(":")[0]) * 60 +
    parseInt(shiftStart.split(":")[1]);
  let shiftEndMinutes =
    parseInt(shiftEnd.split(":")[0]) * 60 + parseInt(shiftEnd.split(":")[1]);
  const availStartMinutes =
    parseInt(availStart.split(":")[0]) * 60 +
    parseInt(availStart.split(":")[1]);
  let availEndMinutes =
    parseInt(availEnd.split(":")[0]) * 60 + parseInt(availEnd.split(":")[1]);

  // Handle overnight shifts
  if (shiftEndMinutes < shiftStartMinutes) {
    shiftEndMinutes += 24 * 60;
  }
  if (availEndMinutes < availStartMinutes) {
    availEndMinutes += 24 * 60;
  }

  if (
    shiftStartMinutes < availStartMinutes ||
    shiftEndMinutes > availEndMinutes
  ) {
    let overMinutes = 0;
    let message = "";
    if (shiftEndMinutes > availEndMinutes) {
      overMinutes = shiftEndMinutes - availEndMinutes;
      message = `You are scheduling this employee ${overMinutes} minutes over their availability.`;
    } else if (shiftStartMinutes < availStartMinutes) {
      overMinutes = availStartMinutes - shiftStartMinutes;
      message = `You are scheduling this employee ${overMinutes} minutes before their availability starts.`;
    } else {
      message = `${employee.first_name} is only available ${formatTime(availStart)} - ${formatTime(availEnd)} on ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek]}, but you're scheduling them for ${formatTime(shiftStart)} - ${formatTime(shiftEnd)}`;
    }
    return {
      hasConflict: true,
      message,
    };
  }

  return { hasConflict: false, message: null };
};

// Export utility functions
export const exportScheduleToCSV = (employeeAssignments, shiftAssignments, dates, employees) => {
  const csvData = [];
  
  // Add header row
  const header = ['Employee', 'Role', 'Date', 'Day', 'Start Time', 'End Time', 'Hours', 'Shift Title'];
  csvData.push(header.join(','));
  
  // Add data rows
  Object.entries(employeeAssignments).forEach(([cellId, employee]) => {
    const shift = shiftAssignments[cellId];
    if (employee && shift) {
      const [rowIndex, dayKey] = cellId.split('::');
      const date = new Date(dayKey);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      
      let startTime = '', endTime = '', hours = 0;
      if (typeof shift === 'string') {
        [startTime, endTime] = shift.split(' - ');
        hours = calculateHoursDifference(convertTo24HourFormat(startTime), convertTo24HourFormat(endTime));
      } else if (shift.startTime && shift.endTime) {
        startTime = formatTime(shift.startTime);
        endTime = formatTime(shift.endTime);
        hours = calculateHoursDifference(shift.startTime, shift.endTime);
      }
      
      const row = [
        `${employee.first_name} ${employee.last_name}`,
        employee.role_name || 'Unknown Role',
        date.toLocaleDateString('en-US'),
        dayName,
        startTime,
        endTime,
        hours.toFixed(2),
        shift.title || ''
      ];
      csvData.push(row.join(','));
    }
  });
  
  return csvData.join('\n');
};

export const exportScheduleToPDF = async (employeeAssignments, shiftAssignments, dates, employees, businessName = 'Business') => {
  // This would require a PDF library like jsPDF
  // For now, we'll return a placeholder
  return 'PDF export functionality requires jsPDF library';
};

export const downloadCSV = (csvContent, filename) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generateScheduleSummary = (employeeAssignments, shiftAssignments, dates) => {
  const summary = {
    totalShifts: 0,
    totalHours: 0,
    employeeHours: {},
    dayBreakdown: {},
    roleBreakdown: {}
  };
  
  Object.entries(employeeAssignments).forEach(([cellId, employee]) => {
    const shift = shiftAssignments[cellId];
    if (employee && shift) {
      summary.totalShifts++;
      
      let hours = 0;
      if (typeof shift === 'string') {
        const [startTime, endTime] = shift.split(' - ');
        hours = calculateHoursDifference(convertTo24HourFormat(startTime), convertTo24HourFormat(endTime));
      } else if (shift.startTime && shift.endTime) {
        hours = calculateHoursDifference(shift.startTime, shift.endTime);
      }
      
      summary.totalHours += hours;
      
      // Employee hours
      if (!summary.employeeHours[employee.emp_id]) {
        summary.employeeHours[employee.emp_id] = {
          name: `${employee.first_name} ${employee.last_name}`,
          hours: 0,
          shifts: 0
        };
      }
      summary.employeeHours[employee.emp_id].hours += hours;
      summary.employeeHours[employee.emp_id].shifts++;
      
      // Day breakdown
      const [rowIndex, dayKey] = cellId.split('::');
      const date = new Date(dayKey);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      if (!summary.dayBreakdown[dayName]) {
        summary.dayBreakdown[dayName] = { hours: 0, shifts: 0 };
      }
      summary.dayBreakdown[dayName].hours += hours;
      summary.dayBreakdown[dayName].shifts++;
      
      // Role breakdown
      const roleName = employee.role_name || 'Unknown Role';
      if (!summary.roleBreakdown[roleName]) {
        summary.roleBreakdown[roleName] = { hours: 0, shifts: 0 };
      }
      summary.roleBreakdown[roleName].hours += hours;
      summary.roleBreakdown[roleName].shifts++;
    }
  });
  
  return summary;
};
