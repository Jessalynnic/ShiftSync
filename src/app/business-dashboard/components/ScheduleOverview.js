"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import { getStartOfWeek, formatTime } from "../schedule/scheduleUtils";

// Stat card icons
const icons = {
  totalShifts: (
    <svg
      className="w-7 h-7 text-blue-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  employeesWorking: (
    <svg
      className="w-7 h-7 text-green-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m13-7a4 4 0 11-8 0 4 4 0 018 0zM5 7a4 4 0 108 0 4 4 0 00-8 0z"
      />
    </svg>
  ),
  totalHours: (
    <svg
      className="w-7 h-7 text-purple-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
    </svg>
  ),
  todayShifts: (
    <svg
      className="w-7 h-7 text-orange-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  ),
  unfilledSlots: (
    <svg
      className="w-7 h-7 text-red-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  ),
  overtimeAlerts: (
    <svg
      className="w-7 h-7 text-yellow-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

const statMeta = [
  {
    key: "totalShifts",
    label: "Total Shifts",
    icon: icons.totalShifts,
    color: "text-blue-700",
  },
  {
    key: "employeesWorking",
    label: "Employees",
    icon: icons.employeesWorking,
    color: "text-green-700",
  },
  {
    key: "totalHours",
    label: "Total Hours",
    icon: icons.totalHours,
    color: "text-purple-700",
  },
  {
    key: "todayShifts",
    label: "Today",
    icon: icons.todayShifts,
    color: "text-orange-700",
  },
  {
    key: "unfilledSlots",
    label: "Empty Slots",
    icon: icons.unfilledSlots,
    color: "text-red-700",
  },
  {
    key: "overtimeAlerts",
    label: "Overtime",
    icon: icons.overtimeAlerts,
    color: "text-yellow-700",
  },
];

const ScheduleOverview = ({ businessId }) => {
  const [scheduleStats, setScheduleStats] = useState({
    totalShifts: 0,
    employeesWorking: 0,
    totalHours: 0,
    todayShifts: 0,
    unfilledSlots: 0,
    overtimeAlerts: 0,
  });
  const [currentWeekSchedule, setCurrentWeekSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (businessId) {
      fetchScheduleOverview();
    }
  }, [businessId]);

  const fetchScheduleOverview = async () => {
    try {
      setLoading(true);
      const currentWeek = new Date();
      const weekStartDate = getStartOfWeek(currentWeek)
        .toISOString()
        .split("T")[0];

      // Fetch schedule for current week
      const { data: schedule, error: scheduleError } = await supabase
        .from("schedule")
        .select("schedule_id")
        .eq("business_id", businessId)
        .eq("week_start_date", weekStartDate)
        .single();

      if (schedule && schedule.schedule_id) {
        // Fetch all shifts for this schedule
        const { data: shifts, error: shiftsError } = await supabase
          .from("shift")
          .select(
            `
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
          `,
          )
          .eq("schedule_id", schedule.schedule_id);

        if (shiftsError) throw shiftsError;

        // Calculate statistics
        const today = new Date().toISOString().split("T")[0];
        const uniqueEmployees = new Set();
        let totalHours = 0;
        let todayShifts = 0;
        let overtimeAlerts = 0;
        const employeeHours = {};

        shifts.forEach((shift) => {
          uniqueEmployees.add(shift.employee_id);

          // Calculate hours for this shift
          const startTime = shift.start_time;
          const endTime = shift.end_time;
          const hours = calculateHours(startTime, endTime);
          totalHours += hours;

          // Track employee hours for overtime detection
          if (!employeeHours[shift.employee_id]) {
            employeeHours[shift.employee_id] = 0;
          }
          employeeHours[shift.employee_id] += hours;

          // Check if shift is today
          if (shift.date === today) {
            todayShifts++;
          }
        });

        // Check for overtime (over 40 hours)
        Object.values(employeeHours).forEach((hours) => {
          if (hours > 40) {
            overtimeAlerts++;
          }
        });

        // Calculate unfilled slots (assuming 6 rows x 7 days = 42 total slots)
        const totalSlots = 42; // 6 rows x 7 days
        const unfilledSlots = totalSlots - shifts.length;

        setScheduleStats({
          totalShifts: shifts.length,
          employeesWorking: uniqueEmployees.size,
          totalHours: Math.round(totalHours * 100) / 100,
          todayShifts,
          unfilledSlots,
          overtimeAlerts,
        });

        setCurrentWeekSchedule(shifts);
      } else {
        // No schedule for current week
        setScheduleStats({
          totalShifts: 0,
          employeesWorking: 0,
          totalHours: 0,
          todayShifts: 0,
          unfilledSlots: 42,
          overtimeAlerts: 0,
        });
        setCurrentWeekSchedule([]);
      }
    } catch (err) {
      console.error("Error fetching schedule overview:", err);
      setError("Failed to load schedule overview");
    } finally {
      setLoading(false);
    }
  };

  const calculateHours = (startTime, endTime) => {
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    let diff = endHour * 60 + endMin - (startHour * 60 + startMin);
    if (diff < 0) diff += 24 * 60; // Handle overnight shifts
    return Math.round((diff / 60) * 100) / 100;
  };

  const getCoverageStatus = () => {
    const coveragePercentage = ((42 - scheduleStats.unfilledSlots) / 42) * 100;
    if (coveragePercentage >= 80)
      return {
        status: "Good",
        color: "text-green-600",
        bgColor: "bg-green-100",
      };
    if (coveragePercentage >= 60)
      return {
        status: "Fair",
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
      };
    return { status: "Low", color: "text-red-600", bgColor: "bg-red-100" };
  };

  const coverageStatus = getCoverageStatus();

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-lg border border-blue-100 p-8">
        <div className="animate-pulse">
          <div className="h-5 bg-blue-100 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-blue-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-lg border border-blue-100 p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-blue-900 tracking-tight">
          Schedule Overview
        </h2>
        <div
          className={`px-4 py-1 rounded-full text-base font-semibold ${coverageStatus.bgColor} ${coverageStatus.color}`}
        >
          Coverage: {coverageStatus.status}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
        {statMeta.map((stat) => (
          <div
            key={stat.key}
            className="flex flex-col items-center bg-white rounded-xl shadow border border-blue-50 p-4 gap-2"
          >
            <div>{stat.icon}</div>
            <div className={`text-2xl font-bold ${stat.color}`}>
              {scheduleStats[stat.key]}
            </div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() =>
            (window.location.href = "/business-dashboard/schedule")
          }
          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow"
        >
          View Full Schedule
        </button>

        {scheduleStats.unfilledSlots > 0 && (
          <button className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold shadow">
            Fill Empty Slots
          </button>
        )}

        {scheduleStats.overtimeAlerts > 0 && (
          <button className="px-5 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-semibold shadow">
            Review Overtime
          </button>
        )}

        <button 
          onClick={() => window.location.href = "/business-dashboard/schedule"}
          className="px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-semibold shadow"
        >
          Export Schedule
        </button>
      </div>

      {error && (
        <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      )}
    </div>
  );
};

export default ScheduleOverview;
