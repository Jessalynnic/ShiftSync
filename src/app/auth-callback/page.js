"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../supabaseClient";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("confirmation_token");
    const type = searchParams.get("type");
    const email = searchParams.get("email");
    
    console.log("Auth callback params:", { token, type, email });

    if (token && email) {
      // Handle both signup and invitation confirmations
      const otpType = type === "signup" ? "signup" : "invite";
      
      supabase.auth.verifyOtp({
        type: otpType,
        token,
        email,
      })
        .then(({ data, error }) => {
          if (error) {
            console.error("OTP verification error:", error);
            setStatus("error");
            setMessage(error.message || "Confirmation failed.");
          } else {
            console.log("OTP verification success:", data);
            setStatus("success");
            
            // Check if this is an employee or business user
            const userMetadata = data?.user?.user_metadata;
            if (userMetadata?.emp_id) {
              // This is an employee
              setMessage("Email confirmed! You can now log in with your Employee ID and default password.");
              setTimeout(() => router.push("/login"), 3000);
            } else if (userMetadata?.business_name) {
              // This is a business owner
              setMessage("Email confirmed! Redirecting to login...");
              setTimeout(() => router.push("/login"), 2000);
            } else {
              // Generic success
              setMessage("Email confirmed! Redirecting to login...");
              setTimeout(() => router.push("/login"), 2000);
            }
          }
        })
        .catch((err) => {
          console.error("Unexpected error during OTP verification:", err);
          setStatus("error");
          setMessage("An unexpected error occurred. Please try again.");
        });
    } else {
      setStatus("error");
      setMessage("Invalid confirmation link. Missing required parameters.");
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="#38bdf8" />
              <path d="M13 20a7 7 0 0 1 7-7c2.5 0 4.7 1.36 5.89 3.39" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
              <path d="M27 20a7 7 0 0 1-7 7c-2.5 0-4.7-1.36-5.89-3.39" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
              <circle cx="20" cy="20" r="3" fill="#fff" />
            </svg>
            <span className="text-xl font-bold text-blue-700 tracking-tight">ShiftSync</span>
          </div>

          {status === "loading" && (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <h2 className="text-xl font-semibold text-gray-900">Confirming your email...</h2>
              <p className="text-gray-600">Please wait while we verify your email address.</p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Email Confirmed!</h2>
              <p className="text-gray-600">{message}</p>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Confirmation Failed</h2>
              <p className="text-red-600">{message}</p>
              <button
                onClick={() => router.push("/login")}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 