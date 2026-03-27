import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Loader2, Skull } from 'lucide-react';

export const LoginPage = () => {
  const { googleSignIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      await googleSignIn();
    } catch (err: any) {
      console.error("Login Failed:", err);
      
      let errorMessage = "Failed to sign in. Please try again.";
      
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign in was cancelled.";
      } else if (err.code === 'auth/unauthorized-domain') {
        errorMessage = `This domain is not authorized in your Firebase Console.
        
Please add this domain to your Firebase Console:
1. Go to Authentication > Settings > Authorized domains
2. Add: ${window.location.hostname}`;
      } else if (err.code === 'auth/configuration-not-found') {
        errorMessage = "Firebase configuration issue. Check your API keys.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-black relative overflow-hidden">
      {/* Glitchy Background Effects */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,_#1e3a8a_0%,_transparent_60%)] animate-pulse" />
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #1e3a8a 2px, #1e3a8a 4px)' }} />

      <div className="bg-slate-950/80 p-10 border border-blue-900/50 flex flex-col items-center max-w-md w-full text-center z-10 backdrop-blur-sm shadow-[0_0_40px_rgba(30,58,138,0.3)]">
        <div className="flex flex-col items-center gap-4 mb-8">
          <Skull size={48} className="text-blue-500 animate-pulse" strokeWidth={1.5} />
          <h1 className="text-4xl font-display font-bold text-white tracking-widest uppercase glitch-text" data-text="SYSTEM LOGIN">
            SYSTEM LOGIN
          </h1>
          <p className="text-blue-400/80 tracking-widest uppercase text-xs">
            Authenticate to access the player dashboard
          </p>
        </div>
        
        {error && (
          <div className="w-full mb-6 p-4 bg-red-950/50 border border-red-800 flex items-start gap-3 text-left">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-red-400 font-display tracking-wider uppercase whitespace-pre-wrap">{error}</p>
          </div>
        )}
        
        <button
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="w-full py-4 bg-blue-950/50 hover:bg-blue-900/80 text-blue-400 hover:text-blue-300 border border-blue-800 hover:border-blue-500 font-display text-lg tracking-widest uppercase transition-all flex items-center justify-center gap-4 shadow-[0_0_15px_rgba(30,58,138,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoggingIn ? (
            <Loader2 className="animate-spin text-blue-500" size={24} />
          ) : (
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
          )}
          {isLoggingIn ? "AUTHENTICATING..." : "SIGN IN WITH GOOGLE"}
        </button>
      </div>

      <style>{`
        .glitch-text {
          position: relative;
        }
        .glitch-text::before, .glitch-text::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: transparent;
        }
        .glitch-text::before {
          left: 2px;
          text-shadow: -1px 0 #3b82f6;
          clip: rect(24px, 550px, 90px, 0);
          animation: glitch-anim-2 3s infinite linear alternate-reverse;
        }
        .glitch-text::after {
          left: -2px;
          text-shadow: -1px 0 #1e3a8a;
          clip: rect(85px, 550px, 140px, 0);
          animation: glitch-anim 2.5s infinite linear alternate-reverse;
        }
        @keyframes glitch-anim {
          0% { clip: rect(11px, 9999px, 88px, 0); }
          20% { clip: rect(61px, 9999px, 14px, 0); }
          40% { clip: rect(38px, 9999px, 66px, 0); }
          60% { clip: rect(92px, 9999px, 9px, 0); }
          80% { clip: rect(2px, 9999px, 83px, 0); }
          100% { clip: rect(79px, 9999px, 34px, 0); }
        }
        @keyframes glitch-anim-2 {
          0% { clip: rect(65px, 9999px, 100px, 0); }
          20% { clip: rect(3px, 9999px, 5px, 0); }
          40% { clip: rect(45px, 9999px, 82px, 0); }
          60% { clip: rect(12px, 9999px, 98px, 0); }
          80% { clip: rect(88px, 9999px, 22px, 0); }
          100% { clip: rect(31px, 9999px, 67px, 0); }
        }
      `}</style>
    </div>
  );
};