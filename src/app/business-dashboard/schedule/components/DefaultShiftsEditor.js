"use client";

import React, { useState } from "react";

function DefaultShiftsEditor({ defaultShifts, setDefaultShifts, compact }) {
  const [newShift, setNewShift] = useState({
    title: "",
    startTime: "",
    endTime: "",
  });

  const handleAdd = () => {
    if (newShift.startTime && newShift.endTime) {
      setDefaultShifts([...defaultShifts, { ...newShift }]);
      setNewShift({ title: "", startTime: "", endTime: "" });
    }
  };

  const handleRemove = (idx) => {
    setDefaultShifts(defaultShifts.filter((_, i) => i !== idx));
  };

  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">
          Default Shifts:
        </span>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Title (optional)"
            value={newShift.title}
            onChange={(e) =>
              setNewShift({ ...newShift, title: e.target.value })
            }
            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <input
            type="time"
            value={newShift.startTime}
            onChange={(e) =>
              setNewShift({ ...newShift, startTime: e.target.value })
            }
            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-500">-</span>
          <input
            type="time"
            value={newShift.endTime}
            onChange={(e) =>
              setNewShift({ ...newShift, endTime: e.target.value })
            }
            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={handleAdd}
            disabled={!newShift.startTime || !newShift.endTime}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Default Shifts
      </h3>

      <div className="space-y-3">
        {defaultShifts.map((shift, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium text-gray-900">
                {shift.title
                  ? `${shift.title}: ${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}`
                  : `${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}`}
              </div>
              <div className="text-sm text-gray-500">
                {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
              </div>
            </div>
            <button
              onClick={() => handleRemove(index)}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 border border-gray-200 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Add New Default Shift
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Shift title (optional)"
            value={newShift.title}
            onChange={(e) =>
              setNewShift({ ...newShift, title: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="time"
            placeholder="Start time"
            value={newShift.startTime}
            onChange={(e) =>
              setNewShift({ ...newShift, startTime: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="time"
            placeholder="End time"
            value={newShift.endTime}
            onChange={(e) =>
              setNewShift({ ...newShift, endTime: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleAdd}
            disabled={!newShift.startTime || !newShift.endTime}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Add Shift
          </button>
        </div>
      </div>
    </div>
  );
}

export default DefaultShiftsEditor;
