import { useState } from "react";

const DEFAULT_ROLES = ["Employee", "Manager", "Admin"];
const EMPLOYMENT_TYPES = ["Full-Time", "Part-Time"];

export default function BulkAddEmployeesForm() {
  const [employees, setEmployees] = useState([
    {
      firstName: "",
      lastName: "",
      dob: "",
      email: "",
      role: "",
      ssn: "",
      employmentType: "",
    },
  ]);

  // Format DOB as MM/DD/YYYY
  const handleDobChange = (idx, value) => {
    const digits = value.replace(/\D/g, "");
    let formatted = "";
    if (digits.length <= 2) {
      formatted = digits;
    } else if (digits.length <= 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else if (digits.length <= 8) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    }
    handleChange(idx, "dob", formatted);
  };

  const handleChange = (idx, field, value) => {
    setEmployees((prev) =>
      prev.map((emp, i) => (i === idx ? { ...emp, [field]: value } : emp))
    );
  };

  const handleAddRow = () => {
    setEmployees((prev) => [
      ...prev,
      {
        firstName: "",
        lastName: "",
        dob: "",
        email: "",
        role: "",
        ssn: "",
        employmentType: "",
      },
    ]);
  };

  const handleRemoveRow = (idx) => {
    setEmployees((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // For now, just log the data
    console.log("Employees to add:", employees);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {employees.map((emp, idx) => (
        <div key={idx} className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 flex flex-col gap-2">
          <div className="flex flex-col md:flex-row md:gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-blue-900 mb-1">First Name</label>
              <input
                type="text"
                className="w-full border border-blue-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={emp.firstName}
                onChange={(e) => handleChange(idx, "firstName", e.target.value)}
                placeholder="John"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-blue-900 mb-1">Last Name</label>
              <input
                type="text"
                className="w-full border border-blue-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={emp.lastName}
                onChange={(e) => handleChange(idx, "lastName", e.target.value)}
                placeholder="Smith"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-blue-900 mb-1">Date of Birth</label>
              <input
                type="text"
                className="w-full border border-blue-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={emp.dob}
                onChange={(e) => handleDobChange(idx, e.target.value)}
                placeholder="MM/DD/YYYY"
                maxLength={10}
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-blue-900 mb-1">Email</label>
              <input
                type="email"
                className="w-full border border-blue-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={emp.email}
                onChange={(e) => handleChange(idx, "email", e.target.value)}
                placeholder="email@example.com"
                required
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:gap-4 mt-2 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-blue-900 mb-1">Role</label>
              <select
                className="w-full border border-blue-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={emp.role}
                onChange={(e) => handleChange(idx, "role", e.target.value)}
                required
              >
                <option value="">Select Role</option>
                {DEFAULT_ROLES.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-blue-900 mb-1">Last 4 of SSN</label>
              <input
                type="text"
                className="w-full border border-blue-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={emp.ssn}
                onChange={(e) => handleChange(idx, "ssn", e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="1234"
                maxLength={4}
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-blue-900 mb-1">Employment Type</label>
              <select
                className="w-full border border-blue-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={emp.employmentType}
                onChange={(e) => handleChange(idx, "employmentType", e.target.value)}
                required
              >
                <option value="">Select Employment Type</option>
                {EMPLOYMENT_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => handleRemoveRow(idx)}
              className="text-red-500 hover:text-red-700 px-2 py-1 rounded transition disabled:opacity-50 mt-2 md:mt-0 text-2xl font-bold leading-none"
              disabled={employees.length === 1}
              title="Remove row"
            >
              &times;
            </button>
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAddRow}
          className="bg-blue-100 text-blue-700 font-semibold px-2 py-1 text-sm rounded hover:bg-blue-200 transition"
        >
          + Add Row
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white font-semibold px-3 py-1.5 text-sm rounded hover:bg-blue-700 transition shadow"
        >
          Submit
        </button>
      </div>
    </form>
  );
} 