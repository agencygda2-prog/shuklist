'use client';

import { useState, useRef, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Camera, X, Upload, RotateCcw } from 'lucide-react';

interface CameraCaptureProps {
  onImageCaptured: (imageUrl: string) => void;
  onClose: () => void;
}

export default function CameraCapture({ onImageCaptured, onClose }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const supabase = createClientComponentClient();

  // Start camera when component mounts
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const imageUrl = URL.createObjectURL(blob);
          setCapturedImage(imageUrl);
          stopCamera();
        }
      }, 'image/jpeg', 0.85); // 85% quality for compression
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setError(null);
    startCamera();
  };

  const compressImage = async (blob: Blob): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Maximum dimensions
        const maxWidth = 800;
        const maxHeight = 800;
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((compressedBlob) => {
            resolve(compressedBlob || blob);
          }, 'image/jpeg', 0.8); // 80% quality
        } else {
          resolve(blob);
        }
      };

      img.src = URL.createObjectURL(blob);
    });
  };

  const uploadImage = async () => {
    if (!capturedImage) return;

    setUploading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Convert data URL to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      // Compress image
      const compressedBlob = await compressImage(blob);

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${user.id}/${timestamp}.jpg`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filename, compressedBlob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filename);

      console.log('Image uploaded successfully:', publicUrl);
      
      // Pass URL back to parent
      onImageCaptured(publicUrl);
      
      // Close camera
      onClose();
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {capturedImage ? 'Preview Photo' : 'Take Photo'}
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500 text-white px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Camera View or Preview */}
      <div className="flex-1 relative bg-black flex items-center justify-center">
        {!capturedImage ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
            <canvas ref={canvasRef} className="hidden" />
          </>
        ) : (
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-contain"
          />
        )}
      </div>

      {/* Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 p-4 pb-8 z-50" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
        {!capturedImage ? (
        <div className="flex justify-center items-center" style={{ minHeight: '100px' }}>
            <button
              onClick={capturePhoto}
            className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 hover:border-orange-500 transition-colors flex items-center justify-center shadow-lg"
aria-label="Capture photo"
            >
            <Camera className="w-7 h-7 text-gray-700" />
            </button>
          </div>
        ) : (
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={retakePhoto}
              disabled={uploading}
              className="px-5 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
            <RotateCcw className="w-4 h-4" />
              Retake
            </button>
            <button
              onClick={uploadImage}
              disabled={uploading}
              className="px-5 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {uploading ? (
                <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                <Upload className="w-4 h-4" />
                  Use Photo
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
