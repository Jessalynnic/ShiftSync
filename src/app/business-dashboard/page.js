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

  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar */}
      <Sidebar pathname={pathname} router={router} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content (with left margin on desktop for sidebar) */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Top Nav Bar */}
        <DashboardHeader title="Dashboard" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} loading={loading} handleLogout={handleLogout} />

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
              {/* Schedule Overview */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xl font-bold text-blue-800">Schedule Overview</span>
                  <button className="text-blue-600 hover:underline">View Calendar</button>
                </div>
                <div className="text-blue-700 text-center py-8">(Calendar or upcoming shifts will appear here.)</div>
              </div>
              {/* Recent Activity */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xl font-bold text-blue-800">Recent Activity</span>
                  <button className="text-blue-600 hover:underline">View All</button>
                </div>
                <div className="text-blue-700 text-center py-8">(Recent actions, shift swaps, new employees, etc. will appear here.)</div>
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