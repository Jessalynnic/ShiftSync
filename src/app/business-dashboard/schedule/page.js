"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from '../../../supabaseClient';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import DashboardFooter from '../components/DashboardFooter';
import { getBusinessIdForCurrentUser } from '../roleUtils';
import ScheduleGrid from './components/ScheduleGrid';
import EmployeeList from './components/EmployeeList';
import ShiftSelectionPopover from './components/ShiftSelectionPopover';
import DefaultShiftsEditor from './components/DefaultShiftsEditor';
import DefaultShiftsChipsRow from './components/DefaultShiftsChipsRow';
import ConflictNotification from './components/ConflictNotification';
import { 
  getStartOfWeek, 
  getWeekDates, 
  isToday, 
  formatTime, 
  convertTo24HourFormat, 
  calculateHoursDifference, 
  getTotalHoursColor, 
  checkAvailabilityConflict 
} from './scheduleUtils';


function SchedulePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [dates, setDates] = useState(getWeekDates(currentWeek));
  const [rowCount, setRowCount] = useState(6);
  const [employeeAssignments, setEmployeeAssignments] = useState({});
  const [shiftAssignments, setShiftAssignments] = useState({});
  const [selectedRole, setSelectedRole] = useState("All");
  const [employees, setEmployees] = useState([]);
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [businessId, setBusinessId] = useState(null);
  const [conflictDialog, setConflictDialog] = useState({ 
    show: false, 
    message: '', 
    employeeName: '', 
    shiftTime: '', 
    pendingAssignment: null 
  });
  const [shiftPopover, setShiftPopover] = useState({ open: false, cellId: null, employee: null, dayKey: null, anchorRef: null });
  const [defaultShifts, setDefaultShifts] = useState([]);

  useEffect(() => {
    async function initializeBusinessId() {
      try {
        const bId = await getBusinessIdForCurrentUser();
        setBusinessId(bId);
      } catch (err) {
        console.error('Error getting business ID:', err);
        setError('Failed to get business information.');
      }
    }
    initializeBusinessId();
  }, []);

  useEffect(() => {
    if (businessId) {
      fetchData();
    }
  }, [businessId]);

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

  const fetchData = async () => {
    try {
      // Fetch employees with their availability
      const { data: employees, error: employeeError } = await supabase
        .from('employee')
        .select(`
          emp_id,
          first_name,
          last_name,
          role_id,
          roles(role_name)
        `)
        .eq('business_id', businessId)
        .eq('is_active', true);

      if (employeeError) throw employeeError;
      
      // Fetch availability for each employee
      const employeesWithAvailability = await Promise.all(
        employees.map(async (emp) => {
          try {
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
          } catch (availabilityError) {
            console.warn('Could not fetch availability for employee:', emp.emp_id, availabilityError);
            return {
              ...emp,
              role_name: emp.roles?.role_name || 'Unknown Role',
              shiftHours: 0,
              availability: []
            };
          }
        })
      );
      
      setEmployees(employeesWithAvailability);
      
      // For now, start with empty shifts - users can create them
      setShiftAssignments({});
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again later.');
      setLoading(false);
    }
  };

  const handleCreateSchedule = async () => {
    if (!businessId) return;
    setIsCreating(true);
    try {
      const weekStartDate = getStartOfWeek(currentWeek).toISOString().split('T')[0];
      // Create the schedule row (without assignments)
      const { data: schedule, error: scheduleError } = await supabase
        .from('schedule')
        .insert({
          business_id: businessId,
          week_start_date: weekStartDate,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      if (scheduleError) throw scheduleError;
      // Build assignments array from grid state
      const assignments = [];
      for (const cellId in employeeAssignments) {
        const employee = employeeAssignments[cellId];
        const shift = shiftAssignments[cellId];
        if (
          employee && shift &&
          employee.emp_id != null && shift.shift_id != null
        ) {
          assignments.push({
            schedule_id: schedule.id,
            emp_id: employee.emp_id,
            shift_id: shift.shift_id
          });
        }
      }
      console.log('ASSIGNMENTS TO INSERT:', assignments);
      // Insert assignments into employee_shift
      if (assignments.length > 0) {
        console.log('Inserting into employee_shift:', assignments);
        const { data, error } = await supabase
          .from('employee_shift')
          .insert(assignments);
        if (error) throw error;
      }
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
      // Update the schedule row (without assignments)
      const { data: schedule, error: scheduleError } = await supabase
        .from('schedule')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('business_id', businessId)
        .eq('week_start_date', weekStartDate)
        .select()
        .single();
      if (scheduleError) throw scheduleError;
      // Build assignments array from grid state
      const assignments = [];
      for (const cellId in employeeAssignments) {
        const employee = employeeAssignments[cellId];
        const shift = shiftAssignments[cellId];
        if (
          employee && shift &&
          employee.emp_id != null && shift.shift_id != null
        ) {
          assignments.push({
            schedule_id: schedule.id,
            emp_id: employee.emp_id,
            shift_id: shift.shift_id
          });
        }
      }
      // Delete old assignments for this schedule and insert new ones
      await supabase
        .from('employee_shift')
        .delete()
        .eq('schedule_id', schedule.id);
      if (assignments.length > 0) {
        const { data, error } = await supabase
          .from('employee_shift')
          .insert(assignments);
        if (error) throw error;
      }
      alert("Schedule updated successfully!");
    } catch (err) {
      console.error('Error updating schedule:', err);
      alert("Failed to update schedule. Please try again.");
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

  const handleConflictConfirm = () => {
    if (conflictDialog.pendingAssignment) {
      const { cellId, employee, shift, type } = conflictDialog.pendingAssignment;
      
      if (type === 'employee') {
        setEmployeeAssignments(prev => ({
          ...prev,
          [cellId]: employee
        }));
      } else if (type === 'shift') {
        setShiftAssignments(prev => ({
          ...prev,
          [cellId]: shift
        }));
      }
    }
    
    // Close dialog
    setConflictDialog({
      show: false,
      message: '',
      employeeName: '',
      shiftTime: '',
      pendingAssignment: null
    });
  };

  const handleConflictCancel = () => {
    // Close dialog without making assignment
    setConflictDialog({
      show: false,
      message: '',
      employeeName: '',
      shiftTime: '',
      pendingAssignment: null
    });
  };

  const handleConflictDismiss = () => {
    // Dismiss the notification without making any changes
    setConflictDialog({
      show: false,
      message: '',
      employeeName: '',
      shiftTime: '',
      pendingAssignment: null
    });
  };

  const handleDrop = (e, item, type, dayKey, rowIndex) => {
    const cellId = `${rowIndex}-${dayKey}`;
    // Use UTC to avoid timezone bugs when calculating day of week from date string
    // Subtract one day to align with grid mapping
    const dayOfWeek = new Date(new Date(dayKey + 'T00:00:00Z').getTime() - 24 * 60 * 60 * 1000).getUTCDay();
    
    if (type === 'employee') {
      const existingShift = shiftAssignments[cellId];
      const dayAvailability = item.availability.find(
        avail => Number(avail.day_of_week) === dayOfWeek && avail.is_available
      );
      if (!dayAvailability) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        setConflictDialog({
          show: true,
          message: `${item.first_name} is not available on ${dayNames[dayOfWeek]}`,
          employeeName: `${item.first_name} ${item.last_name}`,
          shiftTime: existingShift ? (typeof existingShift === 'string' ? existingShift : existingShift.time) : 'No shift assigned yet',
          pendingAssignment: { cellId, employee: item, type: 'employee' }
        });
        return;
      }
      if (existingShift) {
        const conflict = checkAvailabilityConflict(item, existingShift, dayOfWeek);
        if (conflict.hasConflict) {
          setConflictDialog({
            show: true,
            message: conflict.message,
            employeeName: `${item.first_name} ${item.last_name}`,
            shiftTime: typeof existingShift === 'string' ? existingShift : existingShift.time,
            pendingAssignment: { cellId, employee: item, type: 'employee' }
          });
          return;
        }
      }
      setShiftPopover({ open: true, cellId, employee: item, dayKey, anchorRef: e.target });
    } else if (type === 'shift') {
      const existingEmployee = employeeAssignments[cellId];
      if (existingEmployee) {
        const conflict = checkAvailabilityConflict(existingEmployee, item, dayOfWeek);
        if (conflict.hasConflict) {
          setConflictDialog({
            show: true,
            message: conflict.message,
            employeeName: `${existingEmployee.first_name} ${existingEmployee.last_name}`,
            shiftTime: typeof item === 'string' ? item : item.time,
            pendingAssignment: { cellId, shift: item, type: 'shift' }
          });
          return;
        }
      }
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

  // Handler for confirming shift selection
  const handleShiftPopoverConfirm = (shift) => {
    if (shiftPopover.cellId && shiftPopover.employee) {
      setEmployeeAssignments(prev => ({
        ...prev,
        [shiftPopover.cellId]: shiftPopover.employee
      }));
      setShiftAssignments(prev => ({
        ...prev,
        [shiftPopover.cellId]: shift
      }));
    }
    setShiftPopover({ open: false, cellId: null, employee: null, dayKey: null, anchorRef: null });
  };

  // Handler for closing popover
  const handleShiftPopoverClose = () => {
    setShiftPopover({ open: false, cellId: null, employee: null, dayKey: null, anchorRef: null });
  };

  // In SchedulePage, add a function to open the shift popover for editing
  const openShiftEditPopover = (cellId, shift, employee, dayKey, anchorRef) => {
    setShiftPopover({
      open: true,
      cellId,
      employee,
      dayKey,
      anchorRef
    });
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
                <p className="text-sm text-gray-500 mt-1">
                  Today: {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
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
                {/* Employee List */}
                <div className="lg:col-span-1">
                  <EmployeeList
                    employees={filteredEmployees}
                    selectedRole={selectedRole}
                    onRoleChange={setSelectedRole}
                  />
                </div>

                {/* Schedule Grid */}
                <div className="lg:col-span-4">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Schedule Grid Header */}
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Weekly Schedule</h3>
                          <p className="text-sm text-gray-500 mt-1">Drag employees and shifts to create assignments</p>
                        </div>
                        <DefaultShiftsEditor defaultShifts={defaultShifts} setDefaultShifts={setDefaultShifts} compact />
                      </div>
                      <DefaultShiftsChipsRow defaultShifts={defaultShifts} setDefaultShifts={setDefaultShifts} />
                    </div>
                    
                    {/* Schedule Grid Content */}
                    <div className="p-6">
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
                        openShiftEditPopover={openShiftEditPopover}
                        defaultShifts={defaultShifts}
                        setDefaultShifts={setDefaultShifts}
                      />
                    </div>
                  </div>
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
      
      {/* Availability Conflict Dialog */}
      <ConflictNotification
        show={conflictDialog.show}
        message={conflictDialog.message}
        onConfirm={handleConflictConfirm}
        onCancel={handleConflictCancel}
        onDismiss={handleConflictDismiss}
      />
      
      {/* Shift Selection Popover */}
      <ShiftSelectionPopover
        open={shiftPopover.open}
        anchorRef={shiftPopover.anchorRef}
        onClose={handleShiftPopoverClose}
        onConfirm={handleShiftPopoverConfirm}
        employee={shiftPopover.employee}
        dayKey={shiftPopover.dayKey}
        defaultShifts={defaultShifts}
      />
      
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default SchedulePage; 