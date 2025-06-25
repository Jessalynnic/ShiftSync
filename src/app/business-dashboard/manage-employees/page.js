"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import BulkAddEmployeesForm from "./BulkAddEmployeesForm";
import RecentlyAddedEmployeesTable from "./RecentlyAddedEmployeesTable";
import { supabase } from '../../../supabaseClient';
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

  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar */}
      <Sidebar pathname={pathname} router={router} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content (with left margin on desktop for sidebar) */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Top Nav Bar */}
        <DashboardHeader title="Employees" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} loading={loading} handleLogout={handleLogout} />

        {/* Page Content */}
        <div className="flex-1 p-6">
          {/* Collapsible Mass Add Employees Section */}
          <section className="mb-10">
            <button
              className={`flex items-center gap-2 text-base font-medium mb-2 px-3 py-2 rounded-md transition-all shadow-sm border border-blue-200 bg-blue-50 hover:bg-blue-100 focus:outline-none ${massAddOpen ? 'bg-blue-100 border-blue-300' : ''}`}
              onClick={() => setMassAddOpen((open) => !open)}
              aria-expanded={massAddOpen}
              aria-controls="mass-add-panel"
            >
              <span className="flex-1 text-left">Add Employees</span>
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
              className={`overflow-hidden transition-all duration-300 ${massAddOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
              {massAddOpen && (
                <div className="bg-white border border-blue-100 rounded-xl shadow p-6 mt-2">
                  <BulkAddEmployeesForm />
                </div>
              )}
            </div>
            <div className="border-b border-blue-100 mt-6" />
          </section>
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">Recently Added Employees</h2>
            <RecentlyAddedEmployeesTable />
          </section>
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