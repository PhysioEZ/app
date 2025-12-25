import * as React from 'react';
import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';

// Actual Login API Call
const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

const LoginScreen: React.FC = () => {
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showForgotPopup, setShowForgotPopup] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/login.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status === 'error') {
        throw new Error(data.message || 'Login failed');
      }

      // Success!
      login({
        id: data.data.user.employee_id,
        name: data.data.user.full_name,
        email: data.data.user.email,
        role: data.data.user.role_name,
        token: data.data.token,
        photo: data.data.user.photo_path,
        branch_id: data.data.user.branch_id,
        employee_id: data.data.user.employee_id
      } as any);

    } catch (err: any) {
      console.error('Login Error:', err);
      setError(err.message || 'Unable to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-hidden font-sans relative">
      
      {/* Background Ambience (Subtle Aurora) */}
      <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-50/80 rounded-full blur-[80px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-50/80 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header Section */}
        <div className="flex-none pt-20 pb-10 flex flex-col items-center text-center px-6">
          {/* Animated Brand Symbol (Smaller version) */}
          <div className="mb-8 relative w-16 h-16 flex items-center justify-center">
             <div className="absolute inset-0 bg-teal-400/20 rounded-full blur-xl animate-pulse" />
             <div className="relative grid grid-cols-2 gap-1.5 transform rotate-45">
                <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400"></div>
                <div className="w-4 h-4 rounded-full bg-slate-200 border border-slate-300"></div>
                <div className="w-4 h-4 rounded-full bg-slate-200 border border-slate-300"></div>
                <div className="w-4 h-4 rounded-full bg-gradient-to-bl from-teal-600 to-cyan-500"></div>
             </div>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-slate-800 drop-shadow-sm">
            CareSync<span className="font-light text-teal-600">OS</span>
          </h1>
          <p className="text-sm text-slate-500 mt-3 font-medium tracking-wide uppercase">
            Next Gen Medical System
          </p>
        </div>

        {/* Login Form */}
        <div className="flex-1 px-8 md:px-12 w-full max-w-md mx-auto">
          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Email Input */}
            <div className="relative group">
              <input
                type="text"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="peer w-full px-4 py-3.5 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 placeholder-transparent bg-white/50 backdrop-blur-sm transition-all shadow-sm"
                placeholder="Email or Username"
              />
              <label
                htmlFor="email"
                className="absolute left-3.5 -top-2.5 bg-white/80 px-1.5 text-xs text-teal-600 font-medium rounded-full transition-all 
                           peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-placeholder-shown:left-4 peer-placeholder-shown:bg-transparent
                           peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-teal-600 peer-focus:bg-white/90"
              >
                Email or Username
              </label>
            </div>

            {/* Password Input */}
            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="peer w-full px-4 py-3.5 pr-12 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 placeholder-transparent bg-white/50 backdrop-blur-sm transition-all shadow-sm"
                placeholder="Password"
              />
              <label
                htmlFor="password"
                className="absolute left-3.5 -top-2.5 bg-white/80 px-1.5 text-xs text-teal-600 font-medium rounded-full transition-all 
                           peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-placeholder-shown:left-4 peer-placeholder-shown:bg-transparent
                           peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-teal-600 peer-focus:bg-white/90"
              >
                Password
              </label>
              
              {/* Toggle Password Visibility */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-teal-600 focus:outline-none transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                   // Eye Off Icon
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                   </svg>
                ) : (
                   // Eye Icon
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                   </svg>
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 text-sm rounded-xl flex items-center gap-3 animate-fadeIn shadow-sm">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end text-sm">
              <button 
                type="button" 
                onClick={() => setShowForgotPopup(true)} 
                className="font-medium text-teal-600 hover:text-teal-800 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-teal-500/30 text-sm font-bold text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="flex-none pb-8 text-center space-y-4 px-6 relative z-10">
          
          <div className="flex flex-col items-center space-y-1">
             <span className="px-3 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-400 tracking-wider">
               v2.5.0
             </span>
             
             <p className="text-sm font-medium tracking-wide">
               <span className="text-slate-400">Created by </span>
               <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 bg-clip-text text-transparent font-bold">
                 Sumit Srivastava
               </span>
             </p>
          </div>

          <p className="text-xs text-slate-300">
             &copy; 2025 CareSyncOS. All rights reserved.
          </p>
        </div>

      </div>

      {/* Forgot Password Popup */}
      {showForgotPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center transform transition-all scale-100">
            <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reset Password</h3>
            <p className="text-gray-500 text-sm mb-6">
              Password reset is not available directly. Please contact your system administrator to request a new password.
            </p>

            <button
              onClick={() => setShowForgotPopup(false)}
              className="w-full py-2.5 px-4 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;
