"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../../../supabaseClient";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import DashboardFooter from "../components/DashboardFooter";
import { getBusinessIdForCurrentUser } from "../roleUtils";
import ScheduleGrid from "./components/ScheduleGrid";
import EmployeeList from "./components/EmployeeList";
import ShiftSelectionPopover from "./components/ShiftSelectionPopover";
import DefaultShiftsEditor from "./components/DefaultShiftsEditor";
import DefaultShiftsChipsRow from "./components/DefaultShiftsChipsRow";
import ConflictNotification from "./components/ConflictNotification";
import ExportScheduleModal from "./components/ExportScheduleModal";
import {
  getStartOfWeek,
  getWeekDates,
  isToday,
  formatTime,
  convertTo24HourFormat,
  calculateHoursDifference,
  getTotalHoursColor,
  checkAvailabilityConflict,
} from "./scheduleUtils";

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
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [businessId, setBusinessId] = useState(null);
  const [conflictDialog, setConflictDialog] = useState({
    show: false,
    message: "",
    employeeName: "",
    shiftTime: "",
    pendingAssignment: null,
  });
  const [shiftPopover, setShiftPopover] = useState({
    open: false,
    cellId: null,
    employee: null,
    dayKey: null,
    anchorRef: null,
  });
  const [defaultShifts, setDefaultShifts] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [existingSchedule, setExistingSchedule] = useState(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  useEffect(() => {
    async function initializeBusinessId() {
      try {
        const bId = await getBusinessIdForCurrentUser();
        setBusinessId(bId);
      } catch (err) {
        console.error("Error getting business ID:", err);
        setError("Failed to get business information.");
      }
    }
    initializeBusinessId();
  }, []);

  useEffect(() => {
    if (businessId) {
      fetchData();
    }
  }, [businessId]);

  useEffect(() => {
    if (businessId && currentWeek) {
      const fetchScheduleAndShifts = async () => {
        const weekStartDate = getStartOfWeek(currentWeek)
          .toISOString()
          .split("T")[0];
        console.log("Querying schedule for weekStartDate:", weekStartDate);
        const { data: schedule, error: scheduleError } = await supabase
          .from("schedule")
          .select("schedule_id")
          .eq("business_id", businessId)
          .eq("week_start_date", weekStartDate)
          .single();
        if (schedule && schedule.schedule_id) {
          setExistingSchedule(schedule);
          // Fetch all shifts for this schedule
          const { data: shifts, error: shiftsError } = await supabase
            .from("shift")
            .select(
              "shift_id, employee_id, date, start_time, end_time, row_index, title, employee:employee_id (emp_id, first_name, last_name, role_id, roles(role_name))",
            )
            .eq("schedule_id", schedule.schedule_id);

          // Build assignments for the grid
          const newEmployeeAssignments = {};
          const newShiftAssignments = {};
          for (const shift of shifts) {
            const cellId = `${shift.row_index}::${shift.date}`;
            newEmployeeAssignments[cellId] = {
              emp_id: shift.employee.emp_id,
              first_name: shift.employee.first_name,
              last_name: shift.employee.last_name,
              role_id: shift.employee.role_id,
              role_name: shift.employee.roles?.role_name || "Unknown Role",
            };
            newShiftAssignments[cellId] = {
              startTime: shift.start_time,
              endTime: shift.end_time,
              title: shift.title || "",
            };
          }
          setEmployeeAssignments(newEmployeeAssignments);
          setShiftAssignments(newShiftAssignments);
        } else {
          setExistingSchedule(null);
          setEmployeeAssignments({});
          setShiftAssignments({});
        }
      };
      fetchScheduleAndShifts();
    }
  }, [businessId, currentWeek]);

  // Filter employees based on selected role
  const filteredEmployees = useMemo(() => {
    if (selectedRole === "All") return employees;
    return employees.filter((emp) => {
      if (selectedRole === "Managers") {
        return (
          emp.role_name?.toLowerCase().includes("manager") ||
          emp.role_name?.toLowerCase().includes("supervisor") ||
          emp.role_name?.toLowerCase().includes("lead")
        );
      }
      return (
        emp.role_name?.toLowerCase().includes("employee") ||
        emp.role_name?.toLowerCase().includes("associate") ||
        emp.role_name?.toLowerCase().includes("staff")
      );
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

        if (typeof shiftAssignment === "string") {
          // Old format: "9:00 AM - 5:00 PM"
          [startTime, endTime] = shiftAssignment
            .split(" - ")
            .map(convertTo24HourFormat);
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
    setEmployees((prev) =>
      prev.map((emp) => ({
        ...emp,
        shiftHours: employeeHours[emp.emp_id] || 0,
      })),
    );
  }, [employeeAssignments, shiftAssignments]);

  const fetchData = async () => {
    try {
      // Fetch employees with their availability
      const { data: employees, error: employeeError } = await supabase
        .from("employee")
        .select(
          `
          emp_id,
          first_name,
          last_name,
          role_id,
          roles(role_name)
        `,
        )
        .eq("business_id", businessId)
        .eq("is_active", true);

      if (employeeError) throw employeeError;

      // Fetch availability for each employee
      const employeesWithAvailability = await Promise.all(
        employees.map(async (emp) => {
          try {
            const { data: availabilityData } = await supabase
              .from("employee_availability")
              .select("day_of_week, start_time, end_time, is_available")
              .eq("employee_id", emp.emp_id)
              .eq("is_available", true);

            return {
              ...emp,
              role_name: emp.roles?.role_name || "Unknown Role",
              shiftHours: 0,
              availability: availabilityData || [],
            };
          } catch (availabilityError) {
            console.warn(
              "Could not fetch availability for employee:",
              emp.emp_id,
              availabilityError,
            );
            return {
              ...emp,
              role_name: emp.roles?.role_name || "Unknown Role",
              shiftHours: 0,
              availability: [],
            };
          }
        }),
      );

      setEmployees(employeesWithAvailability);

      // For now, start with empty shifts - users can create them
      setShiftAssignments({});
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again later.");
      setLoading(false);
    }
  };

  const handleCreateSchedule = async () => {
    if (!businessId) return;
    setIsCreating(true);
    try {
      const weekStartDate = getStartOfWeek(currentWeek)
        .toISOString()
        .split("T")[0];
      // Create the schedule row (without assignments)
      const { data: schedule, error: scheduleError } = await supabase
        .from("schedule")
        .insert({
          business_id: businessId,
          week_start_date: weekStartDate,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (scheduleError) {
        if (scheduleError.code === "23505") {
          alert(
            "A schedule for this week already exists. Please update the existing schedule instead.",
          );
        } else {
          alert("Failed to create schedule. Please try again.");
        }
        setIsCreating(false);
        return;
      }

      // Build shift rows for each cell with an employee and a shift
      const shiftsToInsert = [];
      for (const cellId in employeeAssignments) {
        const employee = employeeAssignments[cellId];
        const shift = shiftAssignments[cellId];
        if (employee && shift && employee.emp_id != null) {
          // cellId is in the format rowIndex::dayKey
          const [rowIndex, dayKey] = cellId.split("::");
          shiftsToInsert.push({
            schedule_id: schedule.schedule_id,
            employee_id: employee.emp_id,
            date: dayKey,
            start_time: shift.startTime,
            end_time: shift.endTime,
            row_index: Number(rowIndex),
            title: shift.title || null,
            created_at: new Date().toISOString(),
          });
        }
      }
      // Insert all shifts
      if (shiftsToInsert.length > 0) {
        const { data, error } = await supabase
          .from("shift")
          .insert(shiftsToInsert);
        if (error) throw error;
      }
      alert("Schedule created successfully!");
    } catch (err) {
      console.error("Error creating schedule:", err);
      alert("Failed to save schedule. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateSchedule = async () => {
    if (!businessId) return;
    setIsUpdating(true);
    try {
      const weekStartDate = getStartOfWeek(currentWeek)
        .toISOString()
        .split("T")[0];
      // Update the schedule row (without assignments)
      const { data: schedule, error: scheduleError } = await supabase
        .from("schedule")
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq("business_id", businessId)
        .eq("week_start_date", weekStartDate)
        .select()
        .single();
      if (scheduleError) throw scheduleError;
      // Build assignments array from grid state
      const assignments = [];
      for (const cellId in employeeAssignments) {
        const employee = employeeAssignments[cellId];
        const shift = shiftAssignments[cellId];
        if (
          employee &&
          shift &&
          employee.emp_id != null &&
          shift.shift_id != null
        ) {
          assignments.push({
            schedule_id: schedule.schedule_id,
            emp_id: employee.emp_id,
            shift_id: shift.shift_id,
          });
        }
      }
      // Delete old assignments for this schedule and insert new ones
      await supabase
        .from("employee_shift")
        .delete()
        .eq("schedule_id", schedule.schedule_id);
      if (assignments.length > 0) {
        const { data, error } = await supabase
          .from("employee_shift")
          .insert(assignments);
        if (error) throw error;
      }
      alert("Schedule updated successfully!");
    } catch (err) {
      console.error("Error updating schedule:", err);
      alert("Failed to update schedule. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    setError("");
    const { error } = await supabase.auth.signOut();
    setLogoutLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setTimeout(() => {
      router.push("/login");
    }, 1500);
  };

  const handleConflictConfirm = () => {
    if (conflictDialog.pendingAssignment) {
      const { cellId, employee, shift, type } =
        conflictDialog.pendingAssignment;
      // Assign both employee and shift if both are present
      if (employee && shift) {
        setEmployeeAssignments((prev) => ({
          ...prev,
          [cellId]: employee,
        }));
        setShiftAssignments((prev) => ({
          ...prev,
          [cellId]: shift,
        }));
      } else if (type === "employee") {
        setEmployeeAssignments((prev) => ({
          ...prev,
          [cellId]: employee,
        }));
      } else if (type === "shift") {
        setShiftAssignments((prev) => ({
          ...prev,
          [cellId]: shift,
        }));
      }
    }
    // Close dialog
    setConflictDialog({
      show: false,
      message: "",
      employeeName: "",
      shiftTime: "",
      pendingAssignment: null,
    });
  };

  const handleConflictCancel = () => {
    // Close dialog without making assignment
    setConflictDialog({
      show: false,
      message: "",
      employeeName: "",
      shiftTime: "",
      pendingAssignment: null,
    });
  };

  const handleConflictDismiss = () => {
    // Dismiss the notification without making any changes
    setConflictDialog({
      show: false,
      message: "",
      employeeName: "",
      shiftTime: "",
      pendingAssignment: null,
    });
  };

  const handleDrop = (e, item, type, dayKey, rowIndex) => {
    const cellId = `${rowIndex}::${dayKey}`;
    // Use UTC to avoid timezone bugs when calculating day of week from date string
    const dayOfWeek = new Date(dayKey + "T00:00:00Z").getUTCDay();

    if (type === "employee") {
      const existingShift = shiftAssignments[cellId];
      const dayAvailability = item.availability.find(
        (avail) =>
          Number(avail.day_of_week) === dayOfWeek && avail.is_available,
      );
      if (!dayAvailability) {
        const dayNames = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
        setConflictDialog({
          show: true,
          message: `${item.first_name} is not available on ${dayNames[dayOfWeek]}`,
          employeeName: `${item.first_name} ${item.last_name}`,
          shiftTime: existingShift
            ? typeof existingShift === "string"
              ? existingShift
              : existingShift.time
            : "No shift assigned yet",
          pendingAssignment: { cellId, employee: item, type: "employee" },
        });
        return;
      }
      if (existingShift) {
        const conflict = checkAvailabilityConflict(
          item,
          existingShift,
          dayOfWeek,
        );
        if (conflict.hasConflict) {
          setConflictDialog({
            show: true,
            message: conflict.message,
            employeeName: `${item.first_name} ${item.last_name}`,
            shiftTime:
              typeof existingShift === "string"
                ? existingShift
                : existingShift.time,
            pendingAssignment: { cellId, employee: item, type: "employee" },
          });
          return;
        }
      }
      setShiftPopover({
        open: true,
        cellId,
        employee: item,
        dayKey,
        anchorRef: e.target,
      });
    } else if (type === "shift") {
      const existingEmployee = employeeAssignments[cellId];
      if (existingEmployee) {
        const conflict = checkAvailabilityConflict(
          existingEmployee,
          item,
          dayOfWeek,
        );
        if (conflict.hasConflict) {
          setConflictDialog({
            show: true,
            message: conflict.message,
            employeeName: `${existingEmployee.first_name} ${existingEmployee.last_name}`,
            shiftTime: typeof item === "string" ? item : item.time,
            pendingAssignment: { cellId, shift: item, type: "shift" },
          });
          return;
        }
      }
      setShiftAssignments((prev) => ({
        ...prev,
        [cellId]: item,
      }));
    }
  };

  const handleRemoveShift = (cellId) => {
    setShiftAssignments((prev) => {
      const newAssignments = { ...prev };
      delete newAssignments[cellId];
      return newAssignments;
    });
  };

  const handleRemoveEmployee = (cellId) => {
    setEmployeeAssignments((prev) => {
      const newAssignments = { ...prev };
      delete newAssignments[cellId];
      return newAssignments;
    });
  };

  // Handler for confirming shift selection
  const handleShiftPopoverConfirm = (shift) => {
    if (shiftPopover.cellId && shiftPopover.employee) {
      // Conflict check before assigning
      const dayKey = shiftPopover.dayKey;
      const employee = shiftPopover.employee;
      const cellId = shiftPopover.cellId;
      const dayOfWeek = new Date(dayKey + "T00:00:00Z").getUTCDay();
      const conflict = checkAvailabilityConflict(employee, shift, dayOfWeek);
      if (conflict.hasConflict) {
        setConflictDialog({
          show: true,
          message: conflict.message,
          employeeName: `${employee.first_name} ${employee.last_name}`,
          shiftTime:
            typeof shift === "string"
              ? shift
              : `${shift.startTime} - ${shift.endTime}`,
          pendingAssignment: { cellId, employee, shift, type: "employee" },
        });
        setShiftPopover({
          open: false,
          cellId: null,
          employee: null,
          dayKey: null,
          anchorRef: null,
        });
        return;
      }
      setEmployeeAssignments((prev) => ({
        ...prev,
        [shiftPopover.cellId]: shiftPopover.employee,
      }));
      setShiftAssignments((prev) => ({
        ...prev,
        [shiftPopover.cellId]: shift,
      }));
    }
    setShiftPopover({
      open: false,
      cellId: null,
      employee: null,
      dayKey: null,
      anchorRef: null,
    });
  };

  // Handler for closing popover
  const handleShiftPopoverClose = () => {
    setShiftPopover({
      open: false,
      cellId: null,
      employee: null,
      dayKey: null,
      anchorRef: null,
    });
  };

  // In SchedulePage, add a function to open the shift popover for editing
  const openShiftEditPopover = (cellId, shift, employee, dayKey, anchorRef) => {
    setShiftPopover({
      open: true,
      cellId,
      employee,
      dayKey,
      anchorRef,
    });
  };

  // Update dates when currentWeek changes
  useEffect(() => {
    setDates(getWeekDates(currentWeek));
  }, [currentWeek]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Sidebar
          pathname={pathname}
          router={router}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <div className="lg:ml-64 flex flex-col min-h-screen">
          <DashboardHeader
            title="Schedule"
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            loading={logoutLoading}
            handleLogout={handleLogout}
          />
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
      <Sidebar
        pathname={pathname}
        router={router}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <DashboardHeader
          title="Schedule Management"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          loading={logoutLoading}
          handleLogout={handleLogout}
        />

        <div className="flex-1 p-6">
          <div className="max-w-full space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Schedule Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Create and manage employee schedules
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Today:{" "}
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              {/* Week Navigation - Center */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setCurrentWeek(
                      new Date(currentWeek.getTime() - 7 * 24 * 60 * 60 * 1000),
                    )
                  }
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <span className="text-lg font-semibold text-gray-900">
                  {dates[0].toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  -{" "}
                  {dates[6].toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <button
                  onClick={() =>
                    setCurrentWeek(
                      new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000),
                    )
                  }
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>

              {/* Total Hours Display - Right */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Total Hours</div>
                  <div
                    className={`text-2xl font-bold ${getTotalHoursColor(totalHours, 500)}`}
                  >
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
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
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
                          <h3 className="text-lg font-semibold text-gray-900">
                            Weekly Schedule
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Drag employees and shifts to create assignments
                          </p>
                        </div>
                        <DefaultShiftsEditor
                          defaultShifts={defaultShifts}
                          setDefaultShifts={setDefaultShifts}
                          compact
                        />
                      </div>
                      <DefaultShiftsChipsRow
                        defaultShifts={defaultShifts}
                        setDefaultShifts={setDefaultShifts}
                      />
                    </div>

                    {/* Schedule Grid Content */}
                    <div className="p-6">
                      <ScheduleGrid
                        employees={filteredEmployees}
                        weekDays={dates}
                        employeeAssignments={employeeAssignments}
                        shiftAssignments={shiftAssignments}
                        onDrop={editMode ? handleDrop : undefined}
                        onRemoveShift={editMode ? handleRemoveShift : undefined}
                        onRemoveEmployee={
                          editMode ? handleRemoveEmployee : undefined
                        }
                        rowCount={rowCount}
                        setRowCount={editMode ? setRowCount : undefined}
                        openShiftEditPopover={
                          editMode ? openShiftEditPopover : undefined
                        }
                        defaultShifts={defaultShifts}
                        setDefaultShifts={
                          editMode ? setDefaultShifts : undefined
                        }
                        editMode={editMode}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              {/* Export Button */}
              <button
                onClick={() => setExportModalOpen(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Schedule
              </button>

              {/* Save/Edit Buttons */}
              <div className="flex gap-4">
                {existingSchedule && !editMode ? (
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Edit Schedule
                  </button>
                ) : (
                  <button
                    onClick={
                      existingSchedule
                        ? async () => {
                            await handleUpdateSchedule();
                            setEditMode(false);
                          }
                        : handleCreateSchedule
                    }
                    disabled={isCreating || isUpdating}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                  >
                    {isCreating || isUpdating
                      ? "Saving..."
                      : existingSchedule
                        ? "Save Changes"
                        : "Create Schedule"}
                  </button>
                )}
              </div>
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

      {/* Export Schedule Modal */}
      <ExportScheduleModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        employeeAssignments={employeeAssignments}
        shiftAssignments={shiftAssignments}
        dates={dates}
        employees={employees}
        currentWeek={currentWeek}
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
