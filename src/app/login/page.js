"use client";
import { useState } from 'react';
import { loginEmployee } from './loginEmployee';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabaseClient';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [promptPasswordChange, setPromptPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    setPromptPasswordChange(false);
    
    const { success, message, promptPasswordChange: shouldPromptChange } = await loginEmployee(employeeId, password);
    
    if (!success) {
      setError(message);
      setLoading(false);
      return;
    }
    
    if (shouldPromptChange) {
      setPromptPasswordChange(true);
      setLoading(false);
      return;
    }
    
    setSuccess(true);
    setLoading(false);
    setTimeout(() => {
      router.push('/employee-dashboard');
    }, 1000);
  };

  const handleGoogleLogin = () => {
    // TODO: Implement Google OAuth login
    console.log('Google login clicked');
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    setChangingPassword(true);
    setError('');
    
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        setError(error.message);
        setChangingPassword(false);
        return;
      }
      
      // Update user metadata to mark password as changed
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          password_changed: true,
          password_changed_at: new Date().toISOString()
        }
      });
      
      if (metadataError) {
        console.error('Error updating metadata:', metadataError);
      }
      
      setSuccess(true);
      setChangingPassword(false);
      setTimeout(() => {
        router.push('/employee-dashboard');
      }, 1000);
      
    } catch (err) {
      console.error('Password change error:', err);
      setError('Failed to change password. Please try again.');
      setChangingPassword(false);
    }
  };

  return (
    <main className="min-h-screen flex items-stretch bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Left Side: Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 md:px-16 py-10 max-w-xl min-w-[350px] mx-auto">
        <div className="w-full max-w-md p-10 flex flex-col items-center">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="#38bdf8" />
              <path d="M13 20a7 7 0 0 1 7-7c2.5 0 4.7 1.36 5.89 3.39" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
              <path d="M27 20a7 7 0 0 1-7 7c-2.5 0-4.7-1.36-5.89-3.39" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
              <circle cx="20" cy="20" r="3" fill="#fff" />
            </svg>
            <span className="text-xl font-bold text-blue-700 tracking-tight">ShiftSync</span>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-3xl font-bold text-blue-800 mb-2">Sign in to your account</h1>
            <p className="text-blue-500 mb-8">Welcome back! Please enter your details below.</p>
            {/* Login Form or Password Change Form */}
            {!promptPasswordChange ? (
              <form onSubmit={handleLogin} className="space-y-5 w-full max-w-xs">
                <div>
                  <input
                    type="text"
                    placeholder="Employee ID"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full px-4 py-3 border border-blue-100 rounded-full focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all bg-white text-blue-900 placeholder-blue-300"
                    required
                  />
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-blue-100 rounded-full focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all bg-white text-blue-900 placeholder-blue-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-blue-600"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full py-3 transition-all text-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </div>
                  ) : (
                    'Sign in'
                  )}
                </button>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mt-4 text-center">
                    Sign in successful!
                  </div>
                )}
              </form>
            ) : (
              <div className="w-full max-w-xs">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">Change Your Password</h3>
                  <p className="text-yellow-700 text-sm">
                    You're using the default password. Please change it to a secure password for your account.
                  </p>
                </div>
                
                <form onSubmit={handlePasswordChange} className="space-y-5">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-blue-100 rounded-full focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all bg-white text-blue-900 placeholder-blue-300"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-blue-600"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-blue-100 rounded-full focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all bg-white text-blue-900 placeholder-blue-300"
                      required
                      minLength={6}
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full py-3 transition-all text-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {changingPassword ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Changing Password...
                      </div>
                    ) : (
                      'Change Password'
                    )}
                  </button>
                  
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}
                  
                  {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm text-center">
                      Password changed successfully! Redirecting...
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>
          
          {/* Social Login - Moved outside the form */}
          <div className="flex items-center gap-4 mt-6 mb-2 w-full max-w-xs">
            <button 
              type="button"
              onClick={handleGoogleLogin}
              className="flex-1 flex items-center justify-center gap-2 border border-blue-100 rounded-full py-2 bg-white hover:bg-blue-50 transition shadow-sm text-blue-700 font-medium"
            >
              <img src="/images/icon/google_icon.png" alt="Google" className="w-5 h-5" />
              Google
            </button>
            <button 
              type="button"
              className="flex-1 flex items-center justify-center gap-2 border border-blue-100 rounded-full py-2 bg-white hover:bg-blue-50 transition shadow-sm text-blue-700 font-medium"
            >
              <img src="/images/icon/apple_icon.png" alt="Apple" className="w-6 h-6 object-contain" />
              Apple
            </button>
          </div>
          
          {/* Footer Links */}
          <div className="flex items-center justify-between text-xs text-blue-300 mt-8 w-full max-w-xs">
            <span>
              Dont have an account?{' '}
              <a href="/signup" className="text-blue-500 hover:underline">Sign up</a>
            </span>
            <a href="#" className="hover:underline">Terms & Conditions</a>
          </div>
        </div>
      </div>
      {/* Right Side: Image & Overlays */}
      <div className="flex-1 flex items-center justify-center relative overflow-visible">
        {/* Main Image Card */}
        <div className="relative flex items-center justify-center w-[90%] h-[80vh] max-h-[700px] bg-white rounded-3xl shadow-2xl border-4 border-white overflow-hidden">
          <img
            src="/images/woman_image.png"
            alt="Team collaboration"
            className="object-cover w-full h-full"
          />
          {/* Overlay with text */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end">
            <div className="p-8 text-white">
              <h2 className="text-2xl font-bold mb-2">Streamline Your Workforce</h2>
              <p className="text-lg opacity-90">Manage schedules, track time, and boost productivity with our comprehensive employee management platform.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 