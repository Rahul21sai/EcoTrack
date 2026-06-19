import { useAuth } from '../hooks/useAuth';
import type { ReactNode } from 'react';

interface AuthGateProps {
  children: ReactNode;
}

/**
 * Authentication gate component that wraps the app.
 * Shows a loading spinner while auth state is being determined,
 * a Google Sign-In screen if the user is not authenticated,
 * or renders children if the user is signed in.
 */
export default function AuthGate({ children }: AuthGateProps) {
  const { user, loading, error, signIn } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-800 max-w-md w-full mx-4 text-center">
          <div className="text-5xl mb-4">🌍</div>
          <h1 className="text-3xl font-bold text-white mb-2">EcoTrack</h1>
          <p className="text-gray-400 mb-6">
            Track, understand, and reduce your carbon footprint with personalized insights.
          </p>
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 p-3 rounded-lg mb-4" role="alert">
              {error}
            </div>
          )}
          <button
            onClick={() => void signIn()}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-semibold py-3 px-6 rounded-xl hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl"
            aria-label="Sign in with Google"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
          <p className="text-gray-600 text-sm mt-6">
            No password required — secure Google Sign-In only.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
