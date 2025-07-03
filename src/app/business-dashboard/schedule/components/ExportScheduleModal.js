import React, { useState } from 'react';
import { 
  exportScheduleToCSV, 
  downloadCSV, 
  generateScheduleSummary 
} from '../scheduleUtils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ExportScheduleModal = ({ 
  isOpen, 
  onClose, 
  employeeAssignments, 
  shiftAssignments, 
  dates, 
  employees,
  currentWeek 
}) => {
  const [exportFormat, setExportFormat] = useState('csv');
  const [includeSummary, setIncludeSummary] = useState(true);
  const [exporting, setExporting] = useState(false);

  if (!isOpen) return null;

  // Debug logging
  console.log('ExportScheduleModal: employeeAssignments', employeeAssignments);
  console.log('ExportScheduleModal: shiftAssignments', shiftAssignments);
  console.log('ExportScheduleModal: dates', dates);
  console.log('ExportScheduleModal: employees', employees);

  const handleExport = async () => {
    setExporting(true);
    try {
      const weekStart = dates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const weekEnd = dates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const filename = `schedule_${weekStart}-${weekEnd}`;

      if (exportFormat === 'pdf') {
        // PDF export logic
        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        let y = 40;
        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(28);
        doc.text('Schedule', pageWidth / 2, y, { align: 'center' });
        y += 30;
        // Week of (full range)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        const pdfWeekStart = dates[0].toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        const pdfWeekEnd = dates[6].toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        const weekOf = `WEEK OF: ${pdfWeekStart} - ${pdfWeekEnd}`;
        doc.text(weekOf, 60, y);
        y += 20;
        // Table header with days and dates
        const days = dates.map(date => {
          const dayStr = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
          const dateStr = date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
          return `${dayStr} ${dateStr}`;
        });
        const tableHead = [['NAME', ...days]];
        // Table body with shifts
        const dayKeys = dates.map(date => date.toISOString().split('T')[0]);
        function formatTime(timeStr) {
          if (!timeStr) return '';
          const [hour, minute] = timeStr.split(':');
          const date = new Date();
          date.setHours(Number(hour), Number(minute));
          return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }
        const tableBody = employees.map(emp => {
          const row = [`${emp.first_name} ${emp.last_name}`];
          dayKeys.forEach(dayKey => {
            const cellId = Object.keys(employeeAssignments).find(cid => {
              const assigned = employeeAssignments[cid];
              return assigned && assigned.emp_id === emp.emp_id && cid.endsWith(dayKey);
            });
            if (cellId && shiftAssignments[cellId]) {
              const shift = shiftAssignments[cellId];
              let shiftStr = '';
              if (typeof shift === 'string') {
                shiftStr = shift;
              } else if (shift && shift.startTime && shift.endTime) {
                const start = formatTime(shift.startTime);
                const end = formatTime(shift.endTime);
                shiftStr = `${start} - ${end}`;
                if (shift.title) shiftStr += ` (${shift.title})`;
              }
              row.push(shiftStr);
            } else if (cellId) {
              row.push('OFF');
            } else {
              row.push('');
            }
          });
          return row;
        });
        // Dynamically calculate column widths to fit page
        const leftMargin = 60;
        const rightMargin = 80;
        const numCols = 8; // 1 name + 7 days
        const availableWidth = pageWidth - leftMargin - rightMargin;
        const colWidth = availableWidth / numCols;
        // Table
        autoTable(doc, {
          head: tableHead,
          body: tableBody,
          startY: y,
          theme: 'grid',
          headStyles: { fillColor: [243, 244, 246], textColor: 60, fontStyle: 'bold', halign: 'center' },
          bodyStyles: { halign: 'center', valign: 'middle', fontSize: 9 },
          columnStyles: {
            0: { halign: 'left', cellWidth: colWidth },
            1: { cellWidth: colWidth },
            2: { cellWidth: colWidth },
            3: { cellWidth: colWidth },
            4: { cellWidth: colWidth },
            5: { cellWidth: colWidth },
            6: { cellWidth: colWidth },
            7: { cellWidth: colWidth },
          },
          styles: { font: 'helvetica', fontSize: 9, cellPadding: 6 },
          margin: { left: leftMargin, right: rightMargin },
          tableWidth: 'wrap',
        });
        // Notes/Summary section
        let finalY = doc.lastAutoTable.finalY + 20;
        const summary = generateScheduleSummary(employeeAssignments, shiftAssignments, dates);
        // Dynamically calculate the height needed for the summary box
        let summaryLines = 4; // Total Shifts, Total Hours, label, and at least one employee
        summaryLines += Object.values(summary.employeeHours).length;
        const notesBoxHeight = 32 + summaryLines * 14 + 16; // 32 for header and spacing, 14 per line, 16 for padding
        // Draw notes box
        doc.setFillColor(243, 244, 246);
        doc.rect(40, finalY, pageWidth - 80, notesBoxHeight, 'F');
        doc.setDrawColor(180);
        doc.rect(40, finalY, pageWidth - 80, notesBoxHeight);
        // Section label
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text('SCHEDULE SUMMARY', 50, finalY + 18);
        // Summary content
        doc.setFontSize(11);
        let notesY = finalY + 38;
        doc.text(`Total Shifts: ${summary.totalShifts}`, 60, notesY);
        notesY += 16;
        doc.text(`Total Hours: ${summary.totalHours.toFixed(2)}`, 60, notesY);
        notesY += 20;
        doc.setFont('helvetica', 'bold');
        doc.text('EMPLOYEE BREAKDOWN:', 60, notesY);
        doc.setFont('helvetica', 'normal');
        notesY += 14;
        Object.values(summary.employeeHours).forEach(emp => {
          doc.text(`${emp.name}: ${emp.hours.toFixed(2)} hrs, ${emp.shifts} shifts`, 70, notesY);
          notesY += 14;
        });
        // Save file
        const filename = `schedule_${pdfWeekStart}-${pdfWeekEnd}.pdf`;
        doc.save(filename);
      }
      
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const getAssignmentCount = () => {
    return Object.keys(employeeAssignments).length;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Export Schedule
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Schedule Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-2">Schedule Details</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Week:</span>
                  <div className="text-gray-700">
                    {dates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {dates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Assignments:</span>
                  <div className="text-gray-700">{getAssignmentCount()}</div>
                </div>
              </div>
            </div>

            {/* Export Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Format
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="pdf"
                    checked={exportFormat === 'pdf'}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">PDF (Weekly Work Schedule)</span>
                </label>
              </div>
            </div>

            {/* Include Summary */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeSummary}
                  onChange={(e) => setIncludeSummary(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  Include summary with employee hours and breakdown
                </span>
              </label>
            </div>

            {/* Export Preview */}
            {getAssignmentCount() > 0 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-800">
                  <div className="font-medium mb-1">Export Preview:</div>
                  <div>• {getAssignmentCount()} shift assignments</div>
                  <div>• {Object.keys(employeeAssignments).length} employees scheduled</div>
                  {includeSummary && (
                    <div>• Summary with hours breakdown</div>
                  )}
                </div>
              </div>
            )}

            {getAssignmentCount() === 0 && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="text-sm text-yellow-800">
                  <div className="font-medium mb-1">No assignments to export</div>
                  <div>Create some schedule assignments before exporting.</div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={exporting || getAssignmentCount() === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {exporting ? 'Exporting...' : 'Export Schedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportScheduleModal; 