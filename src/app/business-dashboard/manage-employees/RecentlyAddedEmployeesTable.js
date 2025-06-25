"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { getBusinessIdForCurrentUser } from '../roleUtils';

export default function RecentlyAddedEmployeesTable() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [businessId, setBusinessId] = useState(null);
  const [sendingOnboarding, setSendingOnboarding] = useState({});

  useEffect(() => {
    async function fetchBusinessId() {
      try {
        const bId = await getBusinessIdForCurrentUser();
        setBusinessId(bId);
      } catch (err) {
        setError('Failed to fetch business information.');
        setLoading(false);
      }
    }
    fetchBusinessId();
  }, []);

  useEffect(() => {
    if (!businessId) return;

    async function fetchRecentEmployees() {
      setLoading(true);
      setError('');
      
      try {
        const response = await fetch(`/api/get-employees?businessId=${businessId}`);
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch employees');
        }
        
        setEmployees(result.employees || []);
      } catch (err) {
        console.error('Error fetching employees:', err);
        setError('Failed to load recent employees.');
      } finally {
        setLoading(false);
      }
    }

    fetchRecentEmployees();
  }, [businessId]);

  const sendOnboardingEmail = async (employee) => {
    setSendingOnboarding(prev => ({ ...prev, [employee.emp_id]: true }));
    
    try {
      // Generate temp password using the same logic as add-employee API
      const dobDigits = employee.dob?.replace(/\D/g, '') || '';
      const tempPassword = `${dobDigits.slice(2, 4)}${dobDigits.slice(0, 2)}${dobDigits.slice(4, 6)}${employee.last4ssn}`;
      
      const response = await fetch('/api/send-onboarding-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: employee.first_name,
          email_address: employee.email_address,
          emp_id: employee.emp_id,
          temp_password: tempPassword
          // business_name will be fetched by the API route
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setEmployees(prev => prev.map(emp => 
          emp.emp_id === employee.emp_id 
            ? { ...emp, onboarding_sent: true }
            : emp
        ));
      } else {
        alert('Failed to send onboarding email: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error sending onboarding email:', err);
      alert('Failed to send onboarding email');
    } finally {
      setSendingOnboarding(prev => ({ ...prev, [employee.emp_id]: false }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDOB = (dob) => {
    if (!dob) return 'N/A';
    return new Date(dob).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="rounded-lg bg-white shadow-sm">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border rounded-lg bg-white shadow-sm">
        <div className="p-6">
          <div className="text-red-600 text-center">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recently Added Employees</h3>
        <p className="text-sm text-gray-500 mt-1">Latest 10 employees added to your business</p>
      </div>
      
      {employees.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <p>No employees found. Add your first employee to get started!</p>
        </div>
      ) : (
        <div className="overflow-x-auto scrollbar-styled">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email Confirmed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Onboarding Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Added
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((employee) => (
                <tr key={employee.emp_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {employee.first_name?.[0]}{employee.last_name?.[0]}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.first_name} {employee.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {employee.emp_id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{employee.email_address}</div>
                    <div className="text-sm text-gray-500">SSN: ••••{employee.last4ssn}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{employee.roles?.role_name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">
                      {employee.full_time ? 'Full-Time' : 'Part-Time'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      employee.email_confirmed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {employee.email_confirmed ? 'Confirmed' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {employee.onboarding_sent ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        Sent
                      </span>
                    ) : (
                      <button
                        onClick={() => sendOnboardingEmail(employee)}
                        disabled={sendingOnboarding[employee.emp_id]}
                        className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 hover:bg-orange-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingOnboarding[employee.emp_id] ? 'Sending...' : 'Send'}
                      </button>
                    )}
                    {employee.onboarding_sent && (
                      <button
                        onClick={() => sendOnboardingEmail(employee)}
                        disabled={sendingOnboarding[employee.emp_id]}
                        className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingOnboarding[employee.emp_id] ? 'Sending...' : 'Resend'}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      employee.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {employee.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(employee.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 