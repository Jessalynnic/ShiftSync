"use client";

import React from "react";
import { createPortal } from "react-dom";

const ConflictNotification = ({
  show,
  message,
  onConfirm,
  onCancel,
  onDismiss,
}) => {
  if (!show) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-white border border-red-200 rounded-lg shadow-lg">
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Availability Conflict
              </h3>
              <p className="text-sm text-red-700 mt-1">{message}</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={onCancel}
                  className="text-xs px-3 py-1 text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="text-xs px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                >
                  Assign Anyway
                </button>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="ml-2 flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
            >
              <svg
                className="w-4 h-4"
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
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ConflictNotification;
