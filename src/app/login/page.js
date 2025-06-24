"use client";
import { useState } from 'react';
import { loginBusiness } from './loginBusiness';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isBusinessLogin, setIsBusinessLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const switchLogin = (type) => {
    setIsBusinessLogin(type === 'Business');
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    if (isBusinessLogin) {
      const { success, message } = await loginBusiness(businessEmail, password);
      if (!success) {
        setError(message);
        setLoading(false);
        return;
      }
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        router.push('/business-dashboard');
      }, 1000);
      return;
    }
    // ...existing employee login logic or placeholder...
    setTimeout(() => {
      setLoading(false);
    }, 2000);
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
            {/* Login Type Switcher */}
            <div className="flex bg-blue-100 rounded-lg p-1 mb-6 w-full max-w-xs">
              <button
                onClick={() => switchLogin('Employee')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  !isBusinessLogin 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-blue-600/60 hover:text-blue-800'
                }`}
              >
                Employee
              </button>
              <button
                onClick={() => switchLogin('Business')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  isBusinessLogin 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-blue-600/60 hover:text-blue-800'
                }`}
              >
                Business
              </button>
            </div>
            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-5 w-full max-w-xs">
              <div>
                <input
                  type={isBusinessLogin ? 'email' : 'text'}
                  placeholder={isBusinessLogin ? 'Business Email' : 'Employee ID'}
                  value={isBusinessLogin ? businessEmail : employeeId}
                  onChange={(e) => isBusinessLogin ? setBusinessEmail(e.target.value) : setEmployeeId(e.target.value)}
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
            {/* Social Login */}
            <div className="flex items-center gap-4 mt-6 mb-2 w-full max-w-xs">
              <button className="flex-1 flex items-center justify-center gap-2 border border-blue-100 rounded-full py-2 bg-white hover:bg-blue-50 transition shadow-sm text-blue-700 font-medium">
                <img src="/images/icon/google_icon.png" alt="Google" className="w-5 h-5" />
                Google
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 border border-blue-100 rounded-full py-2 bg-white hover:bg-blue-50 transition shadow-sm text-blue-700 font-medium">
                <img src="/images/icon/apple_icon.png" alt="Apple" className="w-6 h-6 object-contain" />
                Apple
              </button>
            </div>
          </div>
          {/* Footer Links */}
          <div className="flex items-center justify-between text-xs text-blue-300 mt-8 w-full max-w-xs">
            <span>
              Have an account?{' '}
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
          {/* Task Card (top right, floating, layered) */}
          {/* Bottom (shadow) card */}
          <div className="absolute top-16 right-2 bg-gray-800 rounded-xl shadow-md px-6 py-4 flex flex-col items-start border border-gray-700 z-10" style={{width: 240}}>
            {/* Floating white dot */}
            <span className="absolute right-2 w-2 h-2 bg-white rounded-full z-20"></span>
            <div className="flex items-center mb-1">
              <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
              <span className="text-xs text-gray-300">09:30am-10:00am</span>
            </div>
            <span className="text-xs text-gray-400 mt-3">09:30am-10:00am</span>
          </div>
          {/* Top (main) card */}
          <div className="absolute top-8 right-8 bg-blue-100 rounded-xl shadow-lg px-6 py-4 flex flex-col items-start border border-blue-200 z-20" style={{width: 240}}>
            <div className="flex items-center mb-1 w-full justify-between">
              <span className="text-sm font-semibold text-blue-700">Task Review With Team</span>
              <span className="inline-block w-2 h-2 bg-blue-700 rounded-full"></span>
            </div>
            <span className="text-xs text-blue-600">09:30am-10:00am</span>
          </div>
          {/* Calendar Card (bottom left, horizontal, compact) */}
          <div className="absolute bottom-8 left-8 bg-white rounded-2xl shadow-xl px-6 py-4 flex flex-col items-start border border-blue-100 z-20" style={{width: 300}}>
            <div className="grid grid-cols-7 gap-2 mb-1 w-full text-center">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d, i) => (
                <span key={d} className="text-xs font-semibold text-blue-300 col-span-1">{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2 mb-1 w-full text-center">
              {[22,23,24,25,26,27,28].map((n, i) => (
                <span key={n} className={`text-sm font-semibold px-2 py-1 rounded-full col-span-1 ${n===26 ? 'bg-blue-200 text-blue-900' : 'text-blue-500'}`}>{n}</span>
              ))}
            </div>
            <div className="w-full flex items-center gap-2 mt-1">
              <span className="inline-block w-2 h-2 bg-blue-400 rounded-full"></span>
              <span className="text-xs text-blue-500">Daily Meeting</span>
              <span className="ml-auto text-xs text-blue-300">12:00-1:00pm</span>
            </div>
            <div className="flex mt-2 gap-1">
              {['joe_goldberg.png', 'hailee_steinfeld.jpg', 'gordon_ramsay.jpg', 'female_image.jpg'].map((filename, i) => (
                <span key={filename} className="inline-block w-6 h-6 rounded-full border-2 border-white bg-blue-100 overflow-hidden">
                  <img src={`/images/avatars/${filename}`} alt={`avatar-${i+1}`} className="object-cover w-full h-full" />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 