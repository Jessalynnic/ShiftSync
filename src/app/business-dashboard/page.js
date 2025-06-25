"use client";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import AddEmployeeModal from './AddEmployeeModal';
import { getBusinessIdForCurrentUser } from './roleUtils';

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

// Sidebar icons
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
  </svg>
);
const ScheduleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const EmployeesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m13-7a4 4 0 11-8 0 4 4 0 018 0zM5 7a4 4 0 108 0 4 4 0 00-8 0z" />
  </svg>
);
const RequestsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const ReportsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);
const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

function OverviewCard({ title, value, icon }) {
  return (
    <div className="flex items-center gap-4 bg-white rounded-2xl shadow p-6 min-w-[180px]">
      <div>{icon}</div>
      <div>
        <div className="text-2xl font-bold text-blue-800">{value}</div>
        <div className="text-blue-500 text-sm font-medium">{title}</div>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all ${
        active 
          ? 'bg-blue-100 text-blue-700 font-semibold' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}

export default function BusinessDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addEmpModalOpen, setAddEmpModalOpen] = useState(false);
  const [businessId, setBusinessId] = useState(null);

  useEffect(() => {
    getBusinessIdForCurrentUser().then(setBusinessId);
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

  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:overflow-y-auto`} style={{ height: '100vh' }}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="#38bdf8" />
              <path d="M13 20a7 7 0 0 1 7-7c2.5 0 4.7 1.36 5.89 3.39" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
              <path d="M27 20a7 7 0 0 1-7 7c-2.5 0-4.7-1.36-5.89-3.39" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
              <circle cx="20" cy="20" r="3" fill="#fff" />
            </svg>
            <span className="text-lg font-bold text-blue-700 tracking-tight">ShiftSync</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <SidebarItem icon={<DashboardIcon />} label="Dashboard" active={true} />
            <SidebarItem icon={<ScheduleIcon />} label="Schedule" />
            <SidebarItem icon={<EmployeesIcon />} label="Employees" />
            <SidebarItem icon={<RequestsIcon />} label="Requests" />
            <SidebarItem icon={<ReportsIcon />} label="Reports" />
            <SidebarItem icon={<SettingsIcon />} label="Settings" />
          </nav>

          {/* User Profile */}
          <div className="p-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">JD</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">John Doe</div>
                <div className="text-xs text-gray-500">Business Owner</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content (with left margin on desktop for sidebar) */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Top Nav Bar */}
        <nav className="w-full flex items-center justify-between px-6 py-4 bg-white shadow-sm border-b border-blue-100">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-gray-100">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 7.165 6 9.388 6 12v2.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
            <button
              onClick={handleLogout}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-2 px-4 transition-all shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </nav>

        {/* Page Content */}
        <div className="flex-1 p-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <OverviewCard title="Total Employees" value="24" icon={<UsersIcon />} />
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
        <footer className="w-full bg-gradient-to-br from-blue-100 via-blue-50 to-white border-t border-blue-100 py-6 flex justify-center items-center">
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" fill="#38bdf8" />
            <path d="M13 20a7 7 0 0 1 7-7c2.5 0 4.7 1.36 5.89 3.39" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
            <path d="M27 20a7 7 0 0 1-7 7c-2.5 0-4.7-1.36-5.89-3.39" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
            <circle cx="20" cy="20" r="3" fill="#fff" />
          </svg>
          <span className="text-blue-400 text-sm ml-2">&copy; {new Date().getFullYear()} ShiftSync. All rights reserved.</span>
        </footer>
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
        <AddEmployeeModal open={addEmpModalOpen} onClose={() => setAddEmpModalOpen(false)} businessId={businessId} />
      )}
    </div>
  );
} 