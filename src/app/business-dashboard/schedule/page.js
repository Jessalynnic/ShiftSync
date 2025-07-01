"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from '../../../supabaseClient';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import DashboardFooter from '../components/DashboardFooter';
import { getBusinessIdForCurrentUser } from '../roleUtils';
import { createPortal } from "react-dom";

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

const isToday = (date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
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

const checkAvailabilityConflict = (employee, shiftTime, dayOfWeek) => {
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

// TooltipPortal component for robust tooltips
const TooltipPortal = ({ children, anchorRef, visible }) => {
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (anchorRef.current && visible) {
      const rect = anchorRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top + window.scrollY - 8, // 8px above
        left: rect.right + window.scrollX + 8, // 8px to the right
      });
    }
  }, [anchorRef, visible]);

  if (!visible) return null;
  return createPortal(
    <div
      ref={tooltipRef}
      style={{
        position: "absolute",
        top: coords.top,
        left: coords.left,
        zIndex: 9999,
      }}
    >
      {children}
    </div>,
    document.body
  );
};

// Employee List Component
const EmployeeList = ({ employees, selectedRole, onRoleChange, onEmployeeDrop }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedEmployee, setDraggedEmployee] = useState(null);
  const [hoveredEmpId, setHoveredEmpId] = useState(null);
  const anchorRefs = useRef({});

  const roles = ["All", "Managers", "Employees"];

  const handleDragStart = (e, employee) => {
    setIsDragging(true);
    setDraggedEmployee(employee);
    e.dataTransfer.setData('text/plain', JSON.stringify(employee));

    // Create a custom drag image (just the initials in a blue circle)
    const dragIcon = document.createElement('div');
    dragIcon.style.position = 'absolute';
    dragIcon.style.top = '-1000px';
    dragIcon.style.left = '-1000px';
    dragIcon.style.padding = '8px 12px';
    dragIcon.style.background = '#2563eb';
    dragIcon.style.color = 'white';
    dragIcon.style.fontWeight = 'bold';
    dragIcon.style.borderRadius = '9999px';
    dragIcon.style.fontSize = '14px';
    dragIcon.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
    dragIcon.innerText = `${employee.first_name?.[0] ?? ''}${employee.last_name?.[0] ?? ''}`;
    document.body.appendChild(dragIcon);
    e.dataTransfer.setDragImage(dragIcon, 16, 16);
    // Clean up after drag
    setTimeout(() => {
      document.body.removeChild(dragIcon);
    }, 0);
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
      return `Today: ${formatTime(todayAvailability.start_time)} - ${formatTime(todayAvailability.end_time)}`;
    }
    
    // Show availability summary
    const availableDays = employee.availability.length;
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const availableDayNames = employee.availability
      .map(avail => dayNames[avail.day_of_week])
      .join(', ');
    
    return `${availableDays} days: ${availableDayNames}`;
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
        <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-styled relative">
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
              if (!anchorRefs.current[employee.emp_id]) {
                anchorRefs.current[employee.emp_id] = React.createRef();
              }
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
                      <div
                        className="group relative"
                        ref={anchorRefs.current[employee.emp_id]}
                        onMouseEnter={() => setHoveredEmpId(employee.emp_id)}
                        onMouseLeave={() => setHoveredEmpId(null)}
                      >
                        <div className="text-xs text-green-600 text-right max-w-24 cursor-help">
                          {availabilityText}
                        </div>
                        <TooltipPortal
                          anchorRef={anchorRefs.current[employee.emp_id]}
                          visible={hoveredEmpId === employee.emp_id}
                        >
                          <div className="w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                            <div className="text-xs font-medium text-gray-900 mb-2">Weekly Availability</div>
                            <div className="space-y-1">
                              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName, index) => {
                                const dayAvailability = employee.availability.find(avail => Number(avail.day_of_week) === index && avail.is_available);
                                return (
                                  <div key={dayName} className="flex justify-between text-xs">
                                    <span className="text-gray-600 w-8">{dayName}:</span>
                                    <span className={dayAvailability ? 'text-green-600' : 'text-gray-400'}>
                                      {dayAvailability 
                                        ? `${formatTime(dayAvailability.start_time)} - ${formatTime(dayAvailability.end_time)}`
                                        : 'Not available'
                                      }
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </TooltipPortal>
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
const ScheduleGrid = ({ employees, weekDays, employeeAssignments, shiftAssignments, onDrop, onRemoveShift, onRemoveEmployee, rowCount, setRowCount, openShiftEditPopover, defaultShifts, setDefaultShifts }) => {
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
          <DefaultShiftsEditor defaultShifts={defaultShifts} setDefaultShifts={setDefaultShifts} compact />
        </div>
        <div className="flex height-200 mt-2">
          <DefaultShiftsChipsRow defaultShifts={defaultShifts} setDefaultShifts={setDefaultShifts} />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {weekDays.map((day) => (
                <th key={day} className={`px-3 py-3 text-center text-sm font-medium min-w-[140px] ${
                  isToday(day) 
                    ? 'bg-blue-50 border-l-2 border-r-2 border-blue-200 text-blue-900' 
                    : 'text-gray-700'
                }`}>
                  <div className="space-y-1">
                    <div className={`text-xs font-normal ${
                      isToday(day) ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className={`text-sm font-semibold ${
                      isToday(day) ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    {isToday(day) && (
                      <div className="text-xs text-blue-600 font-medium">TODAY</div>
                    )}
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
                      className={`px-1 py-1 min-h-[80px] ${
                        isToday(day) ? 'bg-blue-50 border-l border-r border-blue-100' : ''
                      }`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, dayKey, rowIndex)}
                    >
                      <div className={`h-full min-h-[80px] border-2 border-dashed rounded-lg p-2 transition-all hover:border-gray-300 hover:bg-gray-50 ${
                        isToday(day) 
                          ? 'border-blue-200 hover:border-blue-300 hover:bg-blue-50' 
                          : 'border-gray-200'
                      }`}>
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
                          <div
                            className="bg-green-100 border border-green-200 rounded p-1 relative cursor-pointer flex items-center gap-1 mt-1"
                            onClick={e => openShiftEditPopover(cellId, shiftAssignment, employeeAssignment, dayKey, { current: e.currentTarget })}
                            title="Edit shift time"
                          >
                            <div>
                              {shiftAssignment.title && (
                                <div className="text-xs text-green-800 font-medium pr-4">{shiftAssignment.title}</div>
                              )}
                              <div className="text-xs text-green-600">
                                {shiftAssignment.startTime && shiftAssignment.endTime
                                  ? `${formatTime(shiftAssignment.startTime)} - ${formatTime(shiftAssignment.endTime)}`
                                  : ''}
                              </div>
                            </div>
                            <svg className="w-3 h-3 ml-1 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6 6M3 21h18" />
                            </svg>
                            <button
                              onClick={e => { e.stopPropagation(); onRemoveShift(cellId); }}
                              className="absolute top-0.5 right-0.5 w-4 h-4 bg-green-200 hover:bg-green-300 rounded-full flex items-center justify-center text-green-600 hover:text-green-800 transition-colors"
                              title="Remove shift"
                            >
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
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

// Inline Conflict Notification Component
const ConflictNotification = ({ show, message, onConfirm, onCancel, onDismiss }) => {
  if (!show) return null;
  
  return (
    <div className="fixed top-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4 max-w-md z-50 animate-in slide-in-from-right duration-300">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">Availability Conflict</h3>
          <p className="text-sm text-yellow-700 mt-1">{message}</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={onConfirm}
              className="px-3 py-1.5 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
            >
              Schedule Anyway
            </button>
            <button
              onClick={onCancel}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="ml-2 flex-shrink-0 text-yellow-400 hover:text-yellow-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// ShiftSelectionPopover component
function ShiftSelectionPopover({ open, anchorRef, onClose, onConfirm, employee, dayKey, defaultShifts }) {
  const [selectedShift, setSelectedShift] = useState(null);
  const [customTitle, setCustomTitle] = useState('');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => {
    if (selectedShift) {
      setCustomTitle(selectedShift.title || '');
      setCustomStart(selectedShift.startTime || '');
      setCustomEnd(selectedShift.endTime || '');
    }
  }, [selectedShift]);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    if (open) {
      document.addEventListener('keydown', handleKey);
      return () => document.removeEventListener('keydown', handleKey);
    }
  }, [open, onClose]);
  if (!open || !anchorRef?.current) return null;
  return (
    <TooltipPortal anchorRef={anchorRef} visible={open}>
      <div className="w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
        <div className="font-semibold mb-2">Assign Shift for {employee?.first_name} {employee?.last_name}</div>
        <div className="text-xs text-gray-500 mb-2">{new Date(dayKey).toLocaleDateString()}</div>
        {defaultShifts && defaultShifts.length > 0 && (
          <div className="mb-3">
            <div className="font-medium mb-1">Default Shifts:</div>
            <div className="space-y-1">
              {defaultShifts.map((shift, idx) => (
                <button
                  key={idx}
                  className={`w-full px-3 py-1 rounded border text-left text-sm ${selectedShift === shift ? 'bg-blue-100 border-blue-400' : 'bg-gray-50 border-gray-200'}`}
                  onClick={() => {
                    setSelectedShift(shift);
                    setCustomTitle(shift.title || '');
                    setCustomStart(shift.startTime || '');
                    setCustomEnd(shift.endTime || '');
                  }}
                >
                  {shift.title ? <span className="font-semibold">{shift.title}: </span> : null}
                  {shift.startTime} - {shift.endTime}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="mb-3">
          <div className="font-medium mb-1">Shift Title</div>
          <input
            type="text"
            value={customTitle}
            onChange={e => {
              setCustomTitle(e.target.value);
              setSelectedShift(null);
            }}
            className="border rounded px-2 py-1 w-full mb-2"
            placeholder="e.g. Morning, Cashier, etc."
          />
          <div className="font-medium mb-1">Shift Time</div>
          <div className="flex gap-2">
            <input
              type="time"
              value={customStart}
              onChange={e => {
                setCustomStart(e.target.value);
                setSelectedShift(null);
              }}
              className="border rounded px-2 py-1"
            />
            <span className="self-center">to</span>
            <input
              type="time"
              value={customEnd}
              onChange={e => {
                setCustomEnd(e.target.value);
                setSelectedShift(null);
              }}
              className="border rounded px-2 py-1"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <button onClick={onClose} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm">Cancel</button>
          <button
            className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm disabled:opacity-50"
            disabled={!(customStart && customEnd)}
            onClick={() => {
              onConfirm({
                title: customTitle,
                startTime: customStart,
                endTime: customEnd
              });
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </TooltipPortal>
  );
}

// Restore DefaultShiftsEditor to display add form at the top
function DefaultShiftsEditor({ defaultShifts, setDefaultShifts, compact }) {
  const [newTitle, setNewTitle] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const handleAdd = () => {
    if (!newStart || !newEnd) return;
    setDefaultShifts(prev => [
      ...prev,
      { title: newTitle, startTime: newStart, endTime: newEnd }
    ]);
    setNewTitle(''); setNewStart(''); setNewEnd('');
  };
  const handleRemove = (idx) => {
    setDefaultShifts(prev => prev.filter((_, i) => i !== idx));
  };
  return (
    <div className={`mb-6 ${compact ? '' : 'bg-white border border-gray-200 rounded-lg p-4'}`}>
      {compact ? null : <h3 className="text-lg font-semibold mb-2">Default Shifts</h3>}
      {compact ? null : <p className="text-xs text-gray-500 mb-3">Set default shift templates. These will appear as quick options when assigning shifts for any day.</p>}
      {/* Add form always at the top */}
      <form
        className={`flex gap-1 ${compact ? '' : 'mb-2'}`}
        onSubmit={e => { e.preventDefault(); handleAdd(); }}
        style={compact ? { fontSize: '12px' } : {}}>
        <input
          type="text"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="Title"
          className={`border rounded px-1 py-0.5 text-xs ${compact ? 'w-50' : ''}`}
          style={compact ? { minWidth: 50, maxWidth: 100 } : {}}
        />
        <input
          type="time"
          value={newStart}
          onChange={e => setNewStart(e.target.value)}
          className="border rounded px-1 py-0.5 text-xs w-16"
        />
        <input
          type="time"
          value={newEnd}
          onChange={e => setNewEnd(e.target.value)}
          className="border rounded px-1 py-0.5 text-xs w-16"
        />
        <button type="submit" className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs">Add</button>
      </form>
    </div>
  );
}

// Extract default shifts row to a new component
function DefaultShiftsChipsRow({ defaultShifts, setDefaultShifts }) {
  return (
    <div className="flex flex-nowrap items-end gap-2 mt-2 overflow-x-auto justify-end w-full">
      {defaultShifts.map((shift, idx) => (
        <div key={idx} className="bg-blue-50 border border-blue-200 rounded px-2 py-1 flex items-center gap-2 whitespace-nowrap text-xs px-1 py-0.5" style={{ fontSize: '12px', padding: '2px 6px' }}>
          <span className="font-semibold text-xs">{shift.title || 'Shift'}</span>
          <span className="text-xs">{formatTime(shift.startTime)} - {formatTime(shift.endTime)}</span>
          <button onClick={() => setDefaultShifts(prev => prev.filter((_, i) => i !== idx))} className="text-xs text-red-500 ml-1">&times;</button>
        </div>
      ))}
    </div>
  );
}

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
      setShiftPopover({ open: true, cellId, employee: item, dayKey, anchorRef: { current: e.target } });
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
                {/* Employee List and Shift Controls */}
                <div className="lg:col-span-1 space-y-6">
                  <EmployeeList
                    employees={filteredEmployees}
                    selectedRole={selectedRole}
                    onRoleChange={setSelectedRole}
                  />
                </div>

                {/* Schedule Grid */}
                <div className="lg:col-span-4">
                  <div className="p-6 border-gray-200">
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