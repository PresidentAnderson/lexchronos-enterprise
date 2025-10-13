'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-xl p-8 text-center">
        <div className="mb-6">
          {isOnline ? (
            <Wifi className="h-16 w-16 mx-auto text-green-500" />
          ) : (
            <WifiOff className="h-16 w-16 mx-auto text-red-500" />
          )}
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          {isOnline ? 'Connection Restored!' : 'You\'re Offline'}
        </h1>

        <p className="text-slate-600 dark:text-slate-300 mb-8">
          {isOnline
            ? 'Your internet connection has been restored. You can now access all features.'
            : 'LexChronos requires an internet connection to function properly. Some features may be limited while offline.'
          }
        </p>

        <div className="space-y-4">
          <button
            onClick={handleRetry}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            disabled={!isOnline && retryCount > 2}
          >
            <RefreshCw className="h-4 w-4" />
            {retryCount > 2 && !isOnline ? 'Too many retries' : 'Try Again'}
          </button>

          <button
            onClick={handleGoHome}
            className="w-full border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium py-3 px-6 rounded-lg transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Go to Home
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Status: {isOnline ? 'Online' : 'Offline'} • Retries: {retryCount}
          </p>
        </div>

        {!isOnline && (
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              💡 Tip: While offline, you can still view previously loaded cases and documents in your browser cache.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}