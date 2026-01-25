'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { OpenFoodFactsResponse, Product } from '@/types';

interface BarcodeScannerProps {
  onProductScanned: (product: Partial<Product>) => void;
  onClose: () => void;
}

// Declare BarcodeDetector type for browsers that support it
declare global {
  interface Window {
    BarcodeDetector: any;
  }
}

export default function BarcodeScanner({ onProductScanned, onClose }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startScanning();

    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      setIsScanning(true);

      // Check if BarcodeDetector is available
      if (!('BarcodeDetector' in window)) {
        console.log('BarcodeDetector not supported, using fallback');
        setUseFallback(true);
        toast.error('Native barcode scanning not supported. Please enter barcode manually.');
        onClose();
        return;
      }

      // Get camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Create barcode detector
      const barcodeDetector = new window.BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39']
      });

      // Start scanning loop
      scanIntervalRef.current = setInterval(async () => {
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            
            if (barcodes.length > 0) {
              const barcode = barcodes[0].rawValue;
              console.log('✅ Barcode detected:', barcode);

              // Stop scanning
              stopScanning();

              // Fetch product data
              await fetchProductData(barcode);
            }
          } catch (error) {
            console.error('Detection error:', error);
          }
        }
      }, 100); // Check every 100ms

    } catch (error: any) {
      console.error('Camera error:', error);
      toast.error(error.message || 'Failed to access camera');
      onClose();
    }
  };

  const stopScanning = () => {
    // Stop scanning interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsScanning(false);
  };

  const fetchProductData = async (barcode: string) => {
    setIsFetching(true);

    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch product data');
      }

      const data: OpenFoodFactsResponse = await response.json();

      if (data.status === 1 && data.product) {
        const product = data.product;

        const productData: Partial<Product> = {
          name: product.product_name || 'Unknown Product',
          brand: product.brands || undefined,
          barcode: barcode,
          default_unit: product.quantity || '1 unit',
          image_url: product.image_url || product.image_small_url || undefined,
          category: guessCategory(product.categories || ''),
        };

        toast.success(`Product found: ${productData.name}`);
        onProductScanned(productData);
      } else {
        toast.error('Product not found - please add manually');
        onProductScanned({
          barcode: barcode,
          name: '',
          default_unit: '1 unit',
        });
      }
    } catch (error: any) {
      console.error('Product fetch error:', error);
      toast.error('Failed to fetch product data');

      onProductScanned({
        barcode: barcode,
        name: '',
        default_unit: '1 unit',
      });
    } finally {
      setIsFetching(false);
    }
  };

  const guessCategory = (categories: string): string => {
    const lowerCategories = categories.toLowerCase();

    if (lowerCategories.includes('pasta') || lowerCategories.includes('rice')) {
      return 'Pasta & Rice';
    } else if (lowerCategories.includes('bread') || lowerCategories.includes('bakery')) {
      return 'Bread & Bakery';
    } else if (lowerCategories.includes('dairy') || lowerCategories.includes('milk') || lowerCategories.includes('cheese')) {
      return 'Dairy & Eggs';
    } else if (lowerCategories.includes('meat') || lowerCategories.includes('fish')) {
      return 'Meat & Fish';
    } else if (lowerCategories.includes('fruit') || lowerCategories.includes('vegetable')) {
      return 'Fruits & Vegetables';
    } else if (lowerCategories.includes('frozen')) {
      return 'Frozen Foods';
    } else if (lowerCategories.includes('sauce') || lowerCategories.includes('condiment')) {
      return 'Pantry & Sauces';
    } else if (lowerCategories.includes('oil')) {
      return 'Oils & Condiments';
    } else if (lowerCategories.includes('snack') || lowerCategories.includes('sweet') || lowerCategories.includes('chocolate')) {
      return 'Snacks & Sweets';
    } else if (lowerCategories.includes('beverage') || lowerCategories.includes('drink') || lowerCategories.includes('juice')) {
      return 'Beverages';
    } else if (lowerCategories.includes('coffee') || lowerCategories.includes('tea')) {
      return 'Coffee & Tea';
    }

    return 'Pantry & Sauces';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      <div className="bg-black text-white p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Scan Barcode</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center bg-black">
        <video
          ref={videoRef}
          className="max-w-full max-h-full"
          autoPlay
          playsInline
          muted
        />

        {isScanning && !isFetching && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-4 border-orange-500 w-72 h-40 rounded-lg shadow-lg">
              <div className="absolute top-0 left-0 w-full h-1 bg-orange-500 animate-pulse"></div>
            </div>
          </div>
        )}

        {isFetching && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-gray-700 font-medium">Fetching product data...</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-black text-white p-4 text-center">
        <p className="text-sm text-gray-300">
          {isScanning 
            ? "Hold barcode steady in the frame" 
            : "Initializing camera..."}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Works best with good lighting
        </p>
      </div>
    </div>
  );
}