import * as React from 'react';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white overflow-hidden font-sans">
      
      {/* Background Ambience - Light Aurora Effect */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-teal-200/30 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] bg-indigo-200/30 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center">
        
        {/* Animated Brand Symbol */}
        <div className="mb-12 relative group">
          <div className="relative w-24 h-24 flex items-center justify-center">
             {/* Center Glow */}
             <div className="absolute inset-0 bg-teal-400/20 rounded-full blur-2xl animate-pulse" />
             
             {/* The Icon: Rotating Dots Container */}
             <div className="relative grid grid-cols-2 gap-2 animate-spin-slow">
                {/* Dot 1 - Top Left */}
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 shadow-lg shadow-teal-500/30"></div>
                {/* Dot 2 - Top Right */}
                <div className="w-5 h-5 rounded-full bg-slate-300"></div>
                {/* Dot 3 - Bottom Left */}
                <div className="w-5 h-5 rounded-full bg-slate-300"></div>
                {/* Dot 4 - Bottom Right */}
                <div className="w-5 h-5 rounded-full bg-gradient-to-bl from-teal-600 to-cyan-500 shadow-lg shadow-teal-500/30"></div>
             </div>
          </div>
        </div>

        {/* Typography - Modern Dark on Light */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-800 drop-shadow-sm">
            CareSync<span className="font-light text-teal-600">OS</span>
          </h1>
          
          <div className="h-px w-20 bg-gradient-to-r from-transparent via-slate-300 to-transparent mx-auto my-6"></div>

          <p className="text-sm md:text-base font-semibold text-slate-500 tracking-[0.3em] uppercase">
            Next Gen Medical System
          </p>
        </div>

        {/* Loading Indicator - Teal Gradient Line */}
        <div className="mt-14 w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
          <div className="h-full bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-500 animate-loading-bar rounded-full"></div>
        </div>

      </div>

      {/* Footer Section */}
      <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center space-y-3">
         {/* Version Pill */}
         <span className="px-3 py-1 rounded-full border border-slate-200 bg-white/50 text-[11px] font-mono text-slate-400 tracking-wider backdrop-blur-sm shadow-sm">
           v2.5.0
         </span>

         {/* Author Credit - Stylized Gradient */}
         <p className="text-sm font-medium tracking-wide">
           <span className="text-slate-400">Created by </span>
           <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 bg-clip-text text-transparent font-bold">
             Sumit Srivastava
           </span>
         </p>
      </div>
      
      <style>{`
        @keyframes loading-bar {
          0% { width: 0%; transform: translateX(-100%); opacity: 0; }
          40% { width: 60%; transform: translateX(0); opacity: 1; }
          100% { width: 100%; transform: translateX(100%); opacity: 0; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-loading-bar {
          animation: loading-bar 2s infinite ease-in-out;
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        .animate-pulse-slow {
          animation: pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
