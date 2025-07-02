"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const TooltipPortal = ({ children, anchorRef, visible }) => {
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (anchorRef && visible) {
      const rect = anchorRef.getBoundingClientRect();
      let left = rect.right + window.scrollX + 8; // default: right of anchor
      let top = rect.top + window.scrollY - 8;
      let popoverWidth = 320; // default width, will update after mount
      if (tooltipRef.current) {
        popoverWidth = tooltipRef.current.offsetWidth;
      }
      // If popover would overflow right edge, show to the left
      if (left + popoverWidth > window.innerWidth) {
        left = rect.left + window.scrollX - popoverWidth - 8;
      }
      setCoords({ top, left });
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
    document.body,
  );
};

export default TooltipPortal;
