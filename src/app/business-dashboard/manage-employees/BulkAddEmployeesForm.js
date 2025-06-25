import { useState, useEffect } from "react";
import { getBusinessRoles, getBusinessIdForCurrentUser } from "../roleUtils";
import { addEmployee } from "../employeeUtils";

const EMPLOYMENT_TYPES = ["Full-Time", "Part-Time"];

function validateRow(emp) {
  const errors = {};
  if (!emp.firstName.trim()) errors.firstName = "Required";
  if (!emp.lastName.trim()) errors.lastName = "Required";
  if (!emp.dob.trim()) {
    errors.dob = "Required";
  } else {
    // MM/DD/YYYY
    const dobRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
    if (!dobRegex.test(emp.dob)) errors.dob = "Invalid format";
    else {
      const [mm, dd, yyyy] = emp.dob.split("/").map(Number);
      const date = new Date(yyyy, mm - 1, dd);
      if (
        date.getFullYear() !== yyyy ||
        date.getMonth() !== mm - 1 ||
        date.getDate() !== dd
      ) {
        errors.dob = "Invalid date";
      }
    }
  }
  if (!emp.email.trim()) errors.email = "Required";
  else {
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailRegex.test(emp.email)) errors.email = "Invalid email";
  }
  if (!emp.role) errors.role = "Required";
  if (!emp.ssn.trim()) errors.ssn = "Required";
  else if (!/^\d{4}$/.test(emp.ssn)) errors.ssn = "4 digits";
  if (!emp.employmentType) errors.employmentType = "Required";
  return errors;
}

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
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [rolesError, setRolesError] = useState("");
  const [errors, setErrors] = useState([{}]);
  const [loading, setLoading] = useState(false);
  const [rowStatus, setRowStatus] = useState([]); // {success, error}
  const [businessId, setBusinessId] = useState(null);
  const [globalSuccess, setGlobalSuccess] = useState(false);

  useEffect(() => {
    async function fetchRolesAndBusiness() {
      setLoadingRoles(true);
      setRolesError("");
      try {
        const bId = await getBusinessIdForCurrentUser();
        setBusinessId(bId);
        if (!bId) throw new Error("No business found for user.");
        const data = await getBusinessRoles(bId);
        setRoles(data);
      } catch (err) {
        setRoles([]);
        setRolesError("Failed to fetch roles.");
      } finally {
        setLoadingRoles(false);
      }
    }
    fetchRolesAndBusiness();
  }, []);

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
    setErrors((prev) =>
      prev.map((err, i) => (i === idx ? { ...err, [field]: undefined } : err))
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
    setErrors((prev) => [...prev, {}]);
    setRowStatus((prev) => [...prev, {}]);
  };

  const handleRemoveRow = (idx) => {
    setEmployees((prev) => prev.filter((_, i) => i !== idx));
    setErrors((prev) => prev.filter((_, i) => i !== idx));
    setRowStatus((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setRowStatus([]);
    setGlobalSuccess(false);
    // Validate all rows
    const newErrors = employees.map(validateRow);
    setErrors(newErrors);
    if (newErrors.some((err) => Object.keys(err).length > 0)) {
      setLoading(false);
      return;
    }
    // Submit each row
    const statuses = await Promise.all(
      employees.map(async (emp) => {
        try {
          const res = await addEmployee({ ...emp, businessId });
          if (res.success) return { success: true };
          return { error: res.error || "Failed to add" };
        } catch (err) {
          return { error: err.message || "Failed to add" };
        }
      })
    );
    setRowStatus(statuses);
    setLoading(false);
    // Reset successful rows
    const newEmployees = employees.map((emp, i) =>
      statuses[i].success
        ? { firstName: "", lastName: "", dob: "", email: "", role: "", ssn: "", employmentType: "" }
        : emp
    );
    setEmployees(newEmployees);
    setErrors(statuses.map((s, i) => (statuses[i].success ? {} : errors[i] || {})));
    if (statuses.some((s) => s.success)) {
      setGlobalSuccess(true);
      setTimeout(() => setGlobalSuccess(false), 3000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {globalSuccess && (
        <div className="text-green-700 bg-green-50 border border-green-200 rounded p-2 mb-2 text-center font-medium">
          Employee(s) added successfully!
        </div>
      )}
      {employees.map((emp, idx) => (
        <div key={idx} className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 flex flex-col gap-2">
          <div className="flex flex-col md:flex-row md:gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-blue-900 mb-1">First Name</label>
              <input
                type="text"
                className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 ${errors[idx]?.firstName ? 'border-red-400' : 'border-blue-200'}`}
                value={emp.firstName}
                onChange={(e) => handleChange(idx, "firstName", e.target.value)}
                placeholder="John"
                required
              />
              {errors[idx]?.firstName && <div className="text-xs text-red-500 mt-1">{errors[idx].firstName}</div>}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-blue-900 mb-1">Last Name</label>
              <input
                type="text"
                className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 ${errors[idx]?.lastName ? 'border-red-400' : 'border-blue-200'}`}
                value={emp.lastName}
                onChange={(e) => handleChange(idx, "lastName", e.target.value)}
                placeholder="Smith"
                required
              />
              {errors[idx]?.lastName && <div className="text-xs text-red-500 mt-1">{errors[idx].lastName}</div>}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-blue-900 mb-1">Date of Birth</label>
              <input
                type="text"
                className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 ${errors[idx]?.dob ? 'border-red-400' : 'border-blue-200'}`}
                value={emp.dob}
                onChange={(e) => handleDobChange(idx, e.target.value)}
                placeholder="MM/DD/YYYY"
                maxLength={10}
                required
              />
              {errors[idx]?.dob && <div className="text-xs text-red-500 mt-1">{errors[idx].dob}</div>}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-blue-900 mb-1">Email</label>
              <input
                type="email"
                className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 ${errors[idx]?.email ? 'border-red-400' : 'border-blue-200'}`}
                value={emp.email}
                onChange={(e) => handleChange(idx, "email", e.target.value)}
                placeholder="email@example.com"
                required
              />
              {errors[idx]?.email && <div className="text-xs text-red-500 mt-1">{errors[idx].email}</div>}
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:gap-4 mt-2 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-blue-900 mb-1">Role</label>
              <select
                className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 ${errors[idx]?.role ? 'border-red-400' : 'border-blue-200'}`}
                value={emp.role}
                onChange={(e) => handleChange(idx, "role", e.target.value)}
                required
                disabled={loadingRoles}
              >
                <option value="">{loadingRoles ? "Loading roles..." : "Select Role"}</option>
                {roles.map((role) => (
                  <option key={role.role_id} value={role.role_id}>{role.role_name}</option>
                ))}
              </select>
              {rolesError && <div className="text-xs text-red-500 mt-1">{rolesError}</div>}
              {errors[idx]?.role && <div className="text-xs text-red-500 mt-1">{errors[idx].role}</div>}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-blue-900 mb-1">Last 4 of SSN</label>
              <input
                type="text"
                className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 ${errors[idx]?.ssn ? 'border-red-400' : 'border-blue-200'}`}
                value={emp.ssn}
                onChange={(e) => handleChange(idx, "ssn", e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="1234"
                maxLength={4}
                required
              />
              {errors[idx]?.ssn && <div className="text-xs text-red-500 mt-1">{errors[idx].ssn}</div>}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-blue-900 mb-1">Employment Type</label>
              <select
                className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 ${errors[idx]?.employmentType ? 'border-red-400' : 'border-blue-200'}`}
                value={emp.employmentType}
                onChange={(e) => handleChange(idx, "employmentType", e.target.value)}
                required
              >
                <option value="">Select Employment Type</option>
                {EMPLOYMENT_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors[idx]?.employmentType && <div className="text-xs text-red-500 mt-1">{errors[idx].employmentType}</div>}
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
          {rowStatus[idx]?.error && (
            <div className="text-red-600 text-xs mt-2">{rowStatus[idx].error}</div>
          )}
        </div>
      ))}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAddRow}
          className="bg-blue-100 text-blue-700 font-semibold px-2 py-1 text-sm rounded hover:bg-blue-200 transition"
          disabled={loading}
        >
          + Add Row
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white font-semibold px-3 py-1.5 text-sm rounded hover:bg-blue-700 transition shadow"
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </div>
    </form>
  );
} 