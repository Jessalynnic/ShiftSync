"use client";
import { DashboardIcon, ScheduleIcon, EmployeesIcon, RequestsIcon, ReportsIcon, SettingsIcon } from "./SidebarIcons";

export default function Sidebar({ pathname, router, sidebarOpen, setSidebarOpen }) {
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

  return (
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
          <SidebarItem icon={<DashboardIcon />} label="Dashboard" active={pathname === "/business-dashboard"} onClick={() => router.push("/business-dashboard")} />
          <SidebarItem icon={<ScheduleIcon />} label="Schedule" />
          <SidebarItem icon={<EmployeesIcon />} label="Employees" active={pathname === "/business-dashboard/manage-employees"} onClick={() => router.push("/business-dashboard/manage-employees")} />
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
  );
} 