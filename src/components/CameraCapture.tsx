'use client';

import React, { useRef, useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
}

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');

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

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg');
        onCapture(imageData);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onCapture(reader.result);
        }
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
            className="absolute bottom-6 left-1/2 transform -translate-x-1/2 px-8 py-3 bg-white text-black font-black rounded-full shadow-xl hover:bg-gray-100 hover:scale-105 transition-all active:scale-95"
          >
            拍 照
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 py-10 w-full">
          <div className="flex gap-4 w-full justify-center">
            <button 
              onClick={startCamera}
              className="btn-cute btn-primary shadow-lg shadow-orange-200"
            >
              <Camera size={20} />
              打开相机
            </button>
            <label className="btn-cute btn-secondary shadow-lg shadow-green-100 cursor-pointer">
              <Upload size={20} />
              上传图片
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload} 
                className="hidden" 
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
