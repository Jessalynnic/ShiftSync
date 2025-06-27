"use client";
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import AddEmployeeModal from './AddEmployeeModal';
import { getBusinessIdForCurrentUser } from './roleUtils';
import Sidebar from './components/Sidebar';
import DashboardHeader from './components/DashboardHeader';
import DashboardFooter from './components/DashboardFooter';

// Placeholder SVG icons (Heroicons/Material)
const UsersIcon = () => (
  <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m13-7a4 4 0 11-8 0 4 4 0 018 0zM5 7a4 4 0 108 0 4 4 0 00-8 0z" /></svg>
);
const CalendarIcon = () => (
  <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
);
const HourglassIcon = () => (
  <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const MegaphoneIcon = () => (
  <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
  </svg>
);

function OverviewCard({ title, value, icon, loading = false }) {
  return (
    <div className="flex items-center gap-4 bg-white rounded-2xl shadow p-6 min-w-[180px]">
      <div>{icon}</div>
      <div>
        <div className="text-2xl font-bold text-blue-800">
          {loading ? (
            <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
          ) : (
            value
          )}
        </div>
        <div className="text-blue-500 text-sm font-medium">{title}</div>
      </div>
    </div>
  );
}

function ActivityIcon({ type }) {
  if (type === 'add') return (
    <span className="inline-flex w-6 h-6 bg-green-100 text-green-600 rounded-full items-center justify-center">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    </span>
  );
  if (type === 'edit') return (
    <span className="inline-flex w-6 h-6 bg-blue-100 text-blue-600 rounded-full items-center justify-center">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    </span>
  );
  if (type === 'delete') return (
    <span className="inline-flex w-6 h-6 bg-red-100 text-red-600 rounded-full items-center justify-center">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
      </svg>
    </span>
  );
  if (type === 'email') return (
    <span className="inline-flex w-6 h-6 bg-yellow-100 text-yellow-600 rounded-full items-center justify-center">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    </span>
  );
  // Fallback: clock icon for unknown types
  return (
    <span className="inline-flex w-6 h-6 bg-gray-100 text-gray-400 rounded-full items-center justify-center">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
      </svg>
    </span>
  );
}

function RecentActivitiesSection({ businessId }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!businessId) return;
    setLoading(true);
    setError('');
    async function fetchActivities() {
      try {
        const res = await fetch(`/api/activity-log?businessId=${businessId}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to fetch activities');
        setActivities(data.activities || []);
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError(err.message || 'Failed to load activities.');
      } finally {
        setLoading(false);
      }
    }
    fetchActivities();
  }, [businessId]);

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Recent Activities</h2>
        <a href="/activity-log" className="text-blue-600 text-sm hover:underline">View All</a>
      </div>
      {loading ? (
        <div className="text-gray-500 text-sm py-8 text-center">Loading activities...</div>
      ) : error ? (
        <div className="text-red-500 text-sm py-8 text-center">{error}</div>
      ) : activities.length === 0 ? (
        <div className="text-gray-500 text-sm py-8 text-center">No recent activities.</div>
      ) : (
        <div className="max-h-80 overflow-y-auto">
          <ul className="space-y-4">
            {activities.slice(0, 4).map(activity => (
              <li key={activity.id} className="flex items-start gap-3">
                <ActivityIcon type={activity.type} />
                <div>
                  <div className="text-sm text-gray-900">{activity.description}</div>
                  <div className="text-xs text-gray-500">{new Date(activity.created_at).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</div>
                </div>
              </li>
            ))}
          </ul>
          {activities.length > 4 && (
            <div className="text-center mt-4 pt-4 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                Showing 4 of {activities.length} activities
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default function BusinessDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addEmpModalOpen, setAddEmpModalOpen] = useState(false);
  const [businessId, setBusinessId] = useState(null);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  const [showProfileCompletionBanner, setShowProfileCompletionBanner] = useState(false);
  const [showProfileSuccessBanner, setShowProfileSuccessBanner] = useState(false);

  // Check if user needs to complete profile
  useEffect(() => {
    const checkProfileCompletion = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check if employee profile is complete (has real name, DOB, SSN)
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
          // Profile is incomplete, show completion banner (unless dismissed)
          const dismissed = localStorage.getItem('profileCompletionDismissed');
          if (!dismissed) {
            setShowProfileCompletionBanner(true);
          }
          setShowProfileSuccessBanner(false);
        } else if (employee && employeeCount === 1) {
          // Profile is complete but only has 1 employee (themselves), show welcome banner (unless dismissed)
          const dismissed = localStorage.getItem('welcomeBannerDismissed');
          if (!dismissed) {
            setShowWelcomeBanner(true);
          }
          setShowProfileCompletionBanner(false);
          setShowProfileSuccessBanner(false);
        } else {
          // Profile is complete and has multiple employees, hide all banners
          setShowWelcomeBanner(false);
          setShowProfileCompletionBanner(false);
          setShowProfileSuccessBanner(false);
        }
      }
    };

    checkProfileCompletion();
  }, [employeeCount]);

  // Auto-hide success banner after 5 seconds
  useEffect(() => {
    if (showProfileSuccessBanner) {
      const timer = setTimeout(() => {
        setShowProfileSuccessBanner(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showProfileSuccessBanner]);

  useEffect(() => {
    getBusinessIdForCurrentUser().then(setBusinessId);
  }, []);

  useEffect(() => {
    if (!businessId) return;

    async function fetchEmployeeCount() {
      setLoadingCount(true);
      try {
        const response = await fetch(`/api/get-employee-count?businessId=${businessId}`);
        const result = await response.json();
        
        if (result.success) {
          setEmployeeCount(result.count);
        } else {
          console.error('Failed to fetch employee count:', result.error);
        }
      } catch (err) {
        console.error('Error fetching employee count:', err);
      } finally {
        setLoadingCount(false);
      }
    }

    fetchEmployeeCount();
  }, [businessId]);

  const refreshEmployeeCount = async () => {
    if (!businessId) return;
    
    try {
      const response = await fetch(`/api/get-employee-count?businessId=${businessId}`);
      const result = await response.json();
      
      if (result.success) {
        setEmployeeCount(result.count);
      }
    } catch (err) {
      console.error('Error refreshing employee count:', err);
    }
  };

  // Function to refresh profile status (can be called from other components)
  const refreshProfileStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: employee } = await supabase
        .from('employee')
        .select('first_name, last_name, dob, last4ssn')
        .eq('user_id', user.id)
        .single();
      
      if (employee) {
        const isIncomplete = (
          employee.first_name === 'Business' || 
          employee.last_name === 'Owner' || 
          employee.dob === '1900-01-01' || 
          employee.last4ssn === '0000'
        );
        
        if (!isIncomplete) {
          // Profile is now complete, show success banner
          setShowProfileCompletionBanner(false);
          setShowProfileSuccessBanner(true);
        }
      }
    }
  };

  // Expose the function globally so other components can call it
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.refreshProfileStatus = refreshProfileStatus;
    }
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSuccess(true);
    setTimeout(() => {
      router.push('/login');
    }, 1500);
  };

  // Dismiss functions
  const dismissProfileCompletion = () => {
    setShowProfileCompletionBanner(false);
    localStorage.setItem('profileCompletionDismissed', 'true');
  };

  const dismissWelcomeBanner = () => {
    setShowWelcomeBanner(false);
    localStorage.setItem('welcomeBannerDismissed', 'true');
  };

  const dismissProfileSuccess = () => {
    setShowProfileSuccessBanner(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar */}
      <Sidebar pathname={pathname} router={router} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content (with left margin on desktop for sidebar) */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Top Nav Bar */}
        <DashboardHeader title="Dashboard" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} loading={loading} handleLogout={handleLogout} />

        {/* Profile Completion Banner for New Users */}
        {showProfileCompletionBanner && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-400 p-6 mx-6 mt-6 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">🎯</div>
                  <h3 className="text-lg font-semibold text-purple-800">
                    Complete Your Profile!
                  </h3>
                </div>
                <p className="text-purple-700 mb-4">
                  Welcome to ShiftSync! To get started, please update your employee profile with your personal information.
                </p>
                <div className="bg-white p-4 rounded-lg border border-purple-200 mb-4">
                  <h4 className="font-medium text-purple-800 mb-2">📝 What You Need to Update:</h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• Your full name (first and last)</li>
                    <li>• Date of birth</li>
                    <li>• Last 4 digits of your SSN</li>
                  </ul>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => router.push('/business-dashboard/manage-employees')}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Update My Profile
                  </button>
                  <button 
                    onClick={dismissProfileCompletion}
                    className="text-purple-600 hover:text-purple-800 px-4 py-2 text-sm font-medium transition-colors"
                  >
                    I'll do this later
                  </button>
                </div>
              </div>
              <button 
                onClick={dismissProfileCompletion}
                className="text-purple-600 hover:text-purple-800 ml-4"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Profile Success Banner */}
        {showProfileSuccessBanner && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400 p-6 mx-6 mt-6 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">🎉</div>
                  <h3 className="text-lg font-semibold text-green-800">
                    Profile Updated Successfully!
                  </h3>
                </div>
                <p className="text-green-700 mb-4">
                  Great job! Your profile is now complete. You're all set to start managing your team with ShiftSync.
                </p>
                <div className="bg-white p-4 rounded-lg border border-green-200 mb-4">
                  <h4 className="font-medium text-green-800 mb-2">🚀 What's Next:</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Add your first employee to start building your team</li>
                    <li>• Set up employee roles and permissions</li>
                    <li>• Start managing schedules and shifts</li>
                    <li>• Enjoy the full power of ShiftSync!</li>
                  </ul>
                </div>
              </div>
              <button 
                onClick={dismissProfileSuccess}
                className="text-green-600 hover:text-green-800 ml-4"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Welcome Banner for New Users */}
        {showWelcomeBanner && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-l-4 border-green-400 p-6 mx-6 mt-6 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  🎉 Welcome to ShiftSync!
                </h3>
                <p className="text-green-700 mb-4">
                  Your business account is now fully set up! Here's what you can do next:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-white p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">👥 Add Your First Employee</h4>
                    <p className="text-sm text-green-600 mb-3">
                      Start building your team by adding employees to your business.
                    </p>
                    <button 
                      onClick={() => setAddEmpModalOpen(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Add Employee
                    </button>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">🔐 Set Up Roles</h4>
                    <p className="text-sm text-green-600 mb-3">
                      Create different roles and permissions for your team members.
                    </p>
                    <button 
                      onClick={() => router.push('/business-dashboard/manage-employees')}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Manage Roles
                    </button>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">💡 Pro Tips</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• You can log in with either your business email or Employee ID</li>
                    <li>• Send new employees onboarding emails with their employee ID and default passwords</li>
                    <li>• Employees can change their passwords after first login</li>
                    <li>• Use the dashboard to monitor employee activity and manage your team</li>
                  </ul>
                </div>
              </div>
              <button 
                onClick={dismissWelcomeBanner}
                className="text-green-600 hover:text-green-800 ml-4"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="flex-1 p-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <OverviewCard title="Total Employees" value={employeeCount} icon={<UsersIcon />} loading={loadingCount} />
            <OverviewCard title="Upcoming Shifts" value="8" icon={<CalendarIcon />} />
            <OverviewCard title="Pending Requests" value="3" icon={<HourglassIcon />} />
            <OverviewCard title="Announcements" value="2" icon={<MegaphoneIcon />} />
          </div>

          {/* Main Content Grid */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column */}
            <section className="flex-1 flex flex-col gap-8">
              {/* Recent Activities Section */}
              <RecentActivitiesSection businessId={businessId} />

              {/* Schedule Overview */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xl font-bold text-blue-800">Schedule Overview</span>
                  <button className="text-blue-600 hover:underline">View Calendar</button>
                </div>
                <div className="text-blue-700 text-center py-8">(Calendar or upcoming shifts will appear here.)</div>
              </div>
            </section>
            {/* Right Column */}
            <aside className="w-full lg:w-1/3 flex flex-col gap-8">
              {/* Quick Actions */}
              <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-2xl shadow-lg p-6 flex flex-col gap-4">
                <span className="text-xl font-bold text-blue-800 mb-2">Quick Actions</span>
                <button className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full py-2 px-6 transition-all shadow" onClick={() => setAddEmpModalOpen(true)}>
                  <CalendarIcon />
                  Create Shift
                </button>
                <button className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full py-2 px-6 transition-all shadow" onClick={() => setAddEmpModalOpen(true)}>
                  <UsersIcon />
                  Add Employee
                </button>
              </div>
              {/* Announcements */}
              <div className="bg-white rounded-2xl shadow-lg p-0 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-blue-100">
                  <div className="flex items-center gap-2">
                    <MegaphoneIcon />
                    <span className="text-lg font-bold text-blue-800">Announcements</span>
                  </div>
                  <button className="text-xs text-blue-600 font-semibold hover:underline">Add Announcement</button>
                </div>
                {/* Announcements List (replace with real data) */}
                <ul className="divide-y divide-blue-50">
                  {/* Example announcement */}
                  <li className="px-6 py-4 hover:bg-blue-50 transition">
                    <div className="flex flex-col">
                      <span className="font-medium text-blue-900">New COVID-19 Policy</span>
                      <span className="text-xs text-blue-400">May 10, 2024</span>
                      <span className="text-sm text-blue-700 mt-1">Masks are now optional for all employees.</span>
                    </div>
                  </li>
                  <li className="px-6 py-4 hover:bg-blue-50 transition">
                    <div className="flex flex-col">
                      <span className="font-medium text-blue-900">Team Meeting Friday</span>
                      <span className="text-xs text-blue-400">May 8, 2024</span>
                      <span className="text-sm text-blue-700 mt-1">All staff meeting at 3pm in the break room.</span>
                    </div>
                  </li>
                  {/* Empty state example: comment out above <li> to see */}
                  {/* <li className="px-6 py-8 text-center text-blue-400 flex flex-col items-center">
                    <MegaphoneIcon />
                    <span className="mt-2">No announcements at the moment.</span>
                  </li> */}
                </ul>
                <div className="px-6 py-3 border-t border-blue-50 bg-blue-50 text-right">
                  <button className="text-blue-600 hover:underline text-sm font-medium">View All</button>
                </div>
              </div>
              {/* Requests */}
              <div className="bg-white rounded-2xl shadow-lg p-0 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-blue-100">
                  <div className="flex items-center gap-2">
                    <HourglassIcon />
                    <span className="text-lg font-bold text-blue-800">Requests</span>
                  </div>
                </div>
                {/* Requests List (replace with real data) */}
                <ul className="divide-y divide-blue-50">
                  {/* Example request */}
                  <li className="px-6 py-4 flex items-center gap-3 hover:bg-blue-50 transition">
                    <img src="/images/avatars/hailee_steinfeld.jpg" alt="Hailee Steinfeld" className="w-8 h-8 rounded-full object-cover" />
                    <div className="flex-1">
                      <span className="font-medium text-blue-900">Hailee Steinfeld</span>
                      <span className="block text-xs text-blue-400">Shift Swap</span>
                    </div>
                    <span className="text-xs text-blue-500 mr-2">May 12</span>
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">Pending</span>
                  </li>
                  <li className="px-6 py-4 flex items-center gap-3 hover:bg-blue-50 transition">
                    <img src="/images/avatars/gordon_ramsay.jpg" alt="Gordon Ramsay" className="w-8 h-8 rounded-full object-cover" />
                    <div className="flex-1">
                      <span className="font-medium text-blue-900">Gordon Ramsay</span>
                      <span className="block text-xs text-blue-400">Time Off</span>
                    </div>
                    <span className="text-xs text-blue-500 mr-2">May 11</span>
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Approved</span>
                  </li>
                  {/* Empty state example: comment out above <li> to see */}
                  {/* <li className="px-6 py-8 text-center text-blue-400 flex flex-col items-center">
                    <HourglassIcon />
                    <span className="mt-2">No requests at the moment.</span>
                  </li> */}
                </ul>
                <div className="px-6 py-3 border-t border-blue-50 bg-blue-50 text-right">
                  <button className="text-blue-600 hover:underline text-sm font-medium">View All Requests</button>
                </div>
              </div>
            </aside>
          </div>
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

      {error && (
        <div className="fixed top-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm shadow-lg z-50">
          {error}
        </div>
      )}

      {businessId && (
        <AddEmployeeModal 
          open={addEmpModalOpen} 
          onClose={() => {
            setAddEmpModalOpen(false);
            refreshEmployeeCount(); // Refresh count when modal closes
          }} 
          businessId={businessId} 
        />
      )}
    </div>
  );
} 