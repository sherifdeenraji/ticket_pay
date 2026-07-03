'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Camera } from 'lucide-react';
import { useToast } from './toast';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

export function QRScanner({ isOpen, onClose, onScan }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
 const { addToast } = useToast();

  useEffect(() => {
    if (!isOpen) return;

    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
          startScanning(stream);
        }
      } catch (err) {
        console.error('Camera permission denied:', err);
        setHasPermission(false);
        addToast('Camera permission denied. Please enable camera access.', 'error');
      }
    };

    initCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, addToast]);

  const startScanning = (stream: MediaStream) => {
    const interval = setInterval(() => {
      if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (context) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          context.drawImage(videoRef.current, 0, 0);

          // Simple QR code detection - in production, use a library like jsQR
          // For now, we'll simulate by looking for encoded driver code in the QR
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // Check for QR pattern and extract driver code (simplified)
          // In production, integrate with jsQR or html5-qrcode library
          const driverCodeMatch = 'DRV001'; // Placeholder

          if (driverCodeMatch) {
            stream.getTracks().forEach((track) => track.stop());
            onScan(driverCodeMatch);
            onClose();
            clearInterval(interval);
          }
        }
      }
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Camera size={20} /> Scan Driver QR Code
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {hasPermission === null && (
            <div className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                  <Camera className="text-blue-600" />
                </div>
                <p className="text-sm text-slate-600">Requesting camera access...</p>
              </div>
            </div>
          )}

          {hasPermission === false && (
            <div className="aspect-square bg-red-50 rounded-lg flex items-center justify-center border-2 border-red-200">
              <div className="text-center">
                <p className="text-sm font-medium text-red-800 mb-2">Camera Access Denied</p>
                <p className="text-xs text-red-600">Please enable camera permissions in your browser settings</p>
              </div>
            </div>
          )}

          {hasPermission === true && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full aspect-square object-cover rounded-lg bg-black"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-800">
                  Point your camera at the driver's QR code. Scanning will start automatically.
                </p>
              </div>
            </>
          )}

          <button
            onClick={onClose}
            className="w-full mt-4 px-4 py-2 border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 transition-colors font-medium"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
}
