'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, X, RotateCcw, Download, Upload, Flashlight, FlashlightOff, SwitchCamera } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentScannerProps {
  onCapture: (imageData: string, metadata: CaptureMetadata) => void;
  onClose: () => void;
  className?: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

interface CaptureMetadata {
  timestamp: number;
  width: number;
  height: number;
  orientation: number;
  devicePixelRatio: number;
}

export function DocumentScanner({
  onCapture,
  onClose,
  className,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.85,
}: DocumentScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasFlash, setHasFlash] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [error, setError] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string>('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Get available camera devices
  const getCameraDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      
      // Prefer back camera for document scanning
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );
      
      if (backCamera) {
        setSelectedDeviceId(backCamera.deviceId);
      }
    } catch (error) {
      console.error('Error getting camera devices:', error);
    }
  }, []);

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      setError('');
      
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920, max: 4096 },
          height: { ideal: 1080, max: 4096 },
          aspectRatio: { ideal: 16/9 },
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Check for flash/torch support
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        setHasFlash('torch' in capabilities);
        
        setIsStreaming(true);
      }
    } catch (error) {
      console.error('Error starting camera:', error);
      setError('Unable to access camera. Please check permissions and try again.');
    }
  }, [facingMode, selectedDeviceId]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setFlashEnabled(false);
  }, []);

  // Toggle flash/torch
  const toggleFlash = useCallback(async () => {
    if (!videoRef.current?.srcObject || !hasFlash) return;
    
    try {
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      
      await track.applyConstraints({
        advanced: [{ torch: !flashEnabled }] as any
      });
      
      setFlashEnabled(!flashEnabled);
    } catch (error) {
      console.error('Error toggling flash:', error);
    }
  }, [flashEnabled, hasFlash]);

  // Switch camera
  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  // Capture photo
  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate dimensions maintaining aspect ratio
    let { videoWidth, videoHeight } = video;
    let canvasWidth = videoWidth;
    let canvasHeight = videoHeight;

    // Resize if larger than max dimensions
    if (canvasWidth > maxWidth) {
      canvasHeight = (canvasHeight * maxWidth) / canvasWidth;
      canvasWidth = maxWidth;
    }
    if (canvasHeight > maxHeight) {
      canvasWidth = (canvasWidth * maxHeight) / canvasHeight;
      canvasHeight = maxHeight;
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Apply image enhancements for better document scanning
    ctx.filter = 'contrast(1.1) brightness(1.05) saturate(0.9)';
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvasWidth, canvasHeight);
    
    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', quality);
    
    const metadata: CaptureMetadata = {
      timestamp: Date.now(),
      width: canvasWidth,
      height: canvasHeight,
      orientation: screen.orientation?.angle || 0,
      devicePixelRatio: window.devicePixelRatio || 1,
    };

    setCapturedImage(imageData);
    onCapture(imageData, metadata);
  }, [maxWidth, maxHeight, quality, onCapture]);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      
      // Create image to get dimensions
      const img = new Image();
      img.onload = () => {
        const metadata: CaptureMetadata = {
          timestamp: Date.now(),
          width: img.width,
          height: img.height,
          orientation: 0,
          devicePixelRatio: 1,
        };
        
        setCapturedImage(imageData);
        onCapture(imageData, metadata);
      };
      img.src = imageData;
    };
    reader.readAsDataURL(file);
  }, [onCapture]);

  // Retake photo
  const retakePhoto = useCallback(() => {
    setCapturedImage('');
  }, []);

  // Download captured image
  const downloadImage = useCallback(() => {
    if (!capturedImage) return;
    
    const link = document.createElement('a');
    link.href = capturedImage;
    link.download = `document_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.jpg`;
    link.click();
  }, [capturedImage]);

  // Initialize camera on mount
  useEffect(() => {
    getCameraDevices();
    startCamera();
    
    return () => {
      stopCamera();
    };
  }, [getCameraDevices, startCamera, stopCamera]);

  // Restart camera when facing mode changes
  useEffect(() => {
    if (isStreaming) {
      stopCamera();
      setTimeout(() => startCamera(), 100);
    }
  }, [facingMode, selectedDeviceId, isStreaming, startCamera, stopCamera]);

  // Handle orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      if (isStreaming) {
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.style.transform = 'none';
          }
        }, 100);
      }
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    return () => window.removeEventListener('orientationchange', handleOrientationChange);
  }, [isStreaming]);

  return (
    <div className={cn(
      'fixed inset-0 bg-black z-50 flex flex-col',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 z-10">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        
        <h1 className="text-white font-semibold text-lg">Document Scanner</h1>
        
        <div className="flex items-center gap-2">
          {/* Camera switch */}
          {devices.length > 1 && (
            <button
              onClick={switchCamera}
              className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              title="Switch camera"
            >
              <SwitchCamera className="w-5 h-5" />
            </button>
          )}
          
          {/* Flash toggle */}
          {hasFlash && (
            <button
              onClick={toggleFlash}
              className={cn(
                'p-2 rounded-full transition-colors',
                flashEnabled 
                  ? 'bg-yellow-500 text-black' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              )}
              title={flashEnabled ? 'Turn off flash' : 'Turn on flash'}
            >
              {flashEnabled ? (
                <Flashlight className="w-5 h-5" />
              ) : (
                <FlashlightOff className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Camera view or captured image */}
      <div className="flex-1 relative">
        {capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured document"
            className="w-full h-full object-contain bg-black"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover bg-black"
              playsInline
              muted
              autoPlay
            />
            
            {/* Camera overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Scanning guide */}
              <div className="absolute inset-4 border-2 border-white/50 rounded-lg">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white"></div>
              </div>
              
              {/* Instructions */}
              <div className="absolute bottom-20 left-0 right-0 text-center">
                <p className="text-white bg-black/50 px-4 py-2 rounded-full inline-block text-sm">
                  Position document within the frame
                </p>
              </div>
            </div>
          </>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="bg-red-500 text-white p-4 rounded-lg max-w-sm text-center">
              <p>{error}</p>
              <button
                onClick={startCamera}
                className="mt-2 px-4 py-2 bg-white text-red-500 rounded hover:bg-gray-100 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 bg-black/50 flex items-center justify-center gap-6">
        {capturedImage ? (
          <>
            <button
              onClick={retakePhoto}
              className="p-4 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              title="Retake photo"
            >
              <RotateCcw className="w-6 h-6" />
            </button>
            
            <button
              onClick={downloadImage}
              className="p-4 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              title="Download image"
            >
              <Download className="w-6 h-6" />
            </button>
          </>
        ) : (
          <>
            {/* File upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-4 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              title="Upload from gallery"
            >
              <Upload className="w-6 h-6" />
            </button>
            
            {/* Capture button */}
            <button
              onClick={capturePhoto}
              disabled={!isStreaming}
              className="p-6 rounded-full bg-white hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Capture photo"
            >
              <Camera className="w-8 h-8 text-black" />
            </button>
          </>
        )}
      </div>

      {/* Hidden canvas for image processing */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />
    </div>
  );
}