"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { formatTime } from "../scheduleUtils";

function ShiftSelectionPopover({
  open,
  anchorRef,
  onClose,
  onConfirm,
  employee,
  dayKey,
  defaultShifts,
}) {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [title, setTitle] = useState("");
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const popoverRef = useRef(null);

  useEffect(() => {
    if (anchorRef && open) {
      // Handle both ref objects and direct DOM elements
      const element = anchorRef.current || anchorRef;
      if (element && element.getBoundingClientRect) {
        const rect = element.getBoundingClientRect();
        let left = rect.right + window.scrollX + 8; // default: right of anchor
        let top = rect.top + window.scrollY - 8;
        let popoverWidth = 320; // default width, will update after mount
        if (popoverRef.current) {
          popoverWidth = popoverRef.current.offsetWidth;
        }
        // If popover would overflow right edge, show to the left
        if (left + popoverWidth > window.innerWidth) {
          left = rect.left + window.scrollX - popoverWidth - 8;
        }
        setCoords({ top, left });
      }
    }
  }, [anchorRef, open]);

  function handleKey(e) {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Enter") {
      handleConfirm();
    }
  }

  function handleConfirm() {
    if (startTime && endTime) {
      const shift = {
        startTime,
        endTime,
      };
      if (title.trim()) {
        shift.title = title;
      }
      onConfirm(shift);
    }
  }

  function handleDefaultShiftClick(shift) {
    setStartTime(shift.startTime);
    setEndTime(shift.endTime);
    setTitle(shift.title || `${shift.startTime} - ${shift.endTime}`);
  }

  if (!open) return null;

  return createPortal(
    <div
      ref={popoverRef}
      style={{
        position: "absolute",
        top: coords.top,
        left: coords.left,
        zIndex: 9999,
      }}
      className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80"
      onKeyDown={handleKey}
      tabIndex={0}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Assign Shift</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ×
        </button>
      </div>

      {employee && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
              {employee.first_name?.[0]}
              {employee.last_name?.[0]}
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {employee.first_name} {employee.last_name}
              </div>
              <div className="text-sm text-gray-600">
                {employee.role === "manager" ? "Manager" : "Employee"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Default Shifts */}
      {defaultShifts && defaultShifts.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Select:
          </label>
          <div className="flex flex-wrap gap-2">
            {defaultShifts.map((shift, index) => (
              <button
                key={index}
                onClick={() => handleDefaultShiftClick(shift)}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                {shift.title}: {formatTime(shift.startTime)} -{" "}
                {formatTime(shift.endTime)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom Shift Input */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Shift Title (optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Morning Shift, Lunch Rush"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={!startTime || !endTime}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Assign
        </button>
      </div>
    </div>,
    document.body,
  );
}

export default ShiftSelectionPopover;
