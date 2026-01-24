'use client';

import { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Camera, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { OpenFoodFactsResponse, Product } from '@/types';

interface BarcodeScannerProps {
  onProductScanned: (product: Partial<Product>) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onProductScanned, onClose }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    startScanning();

    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      setIsScanning(true);
      
      // Initialize the code reader
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      // Get available video input devices
      const videoInputDevices = await codeReader.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        throw new Error('No camera found on this device');
      }

      // Use the first camera (usually back camera on mobile)
      const selectedDeviceId = videoInputDevices[0].deviceId;

      // Start decoding from video device
      if (videoRef.current) {
        codeReader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          async (result, error) => {
            if (result) {
              const barcode = result.getText();
              console.log('Barcode detected:', barcode);
              
              // Stop scanning while we fetch product data
              stopScanning();
              
              // Fetch product data from Open Food Facts
              await fetchProductData(barcode);
            }
          }
        );
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      toast.error(error.message || 'Failed to access camera');
      onClose();
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
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

        // Extract relevant product information
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
        // Product not found in database
        toast.error('Product not found in database - please add manually');
        onProductScanned({
          barcode: barcode,
          name: '',
          default_unit: '1 unit',
        });
      }
    } catch (error: any) {
      console.error('Product fetch error:', error);
      toast.error('Failed to fetch product data');
      
      // Still pass the barcode for manual entry
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
    
    // Default fallback
    return 'Pantry & Sauces';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-black text-white p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Scan Barcode</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Video Feed */}
      <div className="flex-1 relative flex items-center justify-center">
        <video
          ref={videoRef}
          className="max-w-full max-h-full"
          autoPlay
          playsInline
        />

        {/* Scanning overlay */}
        {isScanning && !isFetching && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-4 border-primary w-64 h-48 rounded-lg"></div>
          </div>
        )}

        {/* Loading indicator */}
        {isFetching && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-gray-700 font-medium">Fetching product data...</p>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-black text-white p-4 text-center">
        <p className="text-sm text-gray-300">
          Point your camera at a product barcode
        </p>
      </div>
    </div>
  );
}
