import * as React from 'react';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface overflow-hidden font-sans select-none">
      
      {/* Background Ambience - M3 Dynamic Blobs */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary-container rounded-full blur-[80px] animate-blob mix-blend-multiply" />
        <div className="absolute top-[20%] right-[-20%] w-[400px] h-[400px] bg-secondary-container rounded-full blur-[80px] animate-blob animation-delay-2000 mix-blend-multiply" />
        <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-tertiary-container rounded-full blur-[100px] animate-blob animation-delay-4000 mix-blend-multiply" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center">
        
        {/* Brand Icon - Scale In Entrance */}
        <div className="mb-8 relative animate-scale-in origin-center">
          <div className="relative w-28 h-28 flex items-center justify-center">
             {/* Center Glow */}
             <div className="absolute inset-0 bg-primary-container/60 rounded-full blur-2xl animate-pulse-slow" />
             
             {/* The Icon: Rotating M3 Shapes */}
             <div className="relative grid grid-cols-2 gap-3 animate-spin-slow">
                {/* Shape 1 - Top Left (Primary) */}
                <div className="w-6 h-6 rounded-2xl rounded-tl-lg bg-primary shadow-lg shadow-primary/20 animate-[spin_3s_linear_infinite]"></div>
                {/* Shape 2 - Top Right (Surface Variant) */}
                <div className="w-6 h-6 rounded-2xl rounded-tr-lg bg-surface-variant border border-white/50 animate-[spin_4s_linear_infinite_reverse]"></div>
                {/* Shape 3 - Bottom Left (Secondary Container) */}
                <div className="w-6 h-6 rounded-2xl rounded-bl-lg bg-secondary-container border border-white/50 animate-[spin_4s_linear_infinite]"></div>
                {/* Shape 4 - Bottom Right (Tertiary) */}
                <div className="w-6 h-6 rounded-2xl rounded-br-lg bg-tertiary shadow-lg shadow-tertiary/20 animate-[spin_3s_linear_infinite_reverse]"></div>
             </div>
          </div>
        </div>

        {/* Typography - Staggered Reveal */}
        <div className="text-center space-y-3 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h1 className="text-5xl md:text-6xl font-normal tracking-tight text-on-surface drop-shadow-sm">
            <span className="text-primary">Physio</span> <span className="font-light text-black">EZ</span>
          </h1>
          
          <div className="h-1 w-16 bg-gradient-to-r from-primary-container via-primary to-primary-container rounded-full mx-auto my-6 opacity-80"></div>

          <p className="text-sm md:text-base font-medium text-on-surface-variant tracking-[0.2em] uppercase">
            Next Gen Medical System
          </p>
        </div>

        {/* M3 Linear Progress Indicator */}
        <div className="mt-16 w-48 h-1 bg-surface-variant rounded-full overflow-hidden animate-fade-in" style={{ animationDelay: '400ms' }}>
          <div className="h-full bg-primary animate-[loading-bar_1.5s_ease-in-out_infinite] rounded-full origin-left"></div>
        </div>

      </div>

      {/* Footer Section */}
      <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center space-y-4 animate-fade-in" style={{ animationDelay: '600ms' }}>
         {/* Version Pill */}
         <span className="px-4 py-1.5 rounded-full bg-surface-variant/50 text-on-surface-variant text-[12px] font-medium tracking-wider backdrop-blur-md border border-outline-variant/20">
           v3.0.0
         </span>

         {/* Author Credit */}
         <p className="text-sm text-on-surface-variant font-medium">
           Created by <span className="text-primary font-bold">Sumit Srivastava</span>
         </p>
      </div>

      {/* Custom Keyframes for non-tailwind animations specific to this component */}
      <style>{`
        @keyframes loading-bar {
          0% { width: 0%; margin-left: 0; }
          50% { width: 70%; margin-left: 30%; }
          100% { width: 0%; margin-left: 100%; }
        }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
      
    </div>
  );
};

export default SplashScreen;
