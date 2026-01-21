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

  // M3 Interaction State
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

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
    <div className="min-h-screen flex flex-col bg-surface overflow-hidden font-sans relative text-on-surface">
      
      {/* Background Ambience - M3 Dynamic Blobs */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-30">
          <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-primary-container rounded-full blur-[100px] animate-blob mix-blend-multiply" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary-container rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-multiply" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center max-w-md mx-auto w-full px-6">
        
        {/* Header Section - Staggered Entrance */}
        <div className="flex flex-col items-center text-center mb-10 animate-slide-up">
          {/* Animated Brand Symbol */}
          <div className="mb-6 relative w-20 h-20 flex items-center justify-center">
             <div className="absolute inset-0 bg-primary-container/40 rounded-full blur-xl animate-pulse-slow" />
             <div className="relative w-16 h-16 animate-spin-slow">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary shadow-sm"></div>
                <div className="absolute top-1/2 right-0 -translate-y-1/2 w-4 h-4 rounded-full bg-surface-variant border border-outline-variant"></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-surface-variant border border-outline-variant"></div>
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-4 h-4 rounded-full bg-tertiary shadow-sm"></div>
             </div>
          </div>

          <h1 className="text-4xl font-normal tracking-tight text-on-surface">
            <span className="text-primary">Physio</span> <span className="font-light text-black">EZ</span>
          </h1>
          <p className="text-base text-on-surface-variant mt-2 font-normal tracking-wide">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Login Form card */}
        <div className="w-full animate-slide-up" style={{ animationDelay: '100ms' }}>
          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Email Input - M3 Filled Text Field (No Box, Gray Background) */}
            <div className="relative group">
              <input
                type="text"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                className={`
                  peer block w-full px-4 pt-6 pb-2 text-on-surface bg-surface-variant/30 rounded-t-lg h-14 
                  border-b-2 focus:outline-none transition-all duration-200
                  ${emailFocused ? 'border-primary bg-surface-variant/50' : 'border-outline/20 hover:border-on-surface/50'}
                  ${error ? 'border-error' : ''}
                `}
                placeholder=" "
              />
              <label
                htmlFor="email"
                className={`
                  absolute left-4 top-4 text-base transition-all duration-200 pointer-events-none origin-[0]
                  peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0
                  peer-focus:scale-75 peer-focus:-translate-y-3
                  ${email || emailFocused ? 'scale-75 -translate-y-3' : ''}
                  ${emailFocused ? 'text-primary' : 'text-on-surface-variant'}
                  ${error ? 'text-error' : ''}
                `}
              >
                Email or Username
              </label>
            </div>

            {/* Password Input - M3 Filled Text Field */}
            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                className={`
                  peer block w-full px-4 pt-6 pb-2 pr-12 text-on-surface bg-surface-variant/30 rounded-t-lg h-14
                  border-b-2 focus:outline-none transition-all duration-200
                  ${passwordFocused ? 'border-primary bg-surface-variant/50' : 'border-outline/20 hover:border-on-surface/50'}
                  ${error ? 'border-error' : ''}
                `}
                placeholder=" "
              />
              <label
                htmlFor="password"
                className={`
                  absolute left-4 top-4 text-base transition-all duration-200 pointer-events-none origin-[0]
                  peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0
                  peer-focus:scale-75 peer-focus:-translate-y-3
                  ${password || passwordFocused ? 'scale-75 -translate-y-3' : ''}
                  ${passwordFocused ? 'text-primary' : 'text-on-surface-variant'}
                  ${error ? 'text-error' : ''}
                `}
              >
                Password
              </label>
              
              {/* Toggle Password Visibility */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-4 text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-variant/50 transition-colors focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                   // Eye Off Icon
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                   </svg>
                ) : (
                   // Eye Icon
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                   </svg>
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-error/10 border border-error/20 text-error text-sm rounded-xl flex items-start gap-3 animate-scale-in">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end text-sm">
              <button 
                type="button" 
                onClick={() => setShowForgotPopup(true)} 
                className="font-medium text-primary hover:text-primary/80 transition-colors py-2"
              >
                Forgot password?
              </button>
            </div>

            {/* M3 Filled Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative overflow-hidden flex justify-center items-center py-3.5 px-6 rounded-full shadow-md text-sm font-medium tracking-wide text-on-primary bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
            >
              {/* Ripple Container would go here */}
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center space-y-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
          
          <div className="flex flex-col items-center space-y-2">
             <span className="px-3 py-1 rounded-full bg-surface-variant/50 text-on-surface-variant text-[11px] font-mono tracking-wider">
               v3.2.0
             </span>
             
             <p className="text-sm font-medium tracking-wide text-on-surface-variant">
               Created by <span className="text-primary font-bold">Sumit Srivastava</span>
             </p>
          </div>
        </div>

      </div>

      {/* Forgot Password Popup - M3 Alert Dialog */}
      {showForgotPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-variant rounded-[28px] shadow-2xl max-w-[312px] w-full p-6 text-center transform transition-all scale-100 animate-scale-in">
            <div className="w-10 h-10 mx-auto mb-4 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            
            <h3 className="text-2xl font-normal text-on-surface mb-2">Reset Password</h3>
            <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
              Please contact your system administrator to request a new password.
            </p>

            <div className="flex justify-end w-full">
                <button
                onClick={() => setShowForgotPopup(false)}
                className="px-6 py-2.5 text-primary font-medium hover:bg-on-surface/10 rounded-full transition-colors"
                >
                OK
                </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Custom styles for delays */}
      <style>{`
        .animation-delay-2000 { animation-delay: 2s; }
      `}</style>
    </div>
  );
};

export default LoginScreen;
