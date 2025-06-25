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
    if (type === "signup" && token) {
      supabase.auth.verifyOtp({
        type: "signup",
        token,
        email,
      })
        .then(({ error }) => {
          if (error) {
            setStatus("error");
            setMessage(error.message || "Confirmation failed.");
          } else {
            setStatus("success");
            setMessage("Email confirmed! Redirecting to login...");
            setTimeout(() => router.push("/login"), 2000);
          }
        });
    } else {
      setStatus("error");
      setMessage("Invalid confirmation link.");
    }
  }, [router, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh]">
      {status === "loading" && <div>Confirming your email...</div>}
      {status === "success" && <div className="text-green-700">{message}</div>}
      {status === "error" && <div className="text-red-600">{message}</div>}
    </div>
  );
} 