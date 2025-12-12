import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, AlertCircle, Loader2 } from 'lucide-react';

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
        errorMessage = "This domain is not authorized in your Firebase Console.";
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
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="bg-surface p-8 rounded-2xl border border-slate-700 shadow-2xl flex flex-col items-center max-w-md w-full text-center">
        <div className="w-16 h-16 bg-gradient-to-tr from-primary to-accent rounded-xl mb-6 shadow-lg shadow-blue-500/20"></div>
        <h1 className="text-3xl font-bold text-white mb-2">HabitPulse</h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          Track your habits, journal your days, and visualize your personal growth with AI-powered insights.
        </p>
        
        {error && (
          <div className="w-full mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3 text-left">
            <AlertCircle className="text-red-400 shrink-0" size={20} />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}
        
        <button
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="w-full py-3.5 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoggingIn ? (
            <Loader2 className="animate-spin text-primary" size={20} />
          ) : (
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          )}
          {isLoggingIn ? "Signing in..." : "Sign in with Google"}
        </button>
      </div>
    </div>
  );
};