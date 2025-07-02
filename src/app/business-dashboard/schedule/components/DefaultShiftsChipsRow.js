"use client";

import React from "react";

function DefaultShiftsChipsRow({ defaultShifts, setDefaultShifts }) {
  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (defaultShifts.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-end gap-2 mb-4">
      <div className="flex flex-wrap gap-2">
        {defaultShifts.map((shift, index) => (
          <div
            key={index}
            className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
          >
            <span>
              {shift.title
                ? `${shift.title}: ${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}`
                : `${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}`}
            </span>
            <button
              onClick={() =>
                setDefaultShifts(defaultShifts.filter((_, i) => i !== index))
              }
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DefaultShiftsChipsRow;
