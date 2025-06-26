"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabaseClient';

export default function EmployeeDashboard() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      // Get employee data
      const { data: employeeData, error } = await supabase
        .from('employee')
        .select(`
          emp_id,
          first_name,
          last_name,
          email_address,
          business_id,
          role_id,
          roles(role_name, is_manager)
        `)
        .eq('user_id', user.id)
        .single();

      if (error || !employeeData) {
        console.error('Error fetching employee data:', error);
        router.push('/login');
        return;
      }

      setEmployee(employeeData);
      setLoading(false);
    };

    checkUser();
  }, [router]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
    } else {
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="#38bdf8" />
                <path d="M13 20a7 7 0 0 1 7-7c2.5 0 4.7 1.36 5.89 3.39" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
                <path d="M27 20a7 7 0 0 1-7 7c-2.5 0-4.7-1.36-5.89-3.39" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
                <circle cx="20" cy="20" r="3" fill="#fff" />
              </svg>
              <span className="ml-2 text-xl font-bold text-blue-700">ShiftSync</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, {employee?.first_name} {employee?.last_name}
              </span>
              <button
                onClick={handleLogout}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Employee Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Employee Info Card */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-4">Employee Information</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Employee ID:</span> {employee?.emp_id}</p>
                <p><span className="font-medium">Name:</span> {employee?.first_name} {employee?.last_name}</p>
                <p><span className="font-medium">Email:</span> {employee?.email_address}</p>
                <p><span className="font-medium">Role:</span> {employee?.roles?.role_name}</p>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-green-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-green-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors">
                  View Schedule
                </button>
                <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors">
                  Clock In/Out
                </button>
                <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors">
                  Request Time Off
                </button>
              </div>
            </div>

            {/* Notifications Card */}
            <div className="bg-yellow-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-yellow-900 mb-4">Notifications</h2>
              <div className="space-y-2">
                <p className="text-sm text-yellow-800">No new notifications</p>
              </div>
            </div>
          </div>

          {/* Coming Soon Message */}
          <div className="mt-8 bg-gray-50 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Employee Dashboard Coming Soon</h3>
            <p className="text-gray-600">
              This is a placeholder dashboard. Full employee features including schedule viewing, 
              time tracking, and shift management will be implemented soon.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
} 