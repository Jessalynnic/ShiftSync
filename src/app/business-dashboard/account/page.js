"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import { getBusinessIdForCurrentUser } from "../roleUtils";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import DashboardFooter from "../components/DashboardFooter";
import Image from "next/image";

export default function BusinessAccountPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Business details state
  const [businessId, setBusinessId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessCity, setBusinessCity] = useState("");
  const [businessState, setBusinessState] = useState("");
  const [businessZipcode, setBusinessZipcode] = useState("");
  const [businessPhoneNum, setBusinessPhoneNum] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Business hours state
  const [businessHours, setBusinessHours] = useState({
    Monday: { open: "", close: "" },
    Tuesday: { open: "", close: "" },
    Wednesday: { open: "", close: "" },
    Thursday: { open: "", close: "" },
    Friday: { open: "", close: "" },
    Saturday: { open: "", close: "" },
    Sunday: { open: "", close: "" },
  });

  const US_STATES = [
    "AL",
    "AK",
    "AZ",
    "AR",
    "CA",
    "CO",
    "CT",
    "DE",
    "FL",
    "GA",
    "HI",
    "ID",
    "IL",
    "IN",
    "IA",
    "KS",
    "KY",
    "LA",
    "ME",
    "MD",
    "MA",
    "MI",
    "MN",
    "MS",
    "MO",
    "MT",
    "NE",
    "NV",
    "NH",
    "NJ",
    "NM",
    "NY",
    "NC",
    "ND",
    "OH",
    "OK",
    "OR",
    "PA",
    "RI",
    "SC",
    "SD",
    "TN",
    "TX",
    "UT",
    "VT",
    "VA",
    "WA",
    "WV",
    "WI",
    "WY",
  ];

  useEffect(() => {
    async function fetchBusinessId() {
      try {
        const bId = await getBusinessIdForCurrentUser();
        setBusinessId(bId);
        if (bId) {
          fetchBusinessDetails(bId);
        }
      } catch (err) {
        setError("Failed to fetch business information.");
        setLoadingData(false);
      }
    }
    fetchBusinessId();
  }, []);

  const fetchBusinessDetails = async (bId) => {
    try {
      setLoadingData(true);

      // Fetch business details - handle case where business table might not exist yet
      let businessData = null;
      try {
        const { data, error } = await supabase
          .from("business")
          .select("*")
          .eq("business_id", bId)
          .single();

        if (!error && data) {
          businessData = data;
          setBusinessName(data.business_name || "");
          setBusinessEmail(data.business_email || "");
        }
      } catch (err) {
        console.log(
          "Business table not found or no data, using default values",
        );
        // Set default business name if table doesn't exist
        setBusinessName("My Business");
        setBusinessEmail("");
      }

      // Fetch business location details
      try {
        const { data: locationData, error: locationError } = await supabase
          .from("business_locations")
          .select("*")
          .eq("business_id", bId)
          .single();

        if (locationData) {
          setBusinessAddress(locationData.street_address || "");
          setBusinessCity(locationData.city || "");
          setBusinessState(locationData.state || "");
          setBusinessZipcode(locationData.zipcode || "");
          setBusinessPhoneNum(locationData.phone_number || "");

          // Set business hours if available
          if (locationData.business_hours) {
            const hours = locationData.business_hours;
            setBusinessHours({
              Monday: hours.Monday || { open: "", close: "" },
              Tuesday: hours.Tuesday || { open: "", close: "" },
              Wednesday: hours.Wednesday || { open: "", close: "" },
              Thursday: hours.Thursday || { open: "", close: "" },
              Friday: hours.Friday || { open: "", close: "" },
              Saturday: hours.Saturday || { open: "", close: "" },
              Sunday: hours.Sunday || { open: "", close: "" },
            });
          }
        }
      } catch (err) {
        console.log(
          "Business locations table not found or no data, using default values",
        );
      }

      // Fetch profile photo if exists
      if (businessData?.profile_photo_url) {
        setProfilePhoto(businessData.profile_photo_url);
      }
    } catch (err) {
      console.error("Error fetching business details:", err);
      setError("Failed to load business details.");
    } finally {
      setLoadingData(false);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      // Reset form when canceling
      fetchBusinessDetails(businessId);
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      setError("");

      // Check if file is an image
      if (!file.type.startsWith("image/")) {
        throw new Error("Please select an image file.");
      }

      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Image size must be less than 5MB.");
      }

      console.log("Starting photo upload for business ID:", businessId);

      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${businessId}_profile.${fileExt}`;
      const filePath = `business-profiles/${fileName}`;

      console.log("Uploading to path:", filePath);

      try {
        const { data, error: uploadError } = await supabase.storage
          .from("business-assets")
          .upload(filePath, file, {
            upsert: true,
            cacheControl: "3600",
          });

        if (uploadError) {
          console.error("Upload error details:", uploadError);

          // If bucket doesn't exist, create a temporary solution
          if (
            uploadError.message.includes("bucket") ||
            uploadError.message.includes("not found")
          ) {
            console.log(
              "Storage bucket not found, skipping photo upload for now",
            );
            setError(
              "Photo upload temporarily unavailable. Please try again later.",
            );
            return;
          }

          // If RLS policy issue
          if (
            uploadError.message.includes("row-level security") ||
            uploadError.statusCode === "403"
          ) {
            throw new Error(
              "Storage permissions not configured. Please contact administrator.",
            );
          }

          throw uploadError;
        }

        console.log("Upload successful:", data);

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("business-assets").getPublicUrl(filePath);

        console.log("Public URL:", publicUrl);

        // Update business record with photo URL (if business table exists)
        try {
          const { error: updateError } = await supabase
            .from("business")
            .update({ profile_photo_url: publicUrl })
            .eq("business_id", businessId);

          if (updateError) {
            console.log(
              "Could not update business table with photo URL:",
              updateError,
            );
            // Still show the photo even if we can't save the URL
          } else {
            console.log("Business table updated with photo URL");
          }
        } catch (err) {
          console.log("Business table not found, skipping photo URL save");
        }

        // Set the profile photo immediately
        setProfilePhoto(publicUrl);
        setSuccessMessage("Profile photo updated successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } catch (storageError) {
        console.error("Storage error details:", storageError);
        throw new Error(
          `Failed to upload photo: ${storageError.message || "Unknown error"}`,
        );
      }
    } catch (err) {
      console.error("Error uploading photo:", err);
      setError(err.message || "Failed to upload profile photo.");
    } finally {
      setLoading(false);
    }
  };

  // Only allow digits while typing
  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setBusinessPhoneNum(raw);
  };

  // Format on blur
  const handlePhoneBlur = () => {
    setBusinessPhoneNum(formatPhoneNumber(businessPhoneNum));
  };

  // Format function (US style)
  const formatPhoneNumber = (phoneNumber) => {
    const cleaned = ("" + phoneNumber).replace(/\D/g, "");
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      if (!match[2]) return match[1];
      if (!match[3]) return `${match[1]}-${match[2]}`;
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return phoneNumber;
  };

  const handleSaveProfile = async () => {
    // Validation
    if (!businessName || !businessPhoneNum || !businessAddress) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!/^\d{10}$/.test(businessPhoneNum.replace(/\D/g, ""))) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    const invalidHours = Object.keys(businessHours).some(
      (day) =>
        businessHours[day].open === "" || businessHours[day].close === "",
    );
    if (invalidHours) {
      setError("Please specify business hours for each day.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Update business location
      const locationData = {
        business_id: businessId,
        street_address: businessAddress,
        city: businessCity,
        state: businessState,
        zipcode: businessZipcode,
        phone_number: businessPhoneNum,
        business_hours: businessHours,
      };

      try {
        const { error: locationError } = await supabase
          .from("business_locations")
          .upsert(locationData, { onConflict: "business_id" });

        if (locationError) {
          console.error("Location save error:", locationError);
          throw new Error("Failed to save location information.");
        }
      } catch (err) {
        console.error("Error saving to business_locations table:", err);
        throw new Error(
          "Business locations table not found. Please create the table first.",
        );
      }

      // Try to update business table if it exists
      try {
        const { error: businessError } = await supabase
          .from("business")
          .update({
            business_name: businessName,
            business_email: businessEmail,
          })
          .eq("business_id", businessId);

        if (businessError) {
          console.log("Could not update business table:", businessError);
          // Continue anyway since location was saved
        }
      } catch (err) {
        console.log("Business table not found, skipping business info update");
      }

      // Log activity
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        await supabase.from("activity_log").insert({
          business_id: businessId,
          user_id: user?.id || null,
          type: "edit",
          description: `Updated business profile information`,
          metadata: { field: "business_profile_update" },
        });
      } catch (err) {
        console.error("Failed to log activity:", err);
        // Don't fail the whole operation if activity logging fails
      }

      setIsEditing(false);
      setSuccessMessage("Business profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error saving business profile:", err);
      setError(err.message || "Failed to save business profile.");
    } finally {
      setLoading(false);
    }
  };

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

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const value = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}:00`;
        const period = hour >= 12 ? "PM" : "AM";
        const displayHour = hour % 12 === 0 ? 12 : hour % 12;
        const displayTime = `${displayHour}:${min.toString().padStart(2, "0")} ${period}`;
        times.push({ value, displayTime });
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  if (loadingData) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar */}
      <Sidebar
        pathname={pathname}
        router={router}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <DashboardHeader
          title="Business Account"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          loading={loading}
          handleLogout={handleLogout}
        />

        {/* Page Content */}
        <div className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Business Account
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your business profile and settings
              </p>
            </div>

            {/* Success/Error Messages */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
                <p className="text-green-700 text-sm">{successMessage}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Profile Photo & Overview */}
              <div className="lg:col-span-1">
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                  {/* Profile Photo */}
                  <div className="text-center mb-6">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 mx-auto mb-4 relative">
                      {profilePhoto ? (
                        <Image
                          src={profilePhoto}
                          alt="Business Profile"
                          fill
                          sizes="128px"
                          style={{ objectFit: 'cover' }}
                          priority
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg
                            className="w-16 h-16 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {businessName || "Business Name"}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Business ID: {businessId}
                  </p>
                </div>

                {/* Account Overview */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Account Overview
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                        />
                      </svg>
                      <span className="text-gray-600">Active Account</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-gray-600">
                        Last updated: {new Date().toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Business Details */}
              <div className="lg:col-span-2">
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Business Information
                    </h3>
                    <div className="flex gap-3">
                      <button
                        onClick={handleEditToggle}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {isEditing ? "Cancel" : "Edit Profile"}
                      </button>
                      {isEditing && (
                        <button
                          onClick={handleSaveProfile}
                          disabled={loading}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {loading ? "Saving..." : "Save Changes"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Business Details Form */}
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Business Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          readOnly={!isEditing}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Business Email
                        </label>
                        <input
                          type="email"
                          value={businessEmail}
                          readOnly
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                        />
                      </div>
                    </div>

                    {/* Address Information */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-900">
                        Address Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Street Address{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={businessAddress}
                            onChange={(e) => setBusinessAddress(e.target.value)}
                            readOnly={!isEditing}
                            placeholder="Enter street address"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City
                          </label>
                          <input
                            type="text"
                            value={businessCity}
                            onChange={(e) => setBusinessCity(e.target.value)}
                            readOnly={!isEditing}
                            placeholder="Enter city"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            State
                          </label>
                          <select
                            value={businessState}
                            onChange={(e) => setBusinessState(e.target.value)}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                          >
                            <option value="">Select state</option>
                            {US_STATES.map((state) => (
                              <option key={state} value={state}>
                                {state}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Zipcode
                          </label>
                          <input
                            type="text"
                            value={businessZipcode}
                            onChange={(e) => setBusinessZipcode(e.target.value)}
                            readOnly={!isEditing}
                            placeholder="Enter zipcode"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={businessPhoneNum}
                            onChange={handlePhoneChange}
                            onBlur={handlePhoneBlur}
                            readOnly={!isEditing}
                            placeholder="Enter business phone number"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Business Hours */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-900">
                        Business Hours
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Day
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Open Time
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Close Time
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(businessHours).map(
                              ([day, hours]) => (
                                <tr key={day}>
                                  <td className="px-4 py-3 font-medium text-gray-900">
                                    {day}
                                  </td>
                                  <td className="px-4 py-3">
                                    <select
                                      value={hours.open}
                                      onChange={(e) =>
                                        setBusinessHours((prev) => ({
                                          ...prev,
                                          [day]: {
                                            ...prev[day],
                                            open: e.target.value,
                                          },
                                        }))
                                      }
                                      disabled={!isEditing}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                      <option value="">Select Time</option>
                                      {timeOptions.map((time) => (
                                        <option
                                          key={time.value}
                                          value={time.value}
                                        >
                                          {time.displayTime}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="px-4 py-3">
                                    <select
                                      value={hours.close}
                                      onChange={(e) =>
                                        setBusinessHours((prev) => ({
                                          ...prev,
                                          [day]: {
                                            ...prev[day],
                                            close: e.target.value,
                                          },
                                        }))
                                      }
                                      disabled={!isEditing}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                      <option value="">Select Time</option>
                                      {timeOptions.map((time) => (
                                        <option
                                          key={time.value}
                                          value={time.value}
                                        >
                                          {time.displayTime}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
