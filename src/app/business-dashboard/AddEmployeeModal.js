import { useState, useEffect } from "react";
import { getBusinessRoles } from "./roleUtils";
import { addEmployee } from "./employeeUtils";

export default function AddEmployeeModal({ open, onClose, businessId }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [ssn, setSsn] = useState("");
  const [role, setRole] = useState("");
  const [roles, setRoles] = useState([]);
  const [employmentType, setEmploymentType] = useState("");
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [rolesError, setRolesError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open && businessId) {
      setLoadingRoles(true);
      setRolesError("");
      getBusinessRoles(businessId)
        .then((data) => setRoles(data))
        .catch(() => {
          setRoles([]);
          setRolesError("Failed to fetch roles.");
        })
        .finally(() => setLoadingRoles(false));
    }
  }, [open, businessId]);

  // Format DOB as MM/DD/YYYY
  const handleDobChange = (e) => {
    const text = e.target.value;
    const digits = text.replace(/\D/g, "");
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
    setDob(formatted);
  };

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setDob("");
    setEmail("");
    setSsn("");
    setRole("");
    setEmploymentType("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    const result = await addEmployee({
      firstName,
      lastName,
      dob,
      email,
      ssn,
      role,
      employmentType,
      businessId,
    });
    setLoading(false);
    if (result.success) {
      setSuccess(true);
      resetForm();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } else {
      setError(result.error || "Failed to add employee.");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 relative animate-fadeIn">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold text-blue-800 mb-2">Add Employee</h2>
        <div className="h-1 w-16 bg-blue-200 rounded mb-6" />
        {success && (
          <div className="mb-4 p-3 rounded bg-green-50 text-green-700 border border-green-200 text-center">
            ✅ Employee added successfully! Onboarding email sent to {email}.
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded bg-red-50 text-red-700 border border-red-200 text-center">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                First Name
              </label>
              <input
                className="w-full border border-blue-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Last Name
              </label>
              <input
                className="w-full border border-blue-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Smith"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Date of Birth
              </label>
              <input
                className="w-full border border-blue-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="MM/DD/YYYY"
                value={dob}
                onChange={handleDobChange}
                maxLength={10}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                className="w-full border border-blue-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Role
              </label>
              <select
                className="w-full border border-blue-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-100"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                disabled={loadingRoles}
              >
                <option value="">
                  {loadingRoles ? "Loading roles..." : "Select Role"}
                </option>
                {roles.map((r) => (
                  <option key={r.role_id} value={r.role_id}>
                    {r.role_name}
                  </option>
                ))}
              </select>
              {rolesError && (
                <div className="text-xs text-red-500 mt-1">{rolesError}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Last 4 of SSN
              </label>
              <input
                className="w-full border border-blue-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="1234"
                value={ssn}
                onChange={(e) =>
                  setSsn(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                maxLength={4}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Employment Type
              </label>
              <select
                className="w-full border border-blue-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                required
              >
                <option value="">Select Employment Type</option>
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              className="bg-gray-100 hover:bg-gray-200 text-blue-700 font-semibold px-5 py-2 rounded-lg shadow-sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg shadow flex items-center gap-2"
              disabled={loading}
            >
              {loading && (
                <span className="loader border-2 border-t-2 border-blue-200 border-t-blue-600 rounded-full w-4 h-4 animate-spin"></span>
              )}
              Add Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
