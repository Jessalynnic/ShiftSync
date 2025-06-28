"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from '../../../supabaseClient';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import DashboardFooter from '../components/DashboardFooter';
import { getBusinessIdForCurrentUser } from '../roleUtils';

// Utility functions
const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const getWeekDates = (date) => {
  const start = getStartOfWeek(date);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const newDate = new Date(start);
    newDate.setDate(start.getDate() + i);
    dates.push(newDate);
  }
  return dates;
};

const formatTime = (time) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

const convertTo24HourFormat = (time12h) => {
  if (!time12h) return '';
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  hours = parseInt(hours);
  if (modifier === 'PM' && hours !== 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

const calculateHoursDifference = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  let diff = (endHour * 60 + endMin) - (startHour * 60 + startMin);
  if (diff < 0) diff += 24 * 60; // Handle overnight shifts
  return Math.round((diff / 60) * 100) / 100;
};

const getTotalHoursColor = (total, max) => {
  if (total > max) return 'text-red-600';
  if (total > max * 0.9) return 'text-yellow-600';
  return 'text-green-600';
};

// Employee List Component
const EmployeeList = ({ employees, selectedRole, onRoleChange, onEmployeeDrop }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedEmployee, setDraggedEmployee] = useState(null);

  const roles = ["All", "Managers", "Employees"];

  const handleDragStart = (e, employee) => {
    setIsDragging(true);
    setDraggedEmployee(employee);
    e.dataTransfer.setData('text/plain', JSON.stringify(employee));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedEmployee(null);
  };

  const getAvailabilityText = (employee) => {
    if (!employee.availability || employee.availability.length === 0) {
      return null;
    }
    
    // Get today's day of week (0 = Sunday, 1 = Monday, etc.)
    const today = new Date().getDay();
    const todayAvailability = employee.availability.find(avail => avail.day_of_week === today);
    
    if (todayAvailability) {
      return `Available: ${formatTime(todayAvailability.start_time)} - ${formatTime(todayAvailability.end_time)}`;
    }
    
    return `Available ${employee.availability.length} days/week`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedRole === "All" ? "All Team Members" : selectedRole}
          </h3>
          <div className="relative">
            <select
              value={selectedRole}
              onChange={(e) => onRoleChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white pr-8"
            >
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500">Drag employees to assign them to shifts</p>
      </div>
      
      <div className="p-4">
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {employees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m13-7a4 4 0 11-8 0 4 4 0 018 0zM5 7a4 4 0 108 0 4 4 0 00-8 0z" />
              </svg>
              <p className="text-sm">No employees found</p>
            </div>
          ) : (
            employees.map((employee) => {
              const availabilityText = getAvailabilityText(employee);
              
              return (
                <div
                  key={employee.emp_id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, employee)}
                  onDragEnd={handleDragEnd}
                  className={`p-4 rounded-lg border-2 border-dashed cursor-move transition-all ${
                    isDragging && draggedEmployee?.emp_id === employee.emp_id
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">
                            {employee.first_name?.[0]}{employee.last_name?.[0]}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900">
                          {employee.first_name} {employee.last_name}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{employee.role_name}</p>
                      <p className="text-xs text-gray-500">
                        Hours: {employee.shiftHours || 0}
                      </p>
                    </div>
                    {availabilityText && (
                      <div className="text-xs text-green-600 text-right max-w-24">
                        {availabilityText}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// Schedule Grid Component
const ScheduleGrid = ({ employees, weekDays, employeeAssignments, shiftAssignments, onDrop, onRemoveShift, onRemoveEmployee, rowCount, setRowCount }) => {
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e, dayKey, rowIndex) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    if (data) {
      try {
        const dropData = JSON.parse(data);
        
        // Check if it's a shift (has time property) or employee (has first_name property)
        if (dropData.time || dropData.displayTime) {
          onDrop(e, dropData, 'shift', dayKey, rowIndex);
        } else if (dropData.first_name) {
          onDrop(e, dropData, 'employee', dayKey, rowIndex);
        }
      } catch (error) {
        console.error('Error parsing drop data:', error);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Weekly Schedule</h3>
            <p className="text-sm text-gray-500 mt-1">Drag employees and shifts to create assignments</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Number of Rows:</label>
            <input
              type="number"
              value={rowCount}
              onChange={(e) => setRowCount(parseInt(e.target.value) || 8)}
              min="1"
              max="20"
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {weekDays.map((day) => (
                <th key={day} className="px-3 py-3 text-center text-sm font-medium text-gray-700 min-w-[140px]">
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500 font-normal">
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rowCount }, (_, rowIndex) => (
              <tr key={rowIndex} className="border-b border-gray-100 last:border-b-0">
                {weekDays.map((day) => {
                  const dayKey = day.toISOString().split('T')[0];
                  const cellId = `${rowIndex}-${dayKey}`;
                  const employeeAssignment = employeeAssignments[cellId];
                  const shiftAssignment = shiftAssignments[cellId];
                  
                  return (
                    <td
                      key={day}
                      data-cell-id={cellId}
                      className="px-1 py-1 min-h-[80px]"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, dayKey, rowIndex)}
                    >
                      <div className="h-full min-h-[80px] border-2 border-dashed border-gray-200 rounded-lg p-2 transition-all hover:border-gray-300 hover:bg-gray-50">
                        {employeeAssignment && (
                          <div className="bg-blue-100 border border-blue-200 rounded p-1 mb-1 relative">
                            <button
                              onClick={() => onRemoveEmployee(cellId)}
                              className="absolute top-0.5 right-0.5 w-4 h-4 bg-blue-200 hover:bg-blue-300 rounded-full flex items-center justify-center text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                            <div className="text-xs font-medium text-blue-800 pr-4">
                              {employeeAssignment.first_name} {employeeAssignment.last_name}
                            </div>
                            <div className="text-xs text-blue-600">{employeeAssignment.role_name || 'No role'}</div>
                          </div>
                        )}
                        {shiftAssignment && (
                          <div className="bg-green-100 border border-green-200 rounded p-1 relative">
                            <button
                              onClick={() => onRemoveShift(cellId)}
                              className="absolute top-0.5 right-0.5 w-4 h-4 bg-green-200 hover:bg-green-300 rounded-full flex items-center justify-center text-green-600 hover:text-green-800 transition-colors"
                            >
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                            <div className="text-xs font-medium text-green-800 pr-4">
                              {shiftAssignment.title || 'Shift'}
                            </div>
                            <div className="text-xs text-green-600">{shiftAssignment.time || shiftAssignment.displayTime}</div>
                          </div>
                        )}
                        {!employeeAssignment && !shiftAssignment && (
                          <div className="text-center text-gray-400 text-xs py-4">
                            Drop here
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Shift Controls Component
const ShiftControls = ({ shiftTimes, setShiftTimes, onShiftDrop }) => {
  const [newShiftStart, setNewShiftStart] = useState('');
  const [newShiftEnd, setNewShiftEnd] = useState('');
  const [newShiftTitle, setNewShiftTitle] = useState('');

  const timeOptions = [
    '12:00 AM', '12:30 AM', '1:00 AM', '1:30 AM', '2:00 AM', '2:30 AM', '3:00 AM', '3:30 AM',
    '4:00 AM', '4:30 AM', '5:00 AM', '5:30 AM', '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM',
    '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
    '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM',
    '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM'
  ];

  const handleAddShift = () => {
    if (newShiftStart && newShiftEnd) {
      const newShift = {
        id: Date.now().toString(),
        title: newShiftTitle || null,
        time: `${newShiftStart} - ${newShiftEnd}`,
        displayTime: newShiftTitle 
          ? `${newShiftTitle}: ${newShiftStart} - ${newShiftEnd}`
          : `${newShiftStart} - ${newShiftEnd}`,
        startTime: convertTo24HourFormat(newShiftStart),
        endTime: convertTo24HourFormat(newShiftEnd)
      };
      setShiftTimes(prev => [...prev, newShift]);
      setNewShiftStart('');
      setNewShiftEnd('');
      setNewShiftTitle('');
    }
  };

  const handleShiftDragStart = (e, shift) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(shift));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Shift Time</h3>
        <p className="text-sm text-gray-500">Create shift templates to assign to employees</p>
      </div>
      
      <div className="p-6">
        <div className="space-y-6 mb-6">
          {/* Shift Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Shift Title (Optional)</label>
            <input
              type="text"
              value={newShiftTitle}
              onChange={(e) => setNewShiftTitle(e.target.value)}
              placeholder="e.g., Morning Shift, Cashier, Manager"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
              <select
                value={newShiftStart}
                onChange={(e) => setNewShiftStart(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select start time</option>
                {timeOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
              <select
                value={newShiftEnd}
                onChange={(e) => setNewShiftEnd(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select end time</option>
                {timeOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>
          
          <button
            onClick={handleAddShift}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Shift
            </div>
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Available Shifts</h4>
            <span className="text-xs text-gray-500">{shiftTimes.length} shifts</span>
          </div>
          <div className="space-y-3">
            {shiftTimes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">No shifts created yet</p>
                <p className="text-xs text-gray-400 mt-1">Create your first shift above</p>
              </div>
            ) : (
              shiftTimes.map((shift) => (
                <div
                  key={shift.id}
                  draggable
                  onDragStart={(e) => handleShiftDragStart(e, shift)}
                  className="p-4 border rounded-lg cursor-move transition-all bg-green-50 border-green-200 hover:bg-green-100 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-green-800">{shift.displayTime}</span>
                      {shift.title && (
                        <p className="text-xs text-green-600 mt-1">{shift.title}</p>
                      )}
                    </div>
                    <div className="text-green-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function SchedulePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState([]);
  const [selectedRole, setSelectedRole] = useState("All");
  const [shiftTimes, setShiftTimes] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [employeeAssignments, setEmployeeAssignments] = useState({});
  const [shiftAssignments, setShiftAssignments] = useState({});
  const [businessId, setBusinessId] = useState(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [rowCount, setRowCount] = useState(6);
  const [totalHours, setTotalHours] = useState(0);

  // Get week dates
  const dates = useMemo(() => getWeekDates(currentWeek), [currentWeek]);

  // Filter employees based on selected role
  const filteredEmployees = useMemo(() => {
    if (selectedRole === "All") return employees;
    return employees.filter(emp => {
      if (selectedRole === "Managers") {
        return emp.role_name?.toLowerCase().includes('manager') || 
               emp.role_name?.toLowerCase().includes('supervisor') ||
               emp.role_name?.toLowerCase().includes('lead');
      }
      return emp.role_name?.toLowerCase().includes('employee') || 
             emp.role_name?.toLowerCase().includes('associate') ||
             emp.role_name?.toLowerCase().includes('staff');
    });
  }, [employees, selectedRole]);

  useEffect(() => {
    async function initializePage() {
      setLoading(true);
      try {
        const bId = await getBusinessIdForCurrentUser();
        setBusinessId(bId);
        if (bId) {
          await Promise.all([
            fetchEmployees(bId),
            loadExistingSchedule(bId)
          ]);
        }
      } catch (err) {
        setError('Failed to initialize schedule page.');
      } finally {
        setLoading(false);
      }
    }
    initializePage();
  }, []);

  const testDatabaseConnection = async () => {
    try {
      // Test if employee table is accessible
      const { data: testData, error: testError } = await supabase
        .from('employee')
        .select('emp_id')
        .limit(1);
      
      if (testError) {
        console.error('Database connection test failed:', testError);
        throw new Error('Database connection failed');
      }
      
      console.log('Database connection test successful');
    } catch (err) {
      console.error('Database test error:', err);
      throw err;
    }
  };

  // Reload schedule when date changes
  useEffect(() => {
    if (businessId) {
      loadExistingSchedule(businessId);
    }
  }, [currentWeek, businessId]);

  // Recalculate total hours when assignments change
  useEffect(() => {
    let total = 0;
    const employeeHours = {};

    // Calculate hours for each assignment
    Object.entries(employeeAssignments).forEach(([cellId, employee]) => {
      const shiftAssignment = shiftAssignments[cellId];
      if (shiftAssignment && employee) {
        // Handle both old string format and new object format
        let startTime, endTime;
        
        if (typeof shiftAssignment === 'string') {
          // Old format: "9:00 AM - 5:00 PM"
          [startTime, endTime] = shiftAssignment.split(' - ').map(convertTo24HourFormat);
        } else if (shiftAssignment.startTime && shiftAssignment.endTime) {
          // New format: object with startTime and endTime properties
          startTime = shiftAssignment.startTime;
          endTime = shiftAssignment.endTime;
        } else {
          // Skip if we can't parse the time
          return;
        }
        
        const hours = calculateHoursDifference(startTime, endTime);
        total += hours;
        
        if (!employeeHours[employee.emp_id]) {
          employeeHours[employee.emp_id] = 0;
        }
        employeeHours[employee.emp_id] += hours;
      }
    });

    // Update total hours state
    setTotalHours(total);

    // Update employee shift hours
    setEmployees(prev => prev.map(emp => ({
      ...emp,
      shiftHours: employeeHours[emp.emp_id] || 0
    })));
  }, [employeeAssignments, shiftAssignments]);

  const fetchEmployees = async (bId) => {
    try {
      const { data, error } = await supabase
        .from('employee')
        .select(`
          emp_id,
          first_name,
          last_name,
          role_id,
          roles(role_name)
        `)
        .eq('business_id', bId)
        .eq('is_active', true);

      if (error) throw error;
      
      // Fetch availability for each employee
      const employeesWithAvailability = await Promise.all(
        data.map(async (emp) => {
          const { data: availabilityData } = await supabase
            .from('employee_availability')
            .select('day_of_week, start_time, end_time, is_available')
            .eq('employee_id', emp.emp_id)
            .eq('is_available', true);

          return {
            ...emp,
            role_name: emp.roles?.role_name || 'Unknown Role',
            shiftHours: 0,
            availability: availabilityData || []
          };
        })
      );
      
      setEmployees(employeesWithAvailability);
    } catch (err) {
      setError('Failed to fetch employees.');
    }
  };

  const loadExistingSchedule = async (bId) => {
    try {
      const weekStartDate = getStartOfWeek(currentWeek).toISOString().split('T')[0];
      
      // Check if schedule exists for this week
      const { data: schedule, error: scheduleError } = await supabase
        .from('schedule')
        .select('schedule_id, title, description')
        .eq('business_id', bId)
        .eq('week_start_date', weekStartDate)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors if no schedule exists

      if (scheduleError) {
        console.error('Error loading schedule:', scheduleError);
        return;
      }

      if (schedule) {
        setEmployeeAssignments(schedule.employeeAssignments);
        setShiftAssignments(schedule.shiftAssignments);
      } else {
        // No existing schedule found, reset state
        setEmployeeAssignments({});
        setShiftAssignments({});
      }
    } catch (err) {
      console.error('Error loading schedule:', err);
      setError('Failed to load schedule data.');
    }
  };

  const handleDrop = (e, item, type, dayKey, rowIndex) => {
    const cellId = `${rowIndex}-${dayKey}`;
    
    if (type === 'employee') {
      setEmployeeAssignments(prev => ({
        ...prev,
        [cellId]: item
      }));
    } else if (type === 'shift') {
      setShiftAssignments(prev => ({
        ...prev,
        [cellId]: item
      }));
    }
  };

  const handleRemoveShift = (cellId) => {
    setShiftAssignments(prev => {
      const newAssignments = { ...prev };
      delete newAssignments[cellId];
      return newAssignments;
    });
  };

  const handleRemoveEmployee = (cellId) => {
    setEmployeeAssignments(prev => {
      const newAssignments = { ...prev };
      delete newAssignments[cellId];
      return newAssignments;
    });
  };

  const handleCreateSchedule = async () => {
    if (!businessId) return;
    
    setIsCreating(true);
    try {
      const weekStartDate = getStartOfWeek(currentWeek).toISOString().split('T')[0];
      
      const { data: schedule, error: scheduleError } = await supabase
        .from('schedule')
        .insert({
          business_id: businessId,
          week_start_date: weekStartDate,
          employeeAssignments: employeeAssignments,
          shiftAssignments: shiftAssignments,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (scheduleError) throw scheduleError;

      setEmployeeAssignments(schedule.employeeAssignments);
      setShiftAssignments(schedule.shiftAssignments);
      alert("Schedule created successfully!");
    } catch (err) {
      console.error('Error creating schedule:', err);
      alert("Failed to save schedule. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateSchedule = async () => {
    if (!businessId) return;
    
    setIsUpdating(true);
    try {
      const weekStartDate = getStartOfWeek(currentWeek).toISOString().split('T')[0];
      
      const { data: schedule, error: scheduleError } = await supabase
        .from('schedule')
        .update({
          employeeAssignments: employeeAssignments,
          shiftAssignments: shiftAssignments,
          updated_at: new Date().toISOString()
        })
        .eq('business_id', businessId)
        .eq('week_start_date', weekStartDate)
        .select()
        .single();

      if (scheduleError) throw scheduleError;

      setEmployeeAssignments(schedule.employeeAssignments);
      setShiftAssignments(schedule.shiftAssignments);
      alert("Schedule updated successfully!");
    } catch (err) {
      console.error('Error updating schedule:', err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    setError('');
    const { error } = await supabase.auth.signOut();
    setLogoutLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setTimeout(() => {
      router.push('/login');
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Sidebar pathname={pathname} router={router} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="lg:ml-64 flex flex-col min-h-screen">
          <DashboardHeader title="Schedule" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} loading={logoutLoading} handleLogout={handleLogout} />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading schedule...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar pathname={pathname} router={router} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <DashboardHeader title="Schedule Management" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} loading={logoutLoading} handleLogout={handleLogout} />
        
        <div className="flex-1 p-6">
          <div className="max-w-full space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Schedule Management</h1>
                <p className="text-gray-600 mt-1">Create and manage employee schedules</p>
              </div>
              
              {/* Week Navigation - Center */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentWeek(new Date(currentWeek.getTime() - 7 * 24 * 60 * 60 * 1000))}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-lg font-semibold text-gray-900">
                  {dates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {dates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <button
                  onClick={() => setCurrentWeek(new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000))}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              {/* Total Hours Display - Right */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Total Hours</div>
                  <div className={`text-2xl font-bold ${getTotalHoursColor(totalHours, 500)}`}>
                    {totalHours}
                  </div>
                </div>
                <div className="w-px h-12 bg-gray-300"></div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Max Hours</div>
                  <div className="text-2xl font-bold text-gray-900">500</div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading schedule...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Employee List and Shift Controls */}
                <div className="lg:col-span-1 space-y-6">
                  <EmployeeList
                    employees={filteredEmployees}
                    selectedRole={selectedRole}
                    onRoleChange={setSelectedRole}
                  />
                  
                  <ShiftControls
                    shiftTimes={shiftTimes}
                    setShiftTimes={setShiftTimes}
                    onShiftDrop={handleDrop}
                  />
                </div>

                {/* Schedule Grid */}
                <div className="lg:col-span-4">
                  <ScheduleGrid
                    employees={filteredEmployees}
                    weekDays={dates}
                    employeeAssignments={employeeAssignments}
                    shiftAssignments={shiftAssignments}
                    onDrop={handleDrop}
                    onRemoveShift={handleRemoveShift}
                    onRemoveEmployee={handleRemoveEmployee}
                    rowCount={rowCount}
                    setRowCount={setRowCount}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={handleCreateSchedule}
                disabled={isCreating}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
              >
                {isCreating ? 'Creating...' : 'Create Schedule'}
              </button>
              <button
                onClick={handleUpdateSchedule}
                disabled={isUpdating}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
              >
                {isUpdating ? 'Updating...' : 'Update Schedule'}
              </button>
            </div>
          </div>
        </div>
        
        <DashboardFooter />
      </div>
      
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
} 