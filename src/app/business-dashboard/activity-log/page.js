"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../../../supabaseClient";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import DashboardFooter from "../components/DashboardFooter";
import { getBusinessIdForCurrentUser } from "../roleUtils";

const ACTIVITY_TYPES = [
  { value: "", label: "All Types" },
  { value: "add", label: "Add" },
  { value: "edit", label: "Edit" },
  { value: "delete", label: "Delete" },
  { value: "email", label: "Email" },
];

export default function ActivityLogPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activities, setActivities] = useState([]);
  const [activityType, setActivityType] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [businessId, setBusinessId] = useState(null);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    async function fetchBusinessIdAndActivities() {
      setLoading(true);
      try {
        const bId = await getBusinessIdForCurrentUser();
        setBusinessId(bId);
        if (bId) {
          await fetchActivities(bId, activityType, page);
        }
      } catch (err) {
        setError("Failed to fetch business information.");
      } finally {
        setLoading(false);
      }
    }
    fetchBusinessIdAndActivities();
  }, [activityType, page]);

  const fetchActivities = async (bId, type, pageNum) => {
    setLoading(true);
    setError("");
    try {
      let query = supabase
        .from("activity_log")
        .select("*, employee:user_id (first_name, last_name)")
        .eq("business_id", bId)
        .order("created_at", { ascending: false })
        .range((pageNum - 1) * pageSize, pageNum * pageSize - 1);
      if (type) {
        query = query.eq("type", type);
      }
      const { data, error, count } = await query;
      if (error) throw error;
      setActivities(data || []);
      setTotal(count || 0);
    } catch (err) {
      setError("Failed to load activity log.");
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (e) => {
    setActivityType(e.target.value);
    setPage(1);
  };

  const handleBack = () => {
    router.push("/business-dashboard");
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    setError("");
    const { error } = await supabase.auth.signOut();
    setLogoutLoading(false);
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
      <Sidebar
        pathname={pathname}
        router={router}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <DashboardHeader
          title="Activity Log"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          loading={logoutLoading}
          handleLogout={handleLogout}
        />
        <div className="flex-1 p-6 max-w-6xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={handleBack}
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              &larr; Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
            <div></div>
          </div>
          <div className="mb-4 flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">
              Filter by type:
            </label>
            <select
              value={activityType}
              onChange={handleTypeChange}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              {ACTIVITY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6 text-red-700">
              {error}
            </div>
          )}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading activities...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No activities found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date/Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activities.map((activity) => (
                    <tr key={activity.id || activity.created_at}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(activity.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {activity.employee
                          ? `${activity.employee.first_name || ""} ${activity.employee.last_name || ""}`.trim() ||
                            "N/A"
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            activity.type === "add"
                              ? "bg-green-100 text-green-800"
                              : activity.type === "edit"
                                ? "bg-blue-100 text-blue-800"
                                : activity.type === "delete"
                                  ? "bg-red-100 text-red-800"
                                  : activity.type === "email"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {activity.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {activity.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Pagination */}
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">Page {page}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={activities.length < pageSize}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
        <DashboardFooter />
      </div>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
