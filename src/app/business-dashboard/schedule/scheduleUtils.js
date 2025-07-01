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
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

export const convertTo24HourFormat = (time12h) => {
  if (!time12h) return '';
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  hours = parseInt(hours);
  if (modifier === 'PM' && hours !== 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

export const calculateHoursDifference = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  let diff = (endHour * 60 + endMin) - (startHour * 60 + startMin);
  if (diff < 0) diff += 24 * 60; // Handle overnight shifts
  return Math.round((diff / 60) * 100) / 100;
};

export const getTotalHoursColor = (total, max) => {
  if (total > max) return 'text-red-600';
  if (total > max * 0.9) return 'text-yellow-600';
  return 'text-green-600';
};

export const checkAvailabilityConflict = (employee, shiftTime, dayOfWeek) => {
  if (!employee.availability || employee.availability.length === 0) {
    return { hasConflict: false, message: null };
  }

  // Find availability for the specific day
  const dayAvailability = employee.availability.find(avail => avail.day_of_week === dayOfWeek);
  
  if (!dayAvailability) {
    return { 
      hasConflict: true, 
      message: `${employee.first_name} is not available on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]}` 
    };
  }

  // Parse shift times
  let shiftStart, shiftEnd;
  if (typeof shiftTime === 'string') {
    // Handle "9:00 AM - 5:00 PM" format
    [shiftStart, shiftEnd] = shiftTime.split(' - ').map(convertTo24HourFormat);
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
  const shiftStartMinutes = parseInt(shiftStart.split(':')[0]) * 60 + parseInt(shiftStart.split(':')[1]);
  let shiftEndMinutes = parseInt(shiftEnd.split(':')[0]) * 60 + parseInt(shiftEnd.split(':')[1]);
  const availStartMinutes = parseInt(availStart.split(':')[0]) * 60 + parseInt(availStart.split(':')[1]);
  let availEndMinutes = parseInt(availEnd.split(':')[0]) * 60 + parseInt(availEnd.split(':')[1]);

  // Handle overnight shifts
  if (shiftEndMinutes < shiftStartMinutes) {
    shiftEndMinutes += 24 * 60;
  }
  if (availEndMinutes < availStartMinutes) {
    availEndMinutes += 24 * 60;
  }

  const isWithinAvailability = shiftStartMinutes >= availStartMinutes && shiftEndMinutes <= availEndMinutes;

  if (!isWithinAvailability) {
    return {
      hasConflict: true,
      message: `${employee.first_name} is only available ${formatTime(availStart)} - ${formatTime(availEnd)} on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]}, but you're scheduling them for ${formatTime(shiftStart)} - ${formatTime(shiftEnd)}`
    };
  }

  return { hasConflict: false, message: null };
}; 