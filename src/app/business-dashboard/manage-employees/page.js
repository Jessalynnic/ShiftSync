"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import BulkAddEmployeesForm from "./BulkAddEmployeesForm";
import RecentlyAddedEmployeesTable from "./RecentlyAddedEmployeesTable";
import { supabase } from '../../../supabaseClient';
import { getBusinessIdForCurrentUser } from '../roleUtils';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import DashboardFooter from '../components/DashboardFooter';

export default function ManageEmployeesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [massAddOpen, setMassAddOpen] = useState(false);
  
  // Employee management state
  const [allEmployees, setAllEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [availability, setAvailability] = useState([]);
  const [businessId, setBusinessId] = useState(null);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [editTab, setEditTab] = useState('basic');
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  useEffect(() => {
    async function fetchBusinessId() {
      try {
        const bId = await getBusinessIdForCurrentUser();
        setBusinessId(bId);
      } catch (err) {
        setError('Failed to fetch business information.');
      }
    }
    fetchBusinessId();
  }, []);

  // Check if business owner profile is incomplete
  useEffect(() => {
    const checkProfileStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: employee } = await supabase
          .from('employee')
          .select('first_name, last_name, dob, last4ssn')
          .eq('user_id', user.id)
          .single();
        
        if (employee && (
          employee.first_name === 'Business' || 
          employee.last_name === 'Owner' || 
          employee.dob === '1900-01-01' || 
          employee.last4ssn === '0000'
        )) {
          // Check if user has dismissed this message
          const dismissed = localStorage.getItem('manageEmployeesWelcomeDismissed');
          if (!dismissed) {
            setProfileIncomplete(true);
          }
        } else {
          setProfileIncomplete(false);
        }
      }
    };

    checkProfileStatus();
  }, []);

  useEffect(() => {
    if (businessId) {
      fetchAllEmployees();
      fetchRoles();
    }
  }, [businessId]);

  const fetchAllEmployees = async () => {
    if (!businessId) return;
    
    setLoadingEmployees(true);
    try {
      const response = await fetch(`/api/get-employees?businessId=${businessId}&limit=100`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch employees');
      }
      
      setAllEmployees(result.employees || []);
    } catch (err) {
      console.error('Error fetching all employees:', err);
      setError('Failed to load employees.');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchRoles = async () => {
    if (!businessId) return;
    
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('role_id, role_name, is_manager')
        .or(`business_id.eq.${businessId},business_id.is.null`)
        .order('role_name');

      if (error) throw error;

      // Add default roles if not present
      const defaultRoles = [
        { role_id: 1, role_name: 'Business Owner', is_manager: true },
        { role_id: 2, role_name: 'Manager', is_manager: true },
        { role_id: 3, role_name: 'Employee', is_manager: false }
      ];

      const allRoles = [...defaultRoles, ...data];
      const uniqueRoles = allRoles.filter((role, index, self) =>
        index === self.findIndex(r => r.role_id === role.role_id)
      );

      setRoles(uniqueRoles);
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  const getRoleName = (roleId) => {
    const role = roles.find(r => r.role_id === roleId);
    return role ? role.role_name : 'Unknown Role';
  };

  const openEditForm = async (employee) => {
    setEditingEmployee(employee);
    setIsEditing(true);
    
    // Initialize availability for the week
    const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    setAvailability(weekDays.map(day => ({
      day_of_week: day,
      start_time: '',
      end_time: '',
      start_date: '',
      end_date: ''
    })));
  };

  const handleEdit = async () => {
    if (!editingEmployee) return;

    try {
      setLoading(true);
      
      // Update employee details
      const { error: updateError } = await supabase
        .from('employee')
        .update({
          role_id: editingEmployee.role_id,
          first_name: editingEmployee.first_name,
          last_name: editingEmployee.last_name,
          email_address: editingEmployee.email_address,
          last4ssn: editingEmployee.last4ssn,
          dob: editingEmployee.dob,
          full_time: editingEmployee.full_time
        })
        .eq('emp_id', editingEmployee.emp_id);

      if (updateError) throw updateError;

      // Update the employee in the list
      setAllEmployees(prev => 
        prev.map(emp => 
          emp.emp_id === editingEmployee.emp_id ? editingEmployee : emp
        )
      );

      // Log activity: employment type change
      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase
          .from('activity_log')
          .insert({
            business_id: businessId,
            user_id: user?.id || null,
            type: 'edit',
            description: `Changed employment type for ${editingEmployee.first_name} ${editingEmployee.last_name} to ${editingEmployee.full_time ? 'Full-Time' : 'Part-Time'}`,
            employee_id: editingEmployee.emp_id,
            metadata: { field: 'employment_type', new_value: editingEmployee.full_time ? 'Full-Time' : 'Part-Time' }
          });
      } catch (err) {
        console.error('Failed to log activity:', err);
      }

      // Store employee data before clearing it
      const updatedEmployee = { ...editingEmployee };
      const { data: { user } } = await supabase.auth.getUser();

      setIsEditing(false);
      setEditingEmployee(null);
      setAvailability([]);
      
      // Check if this was the business owner updating their profile
      if (user && updatedEmployee && updatedEmployee.user_id === user.id) {
        // This was the business owner updating their profile
        const isProfileComplete = (
          updatedEmployee.first_name !== 'Business' && 
          updatedEmployee.last_name !== 'Owner' && 
          updatedEmployee.dob !== '1900-01-01' && 
          updatedEmployee.last4ssn !== '0000'
        );
        
        if (isProfileComplete) {
          // Profile is now complete, update local state and trigger dashboard refresh
          setProfileIncomplete(false);
          if (typeof window !== 'undefined' && window.refreshProfileStatus) {
            window.refreshProfileStatus();
          }
        }
      }
      
      // Show success message
      alert('Employee updated successfully!');
    } catch (err) {
      console.error('Error updating employee:', err);
      setError('Failed to update employee.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (empId) => {
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('employee')
        .update({ is_active: false })
        .eq('emp_id', empId);

      if (error) throw error;

      // Remove from the list
      setAllEmployees(prev => prev.filter(emp => emp.emp_id !== empId));
      
      alert('Employee deleted successfully!');
    } catch (err) {
      console.error('Error deleting employee:', err);
      setError('Failed to delete employee.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityChange = (index, field, value) => {
    setAvailability(prev => {
      const newAvailability = [...prev];
      newAvailability[index] = { ...newAvailability[index], [field]: value };
      return newAvailability;
    });
  };

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const value = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00`;
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 === 0 ? 12 : hour % 12;
        const displayTime = `${displayHour}:${min.toString().padStart(2, '0')} ${period}`;
        times.push({ value, displayTime });
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  const handleLogout = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setTimeout(() => {
      router.push('/login');
    }, 1500);
  };

  const dismissWelcomeMessage = () => {
    setProfileIncomplete(false);
    localStorage.setItem('manageEmployeesWelcomeDismissed', 'true');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar */}
      <Sidebar pathname={pathname} router={router} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content (with left margin on desktop for sidebar) */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Top Nav Bar */}
        <DashboardHeader title="Manage Employees" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} loading={loading} handleLogout={handleLogout} />

        {/* Page Content */}
        <div className="flex-1 p-6">
          {/* Profile Completion Message for Business Owner */}
          {profileIncomplete && (
            <div className="mb-6">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-2xl">👋</div>
                      <h3 className="font-semibold text-purple-800">Welcome to Employee Management!</h3>
                    </div>
                    <p className="text-purple-700 text-sm mb-3">
                      You can see yourself listed as an employee below. Click the "Edit" button next to your name to update your personal information (name, date of birth, SSN).
                    </p>
                    <div className="text-xs text-purple-600 bg-white bg-opacity-50 rounded px-2 py-1 inline-block">
                      💡 Tip: Complete your profile first, then add your team members!
                    </div>
                  </div>
                  <button 
                    onClick={dismissWelcomeMessage}
                    className="text-purple-600 hover:text-purple-800 ml-4"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Manage Employees</h1>
            <p className="text-gray-600 mt-2">Add, edit, and manage your workforce</p>
          </div>

          {/* Success/Error Messages */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Add Employees Section */}
          <section className="mb-8">
            <button
              className={`flex items-center gap-2 text-base font-medium mb-2 px-3 py-2 rounded-md transition-all shadow-sm border border-blue-200 bg-blue-50 hover:bg-blue-100 focus:outline-none w-full ${massAddOpen ? 'bg-blue-100 border-blue-300' : ''}`}
              onClick={() => setMassAddOpen((open) => !open)}
              aria-expanded={massAddOpen}
              aria-controls="mass-add-panel"
            >
              <span className="flex-1 text-left">Add Employees</span>
              <span className="text-sm text-gray-500">Add single or multiple employees</span>
              <svg
                className={`w-4 h-4 transform transition-transform ${massAddOpen ? 'rotate-90' : 'rotate-0'}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <div
              id="mass-add-panel"
              className={`overflow-hidden transition-all duration-300 ${massAddOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
              {massAddOpen && (
                <div className="bg-white border border-blue-100 rounded-xl shadow p-6 mt-2">
                  <BulkAddEmployeesForm onSuccess={fetchAllEmployees} />
                </div>
              )}
            </div>
          </section>

          {/* Recently Added Employees Section */}
          <section className="mb-8">
            <RecentlyAddedEmployeesTable />
          </section>

          {/* All Employees Section */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">All Employees</h2>
              <button
                onClick={fetchAllEmployees}
                className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Refresh
              </button>
            </div>

            {loadingEmployees ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading employees...</p>
              </div>
            ) : allEmployees.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No employees found.</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allEmployees.map((employee) => (
                        <tr key={employee.emp_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {employee.first_name} {employee.last_name}
                              </div>
                              <div className="text-sm text-gray-500">ID: {employee.emp_id}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {getRoleName(employee.role_id)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {employee.email_address}
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditForm(employee)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteEmployee(employee.emp_id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* Edit Employee Modal */}
          {isEditing && editingEmployee && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-x-hidden">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">Edit Employee</h3>
                      <p className="text-blue-100 text-sm mt-1">
                        Update {editingEmployee.first_name} {editingEmployee.last_name}'s information
                      </p>
                    </div>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-blue-100 hover:text-white transition-colors p-2 rounded-lg hover:bg-blue-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 flex-1 min-w-0 overflow-y-auto">
                  {/* Tabs */}
                  <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                      <button
                        className={`${editTab === 'basic' ? 'border-b-2 border-blue-500 text-blue-600' : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} py-2 px-1 text-sm font-medium`}
                        onClick={() => setEditTab('basic')}
                        type="button"
                      >
                        Basic Information
                      </button>
                      <button
                        className={`${editTab === 'availability' ? 'border-b-2 border-blue-500 text-blue-600' : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} py-2 px-1 text-sm font-medium`}
                        onClick={() => setEditTab('availability')}
                        type="button"
                      >
                        Availability
                      </button>
                      <button
                        className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-400 cursor-not-allowed"
                        type="button"
                        disabled
                      >
                        Advanced Settings
                      </button>
                    </nav>
                  </div>

                  {/* Tab Content */}
                  {editTab === 'basic' && (
                    <div className="space-y-6">
                      {/* Employee ID Display */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                            <p className="text-lg font-semibold text-gray-900 mt-1">{editingEmployee.emp_id}</p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                              editingEmployee.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {editingEmployee.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Role Selection */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Role & Permissions</label>
                        <select
                          value={editingEmployee.role_id}
                          onChange={(e) => setEditingEmployee(prev => ({ ...prev, role_id: parseInt(e.target.value) }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                        >
                          {roles.map((role) => (
                            <option key={role.role_id} value={role.role_id}>
                              {role.role_name} {role.is_manager ? '(Manager)' : ''}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-2">
                          Role determines the employee's permissions and access levels
                        </p>
                      </div>

                      {/* Personal Information */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="text-md font-medium text-gray-900 mb-4">Personal Information</h4>
                        
                        {/* Name Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={editingEmployee.first_name}
                              onChange={(e) => setEditingEmployee(prev => ({ ...prev, first_name: e.target.value }))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter first name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Last Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={editingEmployee.last_name}
                              onChange={(e) => setEditingEmployee(prev => ({ ...prev, last_name: e.target.value }))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter last name"
                            />
                          </div>
                        </div>

                        {/* Email and SSN */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Email Address <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="email"
                              value={editingEmployee.email_address}
                              onChange={(e) => setEditingEmployee(prev => ({ ...prev, email_address: e.target.value }))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="employee@company.com"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Last 4 SSN <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={editingEmployee.last4ssn}
                              onChange={(e) => setEditingEmployee(prev => ({ ...prev, last4ssn: e.target.value }))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="1234"
                              maxLength="4"
                            />
                          </div>
                        </div>

                        {/* Date of Birth */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date of Birth <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={editingEmployee.dob ? editingEmployee.dob.split('T')[0] : ''}
                            onChange={(e) => setEditingEmployee(prev => ({ ...prev, dob: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* Employment Details */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="text-md font-medium text-gray-900 mb-4">Employment Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                            <select
                              value={editingEmployee.full_time ? 'Full-Time' : 'Part-Time'}
                              onChange={e =>
                                setEditingEmployee(prev => ({
                                  ...prev,
                                  full_time: e.target.value === 'Full-Time'
                                }))
                              }
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                            >
                              <option value="Full-Time">Full-Time</option>
                              <option value="Part-Time">Part-Time</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Hire Date</label>
                            <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                              <span className="text-gray-900">
                                {editingEmployee.created_at ? new Date(editingEmployee.created_at).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {editTab === 'availability' && (
                    <div className="space-y-6">
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="text-md font-medium text-gray-900 mb-4">Weekly Availability</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {availability.map((avail, index) => (
                                <tr key={index}>
                                  <td className="px-4 py-2 font-medium text-gray-900">{avail.day_of_week}</td>
                                  <td className="px-4 py-2">
                                    <select
                                      value={avail.start_time}
                                      onChange={e => handleAvailabilityChange(index, 'start_time', e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    >
                                      <option value="">Start Time</option>
                                      {timeOptions.map((time) => (
                                        <option key={time.value} value={time.value}>{time.displayTime}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="px-4 py-2">
                                    <select
                                      value={avail.end_time}
                                      onChange={e => handleAvailabilityChange(index, 'end_time', e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    >
                                      <option value="">End Time</option>
                                      {timeOptions.map((time) => (
                                        <option key={time.value} value={time.value}>{time.displayTime}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="px-4 py-2">
                                    <input
                                      type="date"
                                      value={avail.start_date}
                                      onChange={e => handleAvailabilityChange(index, 'start_date', e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                  </td>
                                  <td className="px-4 py-2">
                                    <input
                                      type="date"
                                      value={avail.end_date}
                                      onChange={e => handleAvailabilityChange(index, 'end_date', e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <p className="text-xs text-gray-500 mt-4">Set the employee's availability for each day of the week. Leave fields blank if not available.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 px-6 pb-8 pt-6 border-t border-gray-200 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <span className="text-red-500">*</span> Required fields
                    </div>
                    <div className="flex gap-3 justify-end min-w-0">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleEdit}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DashboardFooter />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
} 