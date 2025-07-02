"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import {
  DashboardIcon,
  ScheduleIcon,
  EmployeesIcon,
  RequestsIcon,
  ReportsIcon,
  SettingsIcon,
  AccountIcon,
} from "./SidebarIcons";

export default function Sidebar({
  pathname,
  router,
  sidebarOpen,
  setSidebarOpen,
}) {
  const [businessOwner, setBusinessOwner] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });

  useEffect(() => {
    const getBusinessOwner = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: employee } = await supabase
          .from("employee")
          .select("first_name, last_name, email_address")
          .eq("user_id", user.id)
          .single();

        if (employee) {
          setBusinessOwner({
            first_name: employee.first_name,
            last_name: employee.last_name,
            email: employee.email_address,
          });
        }
      }
    };

    getBusinessOwner();

    // Listen for profile updates
    const refreshProfile = () => {
      getBusinessOwner();
    };

    // Add global function to refresh profile
    if (typeof window !== "undefined") {
      window.refreshSidebarProfile = refreshProfile;
    }

    return () => {
      if (typeof window !== "undefined") {
        delete window.refreshSidebarProfile;
      }
    };
  }, []);

  function SidebarItem({ icon, label, active = false, onClick }) {
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all ${
          active
            ? "bg-blue-100 text-blue-700 font-semibold"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        {icon}
        <span className="text-sm">{label}</span>
      </button>
    );
  }

  // Generate initials from first and last name
  const getInitials = (firstName, lastName) => {
    if (!firstName || !lastName) return "BO"; // Business Owner fallback
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Get display name
  const getDisplayName = (firstName, lastName) => {
    if (firstName === "Business" && lastName === "Owner") {
      return "Business Owner";
    }
    if (!firstName || !lastName) {
      return "Business Owner";
    }
    return `${firstName} ${lastName}`;
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:overflow-y-auto`}
      style={{ height: "100vh" }}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6">
          <svg
            width="32"
            height="32"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="20" cy="20" r="18" fill="#38bdf8" />
            <path
              d="M13 20a7 7 0 0 1 7-7c2.5 0 4.7 1.36 5.89 3.39"
              stroke="#fff"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M27 20a7 7 0 0 1-7 7c-2.5 0-4.7-1.36-5.89-3.39"
              stroke="#fff"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <circle cx="20" cy="20" r="3" fill="#fff" />
          </svg>
          <span className="text-lg font-bold text-blue-700 tracking-tight">
            ShiftSync
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <SidebarItem
            icon={<DashboardIcon />}
            label="Dashboard"
            active={pathname === "/business-dashboard"}
            onClick={() => router.push("/business-dashboard")}
          />
          <SidebarItem
            icon={<ScheduleIcon />}
            label="Schedule"
            active={pathname === "/business-dashboard/schedule"}
            onClick={() => router.push("/business-dashboard/schedule")}
          />
          <SidebarItem
            icon={<EmployeesIcon />}
            label="Employees"
            active={pathname === "/business-dashboard/manage-employees"}
            onClick={() => router.push("/business-dashboard/manage-employees")}
          />
          <SidebarItem icon={<RequestsIcon />} label="Requests" />
          <SidebarItem icon={<ReportsIcon />} label="Reports" />
          <SidebarItem
            icon={<AccountIcon />}
            label="Account"
            active={pathname === "/business-dashboard/account"}
            onClick={() => router.push("/business-dashboard/account")}
          />
          <SidebarItem
            icon={<SettingsIcon />}
            label="Settings"
            active={pathname === "/business-dashboard/settings"}
            onClick={() => router.push("/business-dashboard/settings")}
          />
        </nav>

        {/* User Profile */}
        <div className="p-4">
          <button
            onClick={() => router.push("/business-dashboard/account")}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {getInitials(businessOwner.first_name, businessOwner.last_name)}
              </span>
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-gray-900">
                {getDisplayName(
                  businessOwner.first_name,
                  businessOwner.last_name,
                )}
              </div>
              <div className="text-xs text-gray-500">Business Owner</div>
            </div>
          </button>
        </div>
      </div>
    </aside>
  );
}
