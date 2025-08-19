'use client';

import { useState, useCallback } from 'react';
import { TouchTimeline } from '@/components/touch-timeline';
import { DocumentScanner } from '@/components/document-scanner';
import { LazyImage } from '@/components/lazy-image';
import { useOfflineStorage } from '@/lib/offline-storage';
import { 
  Camera, 
  Timeline, 
  Download, 
  Wifi, 
  Battery, 
  Smartphone,
  Gesture,
  Bell,
  Zap
} from 'lucide-react';

export default function DemoPage() {
  const [showScanner, setShowScanner] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const { data: demoData, save: saveDemoData } = useOfflineStorage('demo');

  // Mock timeline data
  const timelineEvents = [
    { id: 1, title: 'Case Filed', date: '2024-01-15', description: 'Initial case filing', type: 'milestone' },
    { id: 2, title: 'Discovery Period', date: '2024-02-01', description: 'Document discovery phase', type: 'period' },
    { id: 3, title: 'Deposition Scheduled', date: '2024-03-10', description: 'Client deposition', type: 'event' },
    { id: 4, title: 'Motion Filed', date: '2024-03-25', description: 'Summary judgment motion', type: 'legal' },
    { id: 5, title: 'Hearing Date', date: '2024-04-15', description: 'Court hearing scheduled', type: 'milestone' },
  ];

  const handleImageCapture = useCallback((imageData: string, metadata: any) => {
    setCapturedImages(prev => [...prev, imageData]);
    setShowScanner(false);
    
    // Save to offline storage
    saveDemoData({
      id: Date.now().toString(),
      type: 'document_scan',
      imageData,
      metadata,
      timestamp: Date.now(),
    });
  }, [saveDemoData]);

  const requestNotification = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('LexChronos Demo', {
          body: 'This is a sample push notification!',
          icon: '/icons/icon-192x192.svg',
          badge: '/icons/icon-72x72.svg',
          tag: 'demo-notification'
        });
      }
    }
  };

  const testOfflineSync = async () => {
    await saveDemoData({
      id: Date.now().toString(),
      type: 'test_sync',
      message: 'This data will sync when online',
      timestamp: Date.now(),
    });
    alert('Data saved offline! It will sync when you\'re back online.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            LexChronos PWA Demo
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Experience mobile-optimized legal case management with offline capabilities
          </p>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Touch Gestures */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Gesture className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Touch Gestures
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
              Pinch to zoom, swipe to navigate, double-tap to reset. Optimized for mobile interaction.
            </p>
            <div className="flex gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">Pinch Zoom</span>
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">Pan</span>
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">Swipe</span>
            </div>
          </div>

          {/* Document Scanner */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Camera className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Document Scanner
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
              Native camera integration with document enhancement and auto-crop functionality.
            </p>
            <button
              onClick={() => setShowScanner(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Open Scanner
            </button>
          </div>

          {/* Offline Sync */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                <Wifi className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Offline Sync
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
              Work offline with automatic background sync when connection is restored.
            </p>
            <button
              onClick={testOfflineSync}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Test Offline Save
            </button>
          </div>

          {/* Push Notifications */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Bell className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Push Notifications
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
              Stay updated with case deadlines and important events through native notifications.
            </p>
            <button
              onClick={requestNotification}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Test Notification
            </button>
          </div>

          {/* Performance */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <Zap className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Performance
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
              Optimized for mobile devices with lazy loading, compression, and efficient rendering.
            </p>
            <div className="flex gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">Lazy Load</span>
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">Cache</span>
            </div>
          </div>

          {/* Mobile First */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                <Smartphone className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Mobile First
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
              Designed for mobile devices with responsive layout and native app experience.
            </p>
            <div className="flex gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">iOS</span>
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">Android</span>
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">PWA</span>
            </div>
          </div>
        </div>

        {/* Interactive Timeline Demo */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 mb-8">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <Timeline className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Interactive Timeline
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              Touch and drag to pan, pinch to zoom, swipe to navigate. Try it on mobile!
            </p>
          </div>
          
          <TouchTimeline 
            className="h-96"
            onSwipeLeft={() => console.log('Swiped left')}
            onSwipeRight={() => console.log('Swiped right')}
          >
            <div className="p-8 space-y-6">
              {timelineEvents.map((event, index) => (
                <div key={event.id} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-4 h-4 bg-blue-600 rounded-full mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 dark:text-white">
                      {event.title}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">
                      {event.date}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {event.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TouchTimeline>
        </div>

        {/* Captured Images */}
        {capturedImages.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Captured Documents
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Documents scanned using the integrated camera
              </p>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {capturedImages.map((image, index) => (
                <LazyImage
                  key={index}
                  src={image}
                  alt={`Captured document ${index + 1}`}
                  className="aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Document Scanner Modal */}
      {showScanner && (
        <DocumentScanner
          onCapture={handleImageCapture}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}