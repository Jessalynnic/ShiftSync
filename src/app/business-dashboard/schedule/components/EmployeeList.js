"use client";

import React, { useState, useRef } from "react";
import TooltipPortal from "./TooltipPortal";
import { formatTime } from "../scheduleUtils";

const EmployeeList = ({
  employees,
  selectedRole,
  onRoleChange,
  onEmployeeDrop,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedEmployee, setDraggedEmployee] = useState(null);
  const [hoveredEmpId, setHoveredEmpId] = useState(null);
  const anchorRefs = useRef({});

  const roles = ["All", "Managers", "Employees"];

  const handleDragStart = (e, employee) => {
    setIsDragging(true);
    setDraggedEmployee(employee);
    e.dataTransfer.setData("text/plain", JSON.stringify(employee));

    // custom drag image (just the initials in a blue circle)
    const dragIcon = document.createElement("div");
    dragIcon.style.position = "absolute";
    dragIcon.style.top = "-1000px";
    dragIcon.style.left = "-1000px";
    dragIcon.style.padding = "8px 12px";
    dragIcon.style.background = "#2563eb";
    dragIcon.style.color = "white";
    dragIcon.style.fontWeight = "bold";
    dragIcon.style.borderRadius = "9999px";
    dragIcon.style.fontSize = "14px";
    dragIcon.style.boxShadow = "0 2px 8px rgba(0,0,0,0.12)";
    dragIcon.innerText = `${employee.first_name?.[0] ?? ""}${employee.last_name?.[0] ?? ""}`;
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
    const todayAvailability = employee.availability.find(
      (avail) => avail.day_of_week === today,
    );

    if (todayAvailability) {
      return `Today: ${formatTime(todayAvailability.start_time)} - ${formatTime(todayAvailability.end_time)}`;
    }

    // Show availability summary
    const availableDays = employee.availability.length;
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const availableDayNames = employee.availability
      .map((avail) => dayNames[avail.day_of_week])
      .join(", ");

    return `${availableDays} days: ${availableDayNames}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedRole === "All" ? "All Team Members" : selectedRole} (
            {employees.length})
          </h3>
          <div className="relative">
            <select
              value={selectedRole}
              onChange={(e) => onRoleChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white pr-8"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Drag employees to assign them to shifts
        </p>
      </div>

      <div className="p-4">
        <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-styled relative">
          {employees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg
                className="w-12 h-12 mx-auto text-gray-300 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m13-7a4 4 0 11-8 0 4 4 0 018 0zM5 7a4 4 0 108 0 4 4 0 00-8 0z"
                />
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
                      ? "border-blue-500 bg-blue-50 shadow-lg"
                      : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">
                            {employee.first_name?.[0]}
                            {employee.last_name?.[0]}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900">
                          {employee.first_name} {employee.last_name}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {employee.role_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Hours: {employee.shiftHours || 0}
                      </p>
                    </div>
                    {availabilityText && (
                      <div
                        className="group relative"
                        ref={(el) => {
                          if (el) anchorRefs.current[employee.emp_id] = el;
                        }}
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
                            <div className="text-xs font-medium text-gray-900 mb-2">
                              Weekly Availability
                            </div>
                            <div className="space-y-1">
                              {[
                                "Sun",
                                "Mon",
                                "Tue",
                                "Wed",
                                "Thu",
                                "Fri",
                                "Sat",
                              ].map((dayName, index) => {
                                const dayAvailability =
                                  employee.availability.find(
                                    (avail) =>
                                      Number(avail.day_of_week) === index &&
                                      avail.is_available,
                                  );
                                return (
                                  <div
                                    key={dayName}
                                    className="flex justify-between text-xs"
                                  >
                                    <span className="text-gray-600 w-8">
                                      {dayName}:
                                    </span>
                                    <span
                                      className={
                                        dayAvailability
                                          ? "text-green-600"
                                          : "text-gray-400"
                                      }
                                    >
                                      {dayAvailability
                                        ? `${formatTime(dayAvailability.start_time)} - ${formatTime(dayAvailability.end_time)}`
                                        : "Not available"}
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

export default EmployeeList;
