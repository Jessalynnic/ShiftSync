"use client";
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function BusinessDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

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
    <main className="min-h-screen flex flex-col items-center justify-center bg-blue-50">
      <div className="bg-white rounded-2xl shadow-lg p-10 flex flex-col items-center max-w-md w-full">
        <h1 className="text-2xl font-bold text-blue-700 mb-4">Business Dashboard</h1>
        <p className="mb-8 text-blue-800">Welcome! You are logged in as a business user.</p>
        <button
          onClick={handleLogout}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full py-3 px-8 transition-all text-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          {loading ? 'Logging out...' : 'Logout'}
        </button>
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mt-2 text-center">
            Logged out! Redirecting to login...
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mt-2 text-center">
            {error}
          </div>
        )}
      </div>
    </main>
  );
} 