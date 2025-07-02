"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { supabase } from "../../../supabaseClient";
import OnboardingEmailEditor from "../manage-employees/OnboardingEmailEditor";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import DashboardFooter from "../components/DashboardFooter";

export default function SettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Collapsible sections state
  const [emailSettingsOpen, setEmailSettingsOpen] = useState(true);
  const [businessInfoOpen, setBusinessInfoOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [integrationsOpen, setIntegrationsOpen] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setTimeout(() => {
      router.push("/login");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar */}
      <Sidebar
        pathname={pathname}
        router={router}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content (with left margin on desktop for sidebar) */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Top Nav Bar */}
        <DashboardHeader
          title="Settings"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          loading={loading}
          handleLogout={handleLogout}
        />

        {/* Page Content */}
        <div className="flex-1 p-6">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2">
              Manage your business settings and configurations
            </p>
          </div>

          {/* Settings Sections */}
          <div className="space-y-6">
            {/* Email Settings Section */}
            <section>
              <button
                className={`flex items-center gap-2 text-base font-medium mb-2 px-3 py-2 rounded-md transition-all shadow-sm border border-blue-200 bg-blue-50 hover:bg-blue-100 focus:outline-none w-full ${emailSettingsOpen ? "bg-blue-100 border-blue-300" : ""}`}
                onClick={() => setEmailSettingsOpen((open) => !open)}
                aria-expanded={emailSettingsOpen}
                aria-controls="email-settings-panel"
              >
                <span className="flex-1 text-left">Email Settings</span>
                <span className="text-sm text-gray-500">
                  Configure email templates and notifications
                </span>
                <svg
                  className={`w-4 h-4 transform transition-transform ${emailSettingsOpen ? "rotate-90" : "rotate-0"}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              <div
                id="email-settings-panel"
                className={`overflow-hidden transition-all duration-300 ${emailSettingsOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}
              >
                {emailSettingsOpen && (
                  <div className="bg-white border border-blue-100 rounded-xl shadow p-6 mt-2">
                    <OnboardingEmailEditor />
                  </div>
                )}
              </div>
            </section>

            {/* Business Information Section */}
            <section>
              <button
                className={`flex items-center gap-2 text-base font-medium mb-2 px-3 py-2 rounded-md transition-all shadow-sm border border-blue-200 bg-blue-50 hover:bg-blue-100 focus:outline-none w-full ${businessInfoOpen ? "bg-blue-100 border-blue-300" : ""}`}
                onClick={() => setBusinessInfoOpen((open) => !open)}
                aria-expanded={businessInfoOpen}
                aria-controls="business-info-panel"
              >
                <span className="flex-1 text-left">Business Information</span>
                <span className="text-sm text-gray-500">
                  Update your business details and preferences
                </span>
                <svg
                  className={`w-4 h-4 transform transition-transform ${businessInfoOpen ? "rotate-90" : "rotate-0"}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              <div
                id="business-info-panel"
                className={`overflow-hidden transition-all duration-300 ${businessInfoOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}
              >
                {businessInfoOpen && (
                  <div className="bg-white border border-blue-100 rounded-xl shadow p-6 mt-2">
                    <div className="text-center text-gray-500 py-8">
                      <p>
                        Business information settings will be available here
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Security Settings Section */}
            <section>
              <button
                className={`flex items-center gap-2 text-base font-medium mb-2 px-3 py-2 rounded-md transition-all shadow-sm border border-blue-200 bg-blue-50 hover:bg-blue-100 focus:outline-none w-full ${securityOpen ? "bg-blue-100 border-blue-300" : ""}`}
                onClick={() => setSecurityOpen((open) => !open)}
                aria-expanded={securityOpen}
                aria-controls="security-panel"
              >
                <span className="flex-1 text-left">Security & Privacy</span>
                <span className="text-sm text-gray-500">
                  Manage security settings and data privacy
                </span>
                <svg
                  className={`w-4 h-4 transform transition-transform ${securityOpen ? "rotate-90" : "rotate-0"}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              <div
                id="security-panel"
                className={`overflow-hidden transition-all duration-300 ${securityOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}
              >
                {securityOpen && (
                  <div className="bg-white border border-blue-100 rounded-xl shadow p-6 mt-2">
                    <div className="text-center text-gray-500 py-8">
                      <p>
                        Security and privacy settings will be available here
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Integration Settings Section */}
            <section>
              <button
                className={`flex items-center gap-2 text-base font-medium mb-2 px-3 py-2 rounded-md transition-all shadow-sm border border-blue-200 bg-blue-50 hover:bg-blue-100 focus:outline-none w-full ${integrationsOpen ? "bg-blue-100 border-blue-300" : ""}`}
                onClick={() => setIntegrationsOpen((open) => !open)}
                aria-expanded={integrationsOpen}
                aria-controls="integrations-panel"
              >
                <span className="flex-1 text-left">Integrations</span>
                <span className="text-sm text-gray-500">
                  Connect with third-party services
                </span>
                <svg
                  className={`w-4 h-4 transform transition-transform ${integrationsOpen ? "rotate-90" : "rotate-0"}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              <div
                id="integrations-panel"
                className={`overflow-hidden transition-all duration-300 ${integrationsOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}
              >
                {integrationsOpen && (
                  <div className="bg-white border border-blue-100 rounded-xl shadow p-6 mt-2">
                    <div className="text-center text-gray-500 py-8">
                      <p>Integration settings will be available here</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
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
    </div>
  );
}
