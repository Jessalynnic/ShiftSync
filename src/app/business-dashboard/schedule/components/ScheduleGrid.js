"use client";

import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { formatTime, isToday } from "../scheduleUtils";

const ScheduleGrid = ({
  employees,
  weekDays,
  employeeAssignments,
  shiftAssignments,
  onDrop,
  onRemoveShift,
  onRemoveEmployee,
  rowCount,
  setRowCount,
  openShiftEditPopover,
  defaultShifts,
  setDefaultShifts,
  editMode,
}) => {
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e, dayKey, rowIndex) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain");
    if (data) {
      try {
        const dropData = JSON.parse(data);

        // Check if it's a shift (has time property) or employee (has first_name property)
        if (dropData.time || dropData.displayTime) {
          onDrop(e, dropData, "shift", dayKey, rowIndex);
        } else if (dropData.first_name) {
          onDrop(e, dropData, "employee", dayKey, rowIndex);
        }
      } catch (error) {
        console.error("Error parsing drop data:", error);
      }
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {weekDays.map((day) => (
              <th
                key={day}
                className={`px-3 py-3 text-center text-sm font-medium min-w-[140px] ${
                  isToday(day)
                    ? "bg-blue-50 border-l-2 border-r-2 border-blue-200 text-blue-900"
                    : "text-gray-700"
                }`}
              >
                <div className="space-y-1">
                  <div
                    className={`text-xs font-normal ${
                      isToday(day) ? "text-blue-600" : "text-gray-500"
                    }`}
                  >
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                  <div
                    className={`text-sm font-semibold ${
                      isToday(day) ? "text-blue-900" : "text-gray-900"
                    }`}
                  >
                    {day.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  {isToday(day) && (
                    <div className="text-xs text-blue-600 font-medium">
                      TODAY
                    </div>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rowCount }, (_, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-gray-100 last:border-b-0"
            >
              {weekDays.map((day) => {
                const dayKey = day.toISOString().split("T")[0];
                const cellId = `${rowIndex}::${dayKey}`;
                const employeeAssignment = employeeAssignments[cellId];
                const shiftAssignment = shiftAssignments[cellId];

                return (
                  <td
                    key={day}
                    data-cell-id={cellId}
                    className={`px-1 py-1 min-h-[80px] ${
                      isToday(day)
                        ? "bg-blue-50 border-l border-r border-blue-100"
                        : ""
                    }`}
                    onDragOver={editMode ? handleDragOver : undefined}
                    onDrop={
                      editMode
                        ? (e) => handleDrop(e, dayKey, rowIndex)
                        : undefined
                    }
                  >
                    <div
                      className={`h-full min-h-[80px] border-2 border-dashed rounded-lg p-2 transition-all hover:border-gray-300 hover:bg-gray-50 ${
                        isToday(day)
                          ? "border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                          : "border-gray-200"
                      }`}
                    >
                      {employeeAssignment && (
                        <div className="bg-blue-100 border border-blue-200 rounded p-1 mb-1 relative">
                          {editMode && onRemoveEmployee && (
                            <button
                              onClick={() => onRemoveEmployee(cellId)}
                              className="absolute top-0.5 right-0.5 w-4 h-4 bg-blue-200 hover:bg-blue-300 rounded-full flex items-center justify-center text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <svg
                                className="w-2.5 h-2.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          )}
                          <div className="text-xs font-medium text-blue-800 pr-4">
                            {employeeAssignment.first_name}{" "}
                            {employeeAssignment.last_name}
                          </div>
                          <div className="text-xs text-blue-600">
                            {employeeAssignment.role_name || "No role"}
                          </div>
                        </div>
                      )}
                      {shiftAssignment && (
                        <div
                          className="bg-green-100 border border-green-200 rounded p-1 relative cursor-pointer flex items-center gap-1 mt-1"
                          onClick={(e) =>
                            openShiftEditPopover(
                              cellId,
                              shiftAssignment,
                              employeeAssignment,
                              dayKey,
                              { current: e.currentTarget },
                            )
                          }
                          title="Edit shift time"
                        >
                          <div>
                            {shiftAssignment.title && (
                              <div className="text-xs text-green-800 font-medium pr-4">
                                {shiftAssignment.title}
                              </div>
                            )}
                            <div className="text-xs text-green-600">
                              {shiftAssignment.startTime &&
                              shiftAssignment.endTime
                                ? `${formatTime(shiftAssignment.startTime)} - ${formatTime(shiftAssignment.endTime)}`
                                : ""}
                            </div>
                          </div>
                          <svg
                            className="w-3 h-3 ml-1 text-green-700"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536M9 11l6 6M3 21h18"
                            />
                          </svg>
                          {editMode && onRemoveShift && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveShift(cellId);
                              }}
                              className="absolute top-0.5 right-0.5 w-4 h-4 bg-green-200 hover:bg-green-300 rounded-full flex items-center justify-center text-green-600 hover:text-green-800 transition-colors"
                              title="Remove shift"
                            >
                              <svg
                                className="w-2.5 h-2.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          )}
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

      {/* Add Row Button */}
      <div className="mt-4 text-center">
        <button
          onClick={() => setRowCount(rowCount + 1)}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
        >
          + Add Row
        </button>
      </div>
    </div>
  );
};

export default ScheduleGrid;
