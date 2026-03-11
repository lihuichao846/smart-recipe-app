'use client';

import React, { useRef, useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
}

// Function to compress image
const compressImage = (base64Str: string, maxWidth = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(base64Str); // Fallback to original if context fails
      }
    };
    img.onerror = () => {
      resolve(base64Str); // Fallback on error
    };
  });
};

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraOpen(true);
      setError('');
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError('无法访问相机，请尝试上传图片。');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      setIsProcessing(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg');
        
        // Compress before sending
        const compressedData = await compressImage(imageData);
        onCapture(compressedData);
        
        stopCamera();
      }
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (typeof reader.result === 'string') {
          // Compress uploaded image
          const compressedData = await compressImage(reader.result);
          onCapture(compressedData);
        }
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
      {isCameraOpen ? (
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          <button 
            onClick={stopCamera}
            className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
          >
            <X size={20} />
          </button>
          <button 
            onClick={capturePhoto}
            disabled={isProcessing}
            className="absolute bottom-6 left-1/2 transform -translate-x-1/2 px-8 py-3 bg-white text-black font-black rounded-full shadow-xl hover:bg-gray-100 hover:scale-105 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? '处理中...' : '拍 照'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 py-10 w-full">
          <div className="flex gap-4 w-full justify-center">
            <button 
              onClick={startCamera}
              disabled={isProcessing}
              className="btn-cute btn-primary shadow-lg shadow-orange-200 disabled:opacity-50"
            >
              <Camera size={20} />
              打开相机
            </button>
            <label className={`btn-cute btn-secondary shadow-lg shadow-green-100 cursor-pointer ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <Upload size={20} />
              {isProcessing ? '处理中...' : '上传图片'}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload} 
                className="hidden" 
                disabled={isProcessing}
              />
            </label>
          </div>
          {error && <p className="text-[var(--error-text)] text-sm font-bold bg-[var(--error-bg)] px-4 py-2 rounded-lg">{error}</p>}
          <p className="text-gray-400 text-sm font-medium">拍摄冰箱食材或上传照片</p>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
